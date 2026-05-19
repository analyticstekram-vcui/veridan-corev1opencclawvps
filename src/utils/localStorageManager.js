/**
 * localStorageManager — Shared localStorage utility.
 * Provides consistent read/write/cap logic for all modules.
 * No API calls, no backend mutation, no execution logic.
 */

/**
 * Load data from localStorage by key.
 * Returns empty array on error.
 */
export function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Save data to localStorage by key.
 * Silent fail on error (quota exceeded, etc.).
 */
export function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    // Silent fail on quota exceeded
  }
}

/**
 * Load multiple keys and return as object.
 * keys: { keyName: 'localStorage_key_name', ... }
 * Returns { keyName: [...], ... }
 */
export function loadMultipleFromStorage(keys) {
  const result = {};
  for (const [name, key] of Object.entries(keys)) {
    result[name] = loadFromStorage(key);
  }
  return result;
}

/**
 * Add record to array with max-records cap.
 * Returns new array with record at start, capped to maxRecords.
 */
export function addRecordWithCap(newRecord, records, maxRecords = 100) {
  const updated = [newRecord, ...records].slice(0, maxRecords);
  return updated;
}

/**
 * Create a storage manager for a specific key.
 * Provides load/save/addRecord/clear methods.
 */
export function createStorageManager(storageKey, maxRecords = 100) {
  return {
    load: () => loadFromStorage(storageKey),
    save: (data) => saveToStorage(storageKey, data),
    addRecord: (record, records = null) => {
      const current = records || loadFromStorage(storageKey);
      return addRecordWithCap(record, current, maxRecords);
    },
    clear: () => saveToStorage(storageKey, []),
  };
}