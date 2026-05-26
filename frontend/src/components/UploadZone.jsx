import { useState, useRef } from 'react';

function UploadZone({ onUpload, isLoading }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith('.csv')) { alert('Please upload a .csv file'); return; }
    onUpload(file);
  };

  return (
    <div
      onClick={() => !isLoading && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      style={{
        border: `2px dashed ${dragging ? '#7c6af7' : '#3a3a5c'}`,
        borderRadius: '16px',
        padding: '60px 40px',
        textAlign: 'center',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        background: dragging ? 'rgba(124,106,247,0.08)' : '#1e1e2e',
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
        {isLoading ? 'Uploading...' : 'Drop your CSV here'}
      </div>
      <div style={{ fontSize: '13px', color: '#666' }}>or click to browse</div>
    </div>
  );
}

export default UploadZone;
