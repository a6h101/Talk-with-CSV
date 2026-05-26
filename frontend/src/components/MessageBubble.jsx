function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '16px',
    }}>
      <div style={{
        maxWidth: '75%',
        background: isUser ? '#7c6af7' : '#1e1e2e',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        fontSize: '14px',
        lineHeight: '1.6',
      }}>
        <div>{message.content}</div>

        {message.chart && (
          <img
            src={`data:image/png;base64,${message.chart}`}
            alt="chart"
            style={{ width: '100%', marginTop: '12px', borderRadius: '8px' }}
          />
        )}

        {message.table && message.table.length > 0 && (
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: '12px', width: '100%' }}>
              <thead>
                <tr>
                  {Object.keys(message.table[0]).map(key => (
                    <th key={key} style={{ padding: '6px 10px', borderBottom: '1px solid #444', textAlign: 'left', color: '#a78bfa' }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {message.table.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i} style={{ padding: '6px 10px', borderBottom: '1px solid #333', color: '#ccc' }}>
                        {val === null ? '—' : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
