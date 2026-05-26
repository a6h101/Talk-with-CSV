import './SchemaSidebar.css';

export default function SchemaSidebar({ schema }) {
  if (!schema) return null;

  const getTypeColor = (dtype) => {
    if (dtype.includes('int') || dtype.includes('float')) return 'type-numeric';
    if (dtype.includes('datetime')) return 'type-date';
    return 'type-string';
  };

  return (
    <div className="schema-sidebar">
      <div className="schema-header">
        <h3>📊 Data Schema</h3>
        <span className="row-count">{schema.row_count.toLocaleString()} rows</span>
      </div>
      <div className="schema-columns">
        {schema.columns.map((col, idx) => (
          <div key={idx} className="schema-column">
            <span className="column-name">{col.name}</span>
            <span className={`column-type ${getTypeColor(col.dtype)}`}>
              {col.dtype}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}