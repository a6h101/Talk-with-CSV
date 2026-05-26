function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: '6px', padding: '12px 16px', background: '#1e1e2e', borderRadius: '18px', width: 'fit-content', marginBottom: '16px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%', background: '#7c6af7',
          animation: 'bounce 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default TypingIndicator;
