import { lawContent } from '../data/lawContent';

export const createLawDatabase = (): string => {
  return Object.entries(lawContent).map(([lawId, law]) => {
    const sectionsText = law.sections.map(section => 
      `${section.title}: ${section.content}`
    ).join('\n\n');
    
    return `【${law.title}】（法律ID: ${lawId}）
${sectionsText}`;
  }).join('\n\n===========================================\n\n');
};

export const buildPrompt = (userQuestion: string): string => {
  const lawDatabase = createLawDatabase();
  
  return `あなたは飛行車法律の専門家です。以下の法律データベースを参考に質問に回答してください。

【法律データベース】
${lawDatabase}

【回答ルール】
1. 必ず上記の法律データベースの情報のみを使って回答してください
2. 回答には具体的な条文を引用してください
3. 該当する法律がある場合は、参考として法律IDと条文を示してください

【回答フォーマット】
必ず以下のJSON形式で回答してください：
{
  "text": "ここに回答内容を記載",
  "references": [
    {
      "title": "条文のタイトル（例：第3条（一般的な飛行高度制限））",
      "section": "法律名（例：飛行車高度制限法）",
      "law": "法律ID（例：altitude, speed, route, landing, emergency, communication, ai, license, noise, environment）"
    }
  ]
}

【質問】
${userQuestion}`;
};