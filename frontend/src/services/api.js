// API Client for Flask Backend Communication

const BASE_URL = ''; // Relative path, proxied by Vite to http://127.0.0.1:5000 in dev

export async function checkHealth() {
  const res = await fetch(`${BASE_URL}/api/health`);
  return res.json();
}

export async function fetchSampleDatasets() {
  const res = await fetch(`${BASE_URL}/api/samples`);
  if (!res.ok) throw new Error('Failed to fetch sample datasets');
  return res.json();
}

export async function loadSampleDataset(sampleId) {
  const res = await fetch(`${BASE_URL}/api/samples/${sampleId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to load sample dataset ${sampleId}`);
  }
  return res.json();
}

export async function uploadDatasetFile(formData) {
  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload dataset file');
  }
  return res.json();
}

export async function submitManualDataset(payload) {
  const res = await fetch(`${BASE_URL}/api/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit manual dataset');
  }
  return res.json();
}

export async function validateDataset(columns, rows) {
  const res = await fetch(`${BASE_URL}/api/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columns, rows }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Validation request failed');
  }
  return res.json();
}

export async function cleanDataset(columns, rows, rules) {
  const res = await fetch(`${BASE_URL}/api/clean`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columns, rows, rules }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Cleaning request failed');
  }
  return res.json();
}

export async function analyzeDataset(columns, rows) {
  const res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columns, rows }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Analysis request failed');
  }
  return res.json();
}

export async function downloadCsv(columns, rows, filename = 'dataset.csv') {
  const res = await fetch(`${BASE_URL}/api/export/csv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ columns, rows, filename }),
  });
  if (!res.ok) throw new Error('Failed to download CSV');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadJson(content, filename = 'dataset_summary.json') {
  const res = await fetch(`${BASE_URL}/api/export/json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filename }),
  });
  if (!res.ok) throw new Error('Failed to download JSON');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
