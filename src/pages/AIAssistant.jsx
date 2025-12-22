import React, { useState, useRef, useEffect } from 'react';

function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Merhaba! Ben enerji yönetim sistemi yapay zeka asistanınızım. Size tüketim analizi, anomali tespiti, enerji tasarrufu önerileri ve sistem hakkında sorularınızda yardımcı olabilirim. Nasıl yardımcı olabilirim?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.response
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    'Sistemdeki toplam sayaç sayısı nedir?',
    'En çok enerji tüketen il hangisi?',
    'Enerji tasarrufu için ne önerirsiniz?',
    'Hatalı sayaçları nasıl tespit edebilirim?',
    'Anomali tespit sistemi nasıl çalışır?'
  ];

  return (
    <div className="ai-assistant-page">
      <div className="page-header">
        <h1>🤖 AI Asistan</h1>
        <p className="subtitle">Yapay zeka destekli enerji danışmanınız</p>
      </div>

      <div className="ai-container">
        {/* Stats Sidebar */}
        <div className="ai-sidebar">
          <h3>📊 Sistem Özeti</h3>
          <div className="sidebar-stats">
            <div className="sidebar-stat">
              <span className="stat-label">Toplam Sayaç</span>
              <span className="stat-value">{stats?.toplamSayac?.toLocaleString() || '-'}</span>
            </div>
            <div className="sidebar-stat">
              <span className="stat-label">Toplam Site</span>
              <span className="stat-value">{stats?.toplamSite?.toLocaleString() || '-'}</span>
            </div>
            <div className="sidebar-stat">
              <span className="stat-label">Hatalı Sayaç</span>
              <span className="stat-value">{stats?.hataliSayac?.toLocaleString() || '-'}</span>
            </div>
            <div className="sidebar-stat">
              <span className="stat-label">Aktif İl</span>
              <span className="stat-value">{stats?.toplamIl || '-'}</span>
            </div>
          </div>

          <h3>💡 Hızlı Sorular</h3>
          <div className="quick-questions">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                className="quick-question-btn"
                onClick={() => setInput(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-container">
          <div className="messages-area">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'assistant' ? '🤖' : '👤'}
                </div>
                <div className="message-content">
                  <div className="message-text">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Bir soru sorun..."
              rows={2}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
            >
              {loading ? '...' : '📤'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
