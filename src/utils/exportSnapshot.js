/**
 * exportSnapshot — Shared browser-only export utility.
 * Handles JSON download with safetyClaims embedding.
 * No API calls, no backend mutation, no execution logic.
 */

export function exportSnapshot(config) {
  const {
    snapshotType,
    data,
    filename,
    safetyClaims,
  } = config;

  // Create export payload with data
  const exportData = {
    generatedAt: new Date().toISOString(),
    snapshotType,
    ...data,
    safetyClaims,
  };

  // Download as JSON file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * exportSnapshotAndSave — Export to file AND save to localStorage.
 * storageKey: where to save snapshot in localStorage
 */
export function exportSnapshotAndSave(config) {
  const {
    snapshotType,
    data,
    filename,
    safetyClaims,
    storageKey,
  } = config;

  // Create export payload
  const exportData = {
    generatedAt: new Date().toISOString(),
    snapshotType,
    ...data,
    safetyClaims,
  };

  // Save to localStorage
  try {
    localStorage.setItem(storageKey, JSON.stringify(exportData));
  } catch (e) {
    // Silent fail on localStorage quota exceeded
  }

  // Download as JSON file
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}