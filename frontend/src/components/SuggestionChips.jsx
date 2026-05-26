const SUGGESTIONS = [
  'What are the column names?',
  'Show me key statistics',
  'Which column has missing values?',
  'Show the top 10 rows',
  'Create a bar chart',
  'Are there any outliers?',
];

function SuggestionChips({ onSelect, disabled }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
      {SUGGESTIONS.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          disabled={disabled}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: '1px solid #3a3a5c',
            background: 'transparent',
            color: '#a0a0c0',
            fontSize: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export default SuggestionChips;
