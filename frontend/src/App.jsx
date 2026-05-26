import { useState, useRef, useEffect } from 'react';
import { uploadCSV, queryCSV } from './utils/api';
import UploadZone from './components/UploadZone';
import MessageBubble from './components/MessageBubble';
import TypingIndicator from './components/TypingIndicator';
import SuggestionChips from './components/SuggestionChips';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [filename, setFilename] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpload = async (file) => {
    setIsLoading(true);
    try {
      const response = await uploadCSV(file);
      setSessionId(response.session_id);
      setFilename(response.filename);
      setMessages([{
        role: 'assistant',
        content: `Loaded "${response.filename}" — ${response.rows.toLocaleString()} rows × ${response.columns.length} columns. Ask me anything!`
      }]);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsk = async (question) => {
    if (!question.trim() || !sessionId || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInputValue('');
    setIsLoading(true);
    try {
      const response = await queryCSV(sessionId, question);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        chart: response.chart_b64,
        table: response.table,
        error: response.error,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error: ' + error.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewFile = () => {
    setSessionId(null);
    setFilename('');
    setMessages([]);
    setInputValue('');
  };

  // ── Upload screen ──
  if (!sessionId) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0b0b10', color: '#fff',
        fontFamily: "'Segoe UI', sans-serif",
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{ marginBottom: '12px', fontSize: '40px' }}>📊</div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#a78bfa', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Talk with CSV
        </h1>
        <p style={{ color: '#666', fontSize: '15px', marginBottom: '40px', textAlign: 'center' }}>
          Upload any CSV and ask questions in plain English
        </p>

        <div style={{ width: '100%', maxWidth: '520px' }}>
          <UploadZone onUpload={handleUpload} isLoading={isLoading} />
        </div>

        <div style={{ display: 'flex', gap: '32px', marginTop: '40px' }}>
          {[
            { icon: '💬', label: 'Ask in English' },
            { icon: '📈', label: 'Auto Charts' },
            { icon: '🔍', label: 'Deep Analysis' },
          ].map(f => (
            <div key={f.label} style={{ textAlign: 'center', color: '#555', fontSize: '13px' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{f.icon}</div>
              {f.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Chat screen ──
  return (
    <div style={{
      height: '100vh', background: '#0b0b10', color: '#fff',
      fontFamily: "'Segoe UI', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>

      {/* Header */}
      <div style={{
        padding: '0 24px', height: '56px',
        borderBottom: '1px solid #1e1e2e',
        background: '#0f0f18',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📊</span>
          <span style={{ fontWeight: 600, color: '#a78bfa', fontSize: '16px' }}>Talk with CSV</span>
          <span style={{
            fontSize: '11px', color: '#555', background: '#1e1e2e',
            padding: '2px 10px', borderRadius: '20px', border: '1px solid #2a2a3e',
          }}>
            {filename}
          </span>
        </div>
        <button
          onClick={handleNewFile}
          style={{
            padding: '7px 16px', borderRadius: '8px',
            background: 'transparent', border: '1px solid #3a3a5c',
            color: '#888', fontSize: '13px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.borderColor = '#a78bfa'; e.target.style.color = '#a78bfa'; }}
          onMouseLeave={e => { e.target.style.borderColor = '#3a3a5c'; e.target.style.color = '#888'; }}
        >
          + New File
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '820px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{
        borderTop: '1px solid #1e1e2e', background: '#0f0f18',
        padding: '16px 24px', flexShrink: 0,
      }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          {messages.length <= 1 && (
            <div style={{ marginBottom: '12px' }}>
              <SuggestionChips onSelect={handleAsk} disabled={isLoading} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAsk(inputValue)}
              placeholder="Ask anything about your data..."
              disabled={isLoading}
              style={{
                flex: 1, padding: '13px 18px', borderRadius: '12px',
                border: '1px solid #2a2a3e', background: '#1a1a28',
                color: '#fff', fontSize: '14px',
                outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#7c6af7'}
              onBlur={e => e.target.style.borderColor = '#2a2a3e'}
            />
            <button
              onClick={() => handleAsk(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              style={{
                padding: '13px 24px', borderRadius: '12px',
                background: inputValue.trim() && !isLoading ? '#7c6af7' : '#1e1e2e',
                color: inputValue.trim() && !isLoading ? '#fff' : '#444',
                fontWeight: 600, fontSize: '14px', border: 'none',
                cursor: isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', color: '#333', marginTop: '10px' }}>
            Powered by Groq AI · Your data stays in your session
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
