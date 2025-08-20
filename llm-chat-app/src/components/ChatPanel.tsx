import { useState, useCallback, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { bedrockService } from '../services/bedrockService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  references?: Array<{ title: string; section: string; law: string }>;
}

interface ChatPanelProps {
  onNavigateToLaw: (lawId: string) => void;
}

const ChatPanel = ({ onNavigateToLaw }: ChatPanelProps) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getLLMResponse = async (question: string) => {
    try {
      // AWS Bedrockが設定されている場合は使用
      if (bedrockService.isConfigured()) {
        return await bedrockService.askQuestion(question);
      } else {
        // フォールバック: モック回答
        console.warn('AWS Bedrock not configured, using mock response');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (question.includes('高度') || question.includes('制限')) {
          return {
            text: '飛行車の高度制限について説明します。都市部では地上から150メートルから300メートルが基本高度とされています。詳細は以下の法律をご確認ください。',
            references: [
              { title: '第3条（一般的な飛行高度制限）', section: '飛行車高度制限法', law: 'altitude' }
            ]
          };
        }
        
        return {
          text: 'ご質問にお答えします。飛行車に関する法律について、より具体的な質問をしていただければ詳しく説明できます。',
          references: []
        };
      }
    } catch (error) {
      // エラー時もフォールバック
      console.error('LLM response error:', error);
      return {
        text: 'すみません、一時的にサービスに接続できません。モック回答でお答えします。飛行車に関する法律について、より具体的な質問をしていただければ詳しく説明できます。',
        references: []
      };
    }
  };

  const handleSendMessage = useCallback(async () => {
    const message = inputText.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await getLLMResponse(message);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'assistant',
        references: response.references
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'すみません、エラーが発生しました。もう一度お試しください。',
        sender: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <>
      <button
        className="chat-toggle"
        onClick={() => setChatOpen(!chatOpen)}
      >
        <MessageCircle />
      </button>

      {chatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h3>飛行車法律相談</h3>
            <button className="chat-close" onClick={() => setChatOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.sender}`}>
                <div>{message.text}</div>
                {message.references && message.references.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>
                    <strong>参考：</strong>
                    {message.references.map((ref, index) => (
                      <div key={index}>
                        <button
                          style={{
                            color: message.sender === 'user' ? '#e0f2fe' : '#3b82f6',
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onClick={() => onNavigateToLaw(ref.law)}
                        >
                          {ref.section} - {ref.title}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                回答を生成中...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="飛行車の法律について質問してください..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="chat-send"
              onClick={handleSendMessage}
              disabled={isLoading || !inputText.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatPanel;