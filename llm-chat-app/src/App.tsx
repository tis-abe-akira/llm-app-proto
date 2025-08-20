import { useState } from 'react';
import { ChevronRight, Home, Scale, Zap, Route, MapPin, Shield, Radio, Bot, UserCheck, Volume2, Leaf } from 'lucide-react';
import ChatPanel from './components/ChatPanel';
import { lawContent, type Section } from './data/lawContent';
import './App.css'

const FlyingCarLawApp = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const laws = [
    { id: 'altitude', title: '飛行車高度制限法', icon: <Scale className="w-5 h-5" /> },
    { id: 'speed', title: '飛行車速度制限法', icon: <Zap className="w-5 h-5" /> },
    { id: 'route', title: '飛行車飛行コース及びルート法', icon: <Route className="w-5 h-5" /> },
    { id: 'landing', title: '飛行車離着陸ゾーン法', icon: <MapPin className="w-5 h-5" /> },
    { id: 'emergency', title: '飛行車避難手段法', icon: <Shield className="w-5 h-5" /> },
    { id: 'communication', title: '飛行車通信システム法', icon: <Radio className="w-5 h-5" /> },
    { id: 'ai', title: '飛行車自動飛行及びAI使用法', icon: <Bot className="w-5 h-5" /> },
    { id: 'license', title: '飛行車運転資格及び許可法', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'noise', title: '飛行車ノイズ規制法', icon: <Volume2 className="w-5 h-5" /> },
    { id: 'environment', title: '飛行車環境影響規制法', icon: <Leaf className="w-5 h-5" /> }
  ];

  const HomePage = () => (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>飛行車法制度</h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>架空の飛行車を対象にした法律の自動生成例</p>
        <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px' }}>
          <p style={{ color: '#92400e' }}>
            <strong>注意：</strong>この文章は、架空の飛行車を対象にした法律の自動生成例です。
          </p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {laws.map((law, index) => (
          <div
            key={law.id}
            onClick={() => setCurrentPage(law.id)}
            style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLElement;
              target.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              target.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLElement;
              target.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
              target.style.borderColor = '#e5e7eb';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ color: '#2563eb', marginRight: '12px' }}>
                {law.icon}
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {index + 1}. {law.title}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', color: '#2563eb' }}>
              <span style={{ fontSize: '0.875rem' }}>詳細を見る</span>
              <ChevronRight style={{ width: '16px', height: '16px', marginLeft: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const LawPage = ({ lawId }: { lawId: string }) => {
    const law = lawContent[lawId as keyof typeof lawContent];
    if (!law) return <div>法律が見つかりません</div>;

    return (
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setCurrentPage('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              color: '#2563eb',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              marginBottom: '16px',
              fontSize: '1rem'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#1d4ed8'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#2563eb'}
          >
            <Home style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            目次に戻る
          </button>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>{law.title}</h1>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {law.sections.map((section: Section, index: number) => (
            <div key={index} style={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '24px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                {section.title}
              </h2>
              <div style={{ color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ padding: '32px 16px' }}>
        {currentPage === 'home' ? (
          <HomePage />
        ) : (
          <LawPage lawId={currentPage} />
        )}
      </div>
      <ChatPanel onNavigateToLaw={setCurrentPage} />
    </div>
  );
};

export default FlyingCarLawApp;
