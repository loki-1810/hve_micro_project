// Lightweight browser storage management for session dataset history

const HISTORY_KEY = 'ml_prep_datasets_history';
const ACTIVE_STATE_KEY = 'ml_prep_active_workspace';

export function getStoredHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read history from localStorage', e);
    return [];
  }
}

export function saveToHistory(datasetSummary) {
  try {
    const history = getStoredHistory();
    // Exclude full row contents to prevent localStorage quota issues; keep metadata & metrics
    const item = {
      id: datasetSummary.id || `ds_${Date.now()}`,
      name: datasetSummary.name || 'Untitled Dataset',
      description: datasetSummary.description || '',
      source_type: datasetSummary.source_type || 'Unknown',
      collected_at: datasetSummary.collected_at || new Date().toLocaleString(),
      total_rows: datasetSummary.total_rows || 0,
      total_columns: datasetSummary.total_columns || 0,
      columns: datasetSummary.columns || [],
      quality_score: datasetSummary.validation?.quality_score ?? 100,
      issues_count: datasetSummary.validation?.issues?.filter(i => i.type !== 'info')?.length ?? 0,
      is_cleaned: !!datasetSummary.cleaned_data,
      cleaned_rows: datasetSummary.cleaned_data ? datasetSummary.cleaned_data.rows.length : null,
      saved_at: new Date().toISOString()
    };

    // Filter out previous version of this dataset ID if exists
    const updated = [item, ...history.filter(h => h.id !== item.id)].slice(0, 20);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save to localStorage history', e);
    return getStoredHistory();
  }
}

export function clearHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  } catch (e) {
    return [];
  }
}

export function saveActiveWorkspace(workspaceData) {
  try {
    // Save in sessionStorage so current session persists on browser refresh
    sessionStorage.setItem(ACTIVE_STATE_KEY, JSON.stringify(workspaceData));
  } catch (e) {
    console.warn('SessionStorage quota exceeded, active workspace kept in memory', e);
  }
}

export function getActiveWorkspace() {
  try {
    const raw = sessionStorage.getItem(ACTIVE_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearActiveWorkspace() {
  try {
    sessionStorage.removeItem(ACTIVE_STATE_KEY);
  } catch (e) {
    // ignore
  }
}
