const BASE = 'http://localhost:8000';

export async function uploadCSV(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

export async function queryCSV(sessionId, question) {
  const res = await fetch(`${BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Query failed' }));
    throw new Error(err.detail || 'Query failed');
  }
  return res.json();
}
