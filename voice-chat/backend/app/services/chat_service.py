import logging
import random
import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# 将来的なLangChain統合のための準備
from langchain.schema import BaseMessage, HumanMessage, AIMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class TravelStyle(Enum):
    """旅行スタイルの列挙型"""
    RELAXING = "のんびり"
    ACTIVE = "アクティブ"
    FOOD = "食事"
    CULTURE = "文化"
    NATURE = "自然"
    FAMILY = "ファミリー"
    UNKNOWN = "未分類"


@dataclass
class TourismRecommendation:
    """観光おすすめ情報"""
    title: str
    description: str
    location: str
    style: TravelStyle
    duration: str
    price_range: str
    highlights: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return {
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "style": self.style.value,
            "duration": self.duration,
            "price_range": self.price_range,
            "highlights": self.highlights
        }


class TourismDatabase:
    """観光情報データベース（初期PoC版）"""
    
    def __init__(self):
        self.recommendations = self._initialize_recommendations()
    
    def _initialize_recommendations(self) -> Dict[TravelStyle, List[TourismRecommendation]]:
        """観光おすすめ情報を初期化"""
        return {
            TravelStyle.RELAXING: [
                TourismRecommendation(
                    title="箱根温泉でゆったり過ごす旅",
                    description="美しい自然に囲まれた箱根の温泉でリラックス。芦ノ湖の景色を眺めながら心身ともに癒される至福の時間を。",
                    location="神奈川県箱根町",
                    style=TravelStyle.RELAXING,
                    duration="1泊2日",
                    price_range="20,000円〜35,000円",
                    highlights=["温泉", "芦ノ湖", "大涌谷", "箱根神社"]
                ),
                TourismRecommendation(
                    title="由布院温泉街散策",
                    description="湯の坪街道をのんびり歩きながら、温泉グルメと手作り工芸品を楽しむ大人の旅。",
                    location="大分県由布市",
                    style=TravelStyle.RELAXING,
                    duration="2泊3日",
                    price_range="25,000円〜40,000円",
                    highlights=["由布院温泉", "湯の坪街道", "金鱗湖", "辻馬車"]
                ),
                TourismRecommendation(
                    title="京都の寺巡りと庭園鑑賞",
                    description="静寂な寺院で心を落ち着け、美しい日本庭園を眺めながら京都の歴史と文化に触れる旅。",
                    location="京都府京都市",
                    style=TravelStyle.RELAXING,
                    duration="2泊3日",
                    price_range="30,000円〜50,000円",
                    highlights=["清水寺", "金閣寺", "嵐山", "祇園"]
                )
            ],
            TravelStyle.ACTIVE: [
                TourismRecommendation(
                    title="北海道スキー&スノーボード",
                    description="パウダースノーで有名なニセコや富良野でウィンタースポーツを満喫。雪質抜群のゲレンデでアクティブに！",
                    location="北海道ニセコ・富良野",
                    style=TravelStyle.ACTIVE,
                    duration="3泊4日",
                    price_range="40,000円〜70,000円",
                    highlights=["ニセコスキー場", "富良野スキー場", "雪まつり", "海鮮グルメ"]
                ),
                TourismRecommendation(
                    title="沖縄ダイビング&マリンスポーツ",
                    description="透明度抜群の沖縄の海でダイビングやシュノーケリング。カラフルな熱帯魚と珊瑚礁の世界を探検。",
                    location="沖縄県宮古島・石垣島",
                    style=TravelStyle.ACTIVE,
                    duration="3泊4日",
                    price_range="50,000円〜80,000円",
                    highlights=["ダイビング", "シュノーケリング", "青の洞窟", "美ら海水族館"]
                ),
                TourismRecommendation(
                    title="富士登山チャレンジ",
                    description="日本の象徴、富士山に登頂！ご来光を山頂で迎える感動体験と達成感は一生の思い出に。",
                    location="山梨県・静岡県富士山",
                    style=TravelStyle.ACTIVE,
                    duration="1泊2日",
                    price_range="15,000円〜25,000円",
                    highlights=["富士山登頂", "ご来光", "山小屋体験", "五合目観光"]
                )
            ],
            TravelStyle.FOOD: [
                TourismRecommendation(
                    title="大阪食べ歩きツアー",
                    description="たこ焼き、お好み焼き、串かつなど大阪グルメを食べ尽くし！道頓堀や新世界で本場の味を堪能。",
                    location="大阪府大阪市",
                    style=TravelStyle.FOOD,
                    duration="1泊2日",
                    price_range="20,000円〜35,000円",
                    highlights=["たこ焼き", "お好み焼き", "串かつ", "道頓堀", "新世界"]
                ),
                TourismRecommendation(
                    title="福岡屋台巡り",
                    description="博多の夜を彩る屋台文化を体験。もつ鍋、博多ラーメン、辛子明太子など福岡の名物グルメを堪能。",
                    location="福岡県福岡市",
                    style=TravelStyle.FOOD,
                    duration="2泊3日",
                    price_range="25,000円〜40,000円",
                    highlights=["屋台", "博多ラーメン", "もつ鍋", "辛子明太子", "太宰府天満宮"]
                ),
                TourismRecommendation(
                    title="金沢海鮮グルメ旅",
                    description="日本海の新鮮な海の幸を味わう贅沢な旅。近江町市場での海鮮丼や加賀料理で舌鼓。",
                    location="石川県金沢市",
                    style=TravelStyle.FOOD,
                    duration="1泊2日",
                    price_range="30,000円〜50,000円",
                    highlights=["海鮮丼", "加賀料理", "近江町市場", "兼六園", "金沢城"]
                )
            ],
            TravelStyle.CULTURE: [
                TourismRecommendation(
                    title="奈良歴史文化探訪",
                    description="古都奈良で日本の原点を体感。東大寺の大仏様や奈良公園の鹿との触れ合いで歴史と自然を満喫。",
                    location="奈良県奈良市",
                    style=TravelStyle.CULTURE,
                    duration="1泊2日",
                    price_range="25,000円〜40,000円",
                    highlights=["東大寺", "奈良公園", "春日大社", "興福寺", "鹿せんべい"]
                )
            ],
            TravelStyle.NATURE: [
                TourismRecommendation(
                    title="屋久島トレッキング",
                    description="世界自然遺産の屋久島で縄文杉を目指すトレッキング。神秘的な森林浴と雄大な自然に感動。",
                    location="鹿児島県屋久島",
                    style=TravelStyle.NATURE,
                    duration="2泊3日",
                    price_range="40,000円〜60,000円",
                    highlights=["縄文杉", "白谷雲水峡", "トレッキング", "ウミガメ観察"]
                )
            ],
            TravelStyle.FAMILY: [
                TourismRecommendation(
                    title="東京ディズニーリゾート",
                    description="家族みんなで楽しめる夢の国。ディズニーランドとシーで特別な思い出作りを。",
                    location="千葉県浦安市",
                    style=TravelStyle.FAMILY,
                    duration="2泊3日",
                    price_range="50,000円〜80,000円",
                    highlights=["ディズニーランド", "ディズニーシー", "キャラクターグリーティング", "パレード"]
                )
            ]
        }
    
    def get_recommendations_by_style(self, style: TravelStyle) -> List[TourismRecommendation]:
        """スタイル別のおすすめ情報を取得"""
        return self.recommendations.get(style, [])
    
    def get_random_recommendation(self, style: TravelStyle) -> Optional[TourismRecommendation]:
        """指定スタイルからランダムなおすすめを取得"""
        recommendations = self.get_recommendations_by_style(style)
        return random.choice(recommendations) if recommendations else None


class KeywordAnalyzer:
    """ユーザー入力のキーワード分析クラス"""
    
    def __init__(self):
        self.keyword_patterns = {
            TravelStyle.RELAXING: [
                r"のんびり", r"ゆっくり", r"リラックス", r"癒し", r"温泉", 
                r"休暇", r"疲れ", r"ストレス", r"静か", r"落ち着"
            ],
            TravelStyle.ACTIVE: [
                r"アクティブ", r"運動", r"スポーツ", r"登山", r"ハイキング", 
                r"ダイビング", r"スキー", r"アドベンチャー", r"体験", r"チャレンジ"
            ],
            TravelStyle.FOOD: [
                r"食事", r"グルメ", r"美味し", r"食べ", r"料理", r"名物", 
                r"特産", r"地元", r"B級", r"海鮮", r"肉", r"スイーツ"
            ],
            TravelStyle.CULTURE: [
                r"文化", r"歴史", r"伝統", r"寺", r"神社", r"城", r"博物館", 
                r"美術館", r"祭り", r"芸術", r"建築"
            ],
            TravelStyle.NATURE: [
                r"自然", r"山", r"海", r"森", r"川", r"湖", r"景色", r"絶景", 
                r"国立公園", r"トレッキング", r"ハイキング"
            ],
            TravelStyle.FAMILY: [
                r"家族", r"子供", r"ファミリー", r"テーマパーク", r"遊園地", 
                r"水族館", r"動物園", r"体験型"
            ]
        }
    
    def analyze_user_input(self, user_input: str) -> TravelStyle:
        """ユーザー入力を分析して旅行スタイルを特定"""
        user_input_lower = user_input.lower()
        
        style_scores = {}
        
        for style, patterns in self.keyword_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, user_input_lower))
                score += matches
            style_scores[style] = score
        
        # 最高スコアのスタイルを返す
        if max(style_scores.values()) > 0:
            return max(style_scores, key=style_scores.get)
        
        return TravelStyle.UNKNOWN


class ChatService:
    """観光案内チャットサービス"""
    
    def __init__(self):
        self.tourism_db = TourismDatabase()
        self.keyword_analyzer = KeywordAnalyzer()
        self.conversation_history: List[BaseMessage] = []
        
    async def generate_response(self, user_input: str, client_id: str) -> Dict[str, Any]:
        """ユーザー入力に対する応答を生成"""
        try:
            logger.info(f"Processing user input from {client_id}: {user_input}")
            
            # 会話履歴に追加
            self.conversation_history.append(HumanMessage(content=user_input))
            
            # キーワード分析
            detected_style = self.keyword_analyzer.analyze_user_input(user_input)
            
            # スタイルに基づく応答生成
            if detected_style == TravelStyle.UNKNOWN:
                response = await self._generate_general_response(user_input)
            else:
                response = await self._generate_style_based_response(detected_style, user_input)
            
            # 会話履歴に追加
            self.conversation_history.append(AIMessage(content=response["message"]))
            
            logger.info(f"Generated response for {client_id}: {response['message'][:100]}...")
            
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return {
                "message": "申し訳ございません。システムエラーが発生しました。もう一度お試しください。",
                "recommendations": [],
                "detected_style": TravelStyle.UNKNOWN.value,
                "error": str(e)
            }
    
    async def _generate_style_based_response(
        self, 
        style: TravelStyle, 
        user_input: str
    ) -> Dict[str, Any]:
        """スタイルに基づく応答を生成"""
        
        # おすすめ情報を取得
        recommendation = self.tourism_db.get_random_recommendation(style)
        
        if not recommendation:
            return {
                "message": f"{style.value}な旅行のご提案を準備中です。しばらくお待ちください。",
                "recommendations": [],
                "detected_style": style.value
            }
        
        # 応答メッセージを生成（短縮版・絵文字なし）
        response_templates = {
            TravelStyle.RELAXING: [
                f"{recommendation.title}をおすすめします。",
                f"{recommendation.title}はいかがでしょうか。"
            ],
            TravelStyle.ACTIVE: [
                f"{recommendation.title}で楽しんでみませんか。",
                f"{recommendation.title}をおすすめします。"
            ],
            TravelStyle.FOOD: [
                f"{recommendation.title}はいかがでしょうか。",
                f"{recommendation.title}をおすすめします。"
            ],
            TravelStyle.CULTURE: [
                f"{recommendation.title}はいかがでしょうか。",
                f"{recommendation.title}をおすすめします。"
            ],
            TravelStyle.NATURE: [
                f"{recommendation.title}はいかがでしょうか。",
                f"{recommendation.title}をおすすめします。"
            ],
            TravelStyle.FAMILY: [
                f"{recommendation.title}はいかがでしょうか。",
                f"{recommendation.title}をおすすめします。"
            ]
        }
        
        templates = response_templates.get(style, [f"{recommendation.title}はいかがでしょうか。"])
        message = random.choice(templates)
        
        # 詳細情報を追加（簡潔・絵文字なし）
        message += f" {recommendation.location}、{recommendation.duration}、{recommendation.price_range}です。"
        
        return {
            "message": message,
            "recommendations": [recommendation.to_dict()],
            "detected_style": style.value
        }
    
    async def _generate_general_response(self, user_input: str) -> Dict[str, Any]:
        """一般的な応答を生成"""
        
        general_responses = [
            "どのような旅行をお考えですか。のんびり、アクティブ、グルメ、文化、自然、ファミリーなど、ご希望をお聞かせください。",
            "お疲れさまです。リラックス、体験、グルメなど、どんな旅行がお好みですか。",
            "旅行プランをご提案します。どんなタイプの旅行に興味がありますか。"
        ]
        
        return {
            "message": random.choice(general_responses),
            "recommendations": [],
            "detected_style": TravelStyle.UNKNOWN.value
        }
    
    def get_conversation_history(self) -> List[Dict[str, str]]:
        """会話履歴を取得"""
        history = []
        for message in self.conversation_history:
            if isinstance(message, HumanMessage):
                history.append({"role": "user", "content": message.content})
            elif isinstance(message, AIMessage):
                history.append({"role": "assistant", "content": message.content})
        return history
    
    def clear_conversation_history(self):
        """会話履歴をクリア"""
        self.conversation_history = []
        logger.info("Conversation history cleared")


# グローバルチャットサービスインスタンス
chat_service = ChatService()