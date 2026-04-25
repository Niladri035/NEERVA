import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Bot, User, Waves } from 'lucide-react';

const SUGGESTIONS = [
  'What fish are abundant in the Arabian Sea right now?',
  'Explain eDNA metabarcoding in simple terms',
  'What are safe fishing zones near Mumbai?',
  'How do I read ocean temperature data?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: "Hello! 🌊 I'm **NEERVA AI**, your marine intelligence assistant. I can help you with ocean conditions, species identification, fishing zones, eDNA analysis, and safety protocols for the Indian Ocean.\n\nWhat would you like to know?",
      ts: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('mistral'); // default to mistral
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role === 'ai' ? 'model' : 'user', content: m.content }));
      const { data } = await axios.post('/api/chat', { message: msg, history, model });
      setMessages(prev => [...prev, { role: 'ai', content: data.reply, ts: new Date() }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Connection error. Please try again.';
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${errMsg}`, ts: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  const fmt = (content) => content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>');

  return (
    <main className="page-wrapper">
      <div className="page-hero">
        <div className="container">
          <div className="section-badge">
            <Bot size={12} /> Powered by {model === 'gemini' ? 'Gemini AI' : model === 'mistral' ? 'Mistral AI' : 'Cohere AI'}
          </div>
          <h1 className="section-title">NEERVA AI Assistant</h1>
          <p className="section-sub" style={{ margin: '0 auto' }}>Ask anything about the Indian Ocean, fishing zones, marine biology, or safety protocols.</p>
        </div>
      </div>

      <section className="section" style={{ paddingTop: '20px' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          {/* Chat window */}
          <div className="glass chat-wrapper">
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'linear-gradient(135deg, rgba(38,198,218,0.1), rgba(0,172,193,0.05))'
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--gradient-accent)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Waves size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px' }}>NEERVA AI</div>
                <div style={{ fontSize: '12px', color: 'var(--ocean-600)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#26a69a', display: 'inline-block' }} />
                  {model === 'gemini' ? 'Gemini 1.5 Flash' : model === 'mistral' ? 'Mistral Small' : 'Cohere Command R+'} · Active
                </div>
              </div>

              {/* Model Switcher */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '50px', padding: '3px' }}>
                <button 
                  onClick={() => setModel('gemini')}
                  style={{ 
                    border: 'none', background: model === 'gemini' ? '#fff' : 'transparent', 
                    fontSize: '10px', fontWeight: '700', padding: '5px 12px', borderRadius: '50px',
                    color: model === 'gemini' ? 'var(--ocean-700)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: '0.2s',
                    boxShadow: model === 'gemini' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  GEMINI
                </button>
                <button 
                  onClick={() => setModel('mistral')}
                  style={{ 
                    border: 'none', background: model === 'mistral' ? '#fff' : 'transparent', 
                    fontSize: '10px', fontWeight: '700', padding: '5px 12px', borderRadius: '50px',
                    color: model === 'mistral' ? 'var(--ocean-700)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: '0.2s',
                    boxShadow: model === 'mistral' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  MISTRAL
                </button>
                <button 
                  onClick={() => setModel('cohere')}
                  style={{ 
                    border: 'none', background: model === 'cohere' ? '#fff' : 'transparent', 
                    fontSize: '10px', fontWeight: '700', padding: '5px 12px', borderRadius: '50px',
                    color: model === 'cohere' ? 'var(--ocean-700)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: '0.2s',
                    boxShadow: model === 'cohere' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  COHERE
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" role="log" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      background: m.role === 'user' ? 'var(--gradient-accent)' : 'rgba(38,198,218,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {m.role === 'user' ? <User size={13} color="#fff" /> : <Waves size={13} color="var(--ocean-600)" />}
                    </div>
                    <div
                      className={`chat-bubble ${m.role}`}
                      dangerouslySetInnerHTML={{ __html: fmt(m.content) }}
                    />
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', padding: '0 36px' }}>
                    {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(38,198,218,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Waves size={13} color="var(--ocean-600)" />
                  </div>
                  <div className="chat-bubble ai" style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '14px 18px' }}>
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                    <div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="chat-input-row">
              <input
                id="chat-input"
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="Ask about ocean conditions, species, safety..."
                aria-label="Chat message input"
                disabled={loading}
              />
              <button
                id="chat-send-btn"
                className="btn-primary"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{ padding: '10px 20px', borderRadius: '50px' }}
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            </div>
          </div>

          {/* Suggestions */}
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Try asking:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="btn-ghost"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
