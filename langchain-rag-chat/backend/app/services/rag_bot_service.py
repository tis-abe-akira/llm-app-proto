"""RAG BOT management service for document-based AI assistants.

This module provides RAG BOT creation, management, and document processing
functionality with ChromaDB vector storage and OpenAI embeddings.
"""

import os
import json
import uuid
from typing import List, Dict, Optional
from pathlib import Path

from langchain_openai import OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import (
    PyPDFLoader,
    UnstructuredMarkdownLoader,
    UnstructuredExcelLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.core.config import settings


class RAGBotService:
    """Service for managing RAG-enabled chat bots with document knowledge bases.
    
    Handles bot creation, document processing, vector database management,
    and bot metadata persistence.
    
    Attributes:
        embeddings: OpenAI embeddings instance for document vectorization.
        bots_data_dir: Directory path for storing bot data and metadata.
        vector_db_dir: Directory path for ChromaDB storage.
        text_splitter: Document text splitter for chunking.
    """
    
    def __init__(self):
        """Initialize RAGBotService with embeddings and storage paths."""
        self.embeddings = OpenAIEmbeddings(
            api_key=settings.openai_api_key,
            model="text-embedding-3-small"
        )
        
        # Storage directories
        self.bots_data_dir = Path("./data/bots")
        self.vector_db_dir = Path("./data/vector_db")
        self.bots_data_dir.mkdir(parents=True, exist_ok=True)
        self.vector_db_dir.mkdir(parents=True, exist_ok=True)
        
        # Document text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
    
    def create_bot(self, name: str, description: str = "") -> Dict:
        """Create a new RAG bot with metadata.
        
        Args:
            name: Bot display name.
            description: Optional bot description.
            
        Returns:
            Dict: Bot metadata including ID, name, description, and creation time.
        """
        bot_id = str(uuid.uuid4())
        bot_data = {
            "id": bot_id,
            "name": name,
            "description": description,
            "created_at": datetime.now().isoformat(),
            "documents": [],
            "document_count": 0
        }
        
        # Save bot metadata
        bot_file = self.bots_data_dir / f"{bot_id}.json"
        with open(bot_file, 'w', encoding='utf-8') as f:
            json.dump(bot_data, f, indent=2, ensure_ascii=False)
        
        return bot_data
    
    def get_bot(self, bot_id: str) -> Optional[Dict]:
        """Retrieve bot metadata by ID.
        
        Args:
            bot_id: Bot identifier.
            
        Returns:
            Optional[Dict]: Bot metadata or None if not found.
        """
        bot_file = self.bots_data_dir / f"{bot_id}.json"
        if not bot_file.exists():
            return None
        
        with open(bot_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def list_bots(self) -> List[Dict]:
        """List all available RAG bots.
        
        Returns:
            List[Dict]: List of bot metadata dictionaries.
        """
        bots = []
        for bot_file in self.bots_data_dir.glob("*.json"):
            with open(bot_file, 'r', encoding='utf-8') as f:
                bots.append(json.load(f))
        
        # Sort by creation time (most recent first)
        return sorted(bots, key=lambda x: x["created_at"], reverse=True)
    
    def delete_bot(self, bot_id: str) -> bool:
        """Delete a RAG bot and its associated data.
        
        Args:
            bot_id: Bot identifier to delete.
            
        Returns:
            bool: True if deletion successful, False otherwise.
        """
        bot_file = self.bots_data_dir / f"{bot_id}.json"
        if not bot_file.exists():
            return False
        
        # Remove bot metadata file
        bot_file.unlink()
        
        # Remove vector database directory if exists
        vector_db_path = self.vector_db_dir / bot_id
        if vector_db_path.exists():
            import shutil
            shutil.rmtree(vector_db_path)
        
        return True
    
    async def process_document(self, bot_id: str, file_path: str, filename: str) -> bool:
        """Process and add document to bot's knowledge base.
        
        Args:
            bot_id: Bot identifier.
            file_path: Path to the uploaded document file.
            filename: Original filename.
            
        Returns:
            bool: True if processing successful, False otherwise.
        """
        bot_data = self.get_bot(bot_id)
        if not bot_data:
            return False
        
        try:
            # Load document based on file type
            documents = self._load_document(file_path, filename)
            if not documents:
                return False
            
            # Split documents into chunks
            chunks = self.text_splitter.split_documents(documents)
            
            # Get or create vector store for this bot
            vector_store = self._get_vector_store(bot_id)
            
            # Add chunks to vector store
            vector_store.add_documents(chunks)
            
            # Update bot metadata
            bot_data["documents"].append({
                "filename": filename,
                "added_at": datetime.now().isoformat(),
                "chunks": len(chunks)
            })
            bot_data["document_count"] = len(bot_data["documents"])
            
            # Save updated metadata
            bot_file = self.bots_data_dir / f"{bot_id}.json"
            with open(bot_file, 'w', encoding='utf-8') as f:
                json.dump(bot_data, f, indent=2, ensure_ascii=False)
            
            return True
            
        except Exception as e:
            print(f"Error processing document: {e}")
            return False
        finally:
            # Clean up temporary file
            if os.path.exists(file_path):
                os.unlink(file_path)
    
    def _load_document(self, file_path: str, filename: str):
        """Load document based on file extension.
        
        Args:
            file_path: Path to the document file.
            filename: Original filename for extension detection.
            
        Returns:
            List of loaded documents or None if unsupported format.
        """
        file_extension = Path(filename).suffix.lower()
        
        try:
            if file_extension == '.pdf':
                loader = PyPDFLoader(file_path)
            elif file_extension == '.md':
                loader = UnstructuredMarkdownLoader(file_path)
            elif file_extension in ['.xlsx', '.xls']:
                loader = UnstructuredExcelLoader(file_path)
            else:
                print(f"Unsupported file type: {file_extension}")
                return None
            
            return loader.load()
        except Exception as e:
            print(f"Error loading document {filename}: {e}")
            return None
    
    def _get_vector_store(self, bot_id: str) -> Chroma:
        """Get or create ChromaDB vector store for bot.
        
        Args:
            bot_id: Bot identifier.
            
        Returns:
            Chroma: Vector store instance for the bot.
        """
        persist_directory = str(self.vector_db_dir / bot_id)
        
        return Chroma(
            collection_name=f"bot_{bot_id}",
            embedding_function=self.embeddings,
            persist_directory=persist_directory
        )
    
    def search_documents(self, bot_id: str, query: str, k: int = 4) -> List[str]:
        """Search bot's knowledge base for relevant content.
        
        Args:
            bot_id: Bot identifier.
            query: Search query.
            k: Number of relevant chunks to return.
            
        Returns:
            List[str]: List of relevant document chunks.
        """
        print(f"=== Document Search ===")
        print(f"Bot ID: {bot_id}")
        print(f"Query: {query}")
        print(f"K: {k}")
        
        try:
            vector_store = self._get_vector_store(bot_id)
            print(f"Vector store created for bot {bot_id}")
            
            docs = vector_store.similarity_search(query, k=k)
            print(f"Found {len(docs)} documents")
            
            result = [doc.page_content for doc in docs]
            for i, content in enumerate(result):
                print(f"Doc {i+1}: {content[:100]}...")
            
            return result
        except Exception as e:
            print(f"Error searching documents for bot {bot_id}: {e}")
            import traceback
            traceback.print_exc()
            return []


# Use datetime for timestamp handling
from datetime import datetime

rag_bot_service = RAGBotService()