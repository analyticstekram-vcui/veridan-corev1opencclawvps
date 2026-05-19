/**
 * ObsidianVaultFolderMap — Preview-only vault folder structure map.
 * No file reads, no Obsidian API, no filesystem access.
 * Operator-defined folder tree. PREVIEW_ONLY.
 */

import React, { useState, useEffect } from 'react';
import { loadFromStorage, saveToStorage } from '../../utils/localStorageManager';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'veridanObsidianVaultFolderMap';

const DEFAULT_FOLDERS = [
  { id: 'f1', name: 'Veridan Core', parent: null, depth: 0 },
  { id: 'f2', name: 'Trading', parent: 'f1', depth: 1 },
  { id: 'f3', name: 'Public Credit', parent: 'f1', depth: 1 },
  { id: 'f4', name: 'Business Formation', parent: 'f1', depth: 1 },
  { id: 'f5', name: 'AI Command', parent: 'f1', depth: 1 },
  { id: 'f6', name: 'OpenClaw Governance', parent: 'f1', depth: 1 },
  { id: 'f7', name: 'Audit & Evidence', parent: 'f1', depth: 1 },
  { id: 'f8', name: 'Baselines', parent: 'f1', depth: 1 },
  { id: 'f9', name: 'Strategies', parent: 'f2', depth: 2 },
  { id: 'f10', name: 'Risk Rules', parent: 'f2', depth: 2 },
  { id: 'f11', name: 'Credit Profiles', parent: 'f3', depth: 2 },
  { id: 'f12', name: 'Disputes', parent: 'f3', depth: 2 },
  { id: 'f13', name: 'Entity Registry', parent: 'f4', depth: 2 },
  { id: 'f14', name: 'EIN & Banking', parent: 'f4', depth: 2 },
];

function FolderRow({ folder, expanded, onToggle, onDelete, allFolders }) {
  const hasChildren = allFolders.some(f => f.parent === folder.id);
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/30 rounded-sm group"
      style={{ paddingLeft: `${12 + folder.depth * 16}px` }}
    >
      <button
        type="button"
        onClick={() => onToggle(folder.id)}
        className="w-3 h-3 shrink-0 text-slate-500"
      >
        {hasChildren
          ? (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)
          : <span className="w-3 h-3 block" />}
      </button>
      {expanded && hasChildren
        ? <FolderOpen className="w-3 h-3 text-amber-400 shrink-0" />
        : <Folder className="w-3 h-3 text-amber-400/60 shrink-0" />}
      <span className="text-[10px] font-mono text-slate-300 flex-1">{folder.name}</span>
      <span className="text-[8px] font-mono text-slate-600 group-hover:text-slate-500">
        depth:{folder.depth}
      </span>
      <button
        type="button"
        onClick={() => onDelete(folder.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/60 hover:text-destructive"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function ObsidianVaultFolderMap() {
  const [folders, setFolders] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [newName, setNewName] = useState('');
  const [newParent, setNewParent] = useState('');

  useEffect(() => {
    const stored = loadFromStorage(STORAGE_KEY);
    setFolders(stored.length ? stored : DEFAULT_FOLDERS);
    const exp = {};
    (stored.length ? stored : DEFAULT_FOLDERS).forEach(f => { exp[f.id] = true; });
    setExpanded(exp);
  }, []);

  const save = (updated) => {
    setFolders(updated);
    saveToStorage(STORAGE_KEY, updated);
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const addFolder = () => {
    const name = newName.trim();
    if (!name) return;
    const parent = newParent || null;
    const parentFolder = folders.find(f => f.id === parent);
    const depth = parentFolder ? parentFolder.depth + 1 : 0;
    const id = `f${Date.now()}`;
    save([...folders, { id, name, parent, depth }]);
    setNewName('');
    setNewParent('');
  };

  const deleteFolder = (id) => {
    save(folders.filter(f => f.id !== id && f.parent !== id));
  };

  const visibleFolders = folders.filter(f => {
    if (!f.parent) return true;
    let cur = f;
    while (cur.parent) {
      if (expanded[cur.parent] === false) return false;
      cur = folders.find(x => x.id === cur.parent) || { parent: null };
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] font-bold uppercase text-primary tracking-widest">Vault Folder Map</div>
          <div className="text-[8px] text-slate-500 mt-0.5">Preview-only · No filesystem access · Operator-defined structure</div>
        </div>
        <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[8px] font-bold uppercase rounded">
          PREVIEW_ONLY
        </span>
      </div>

      {/* Folder Tree */}
      <div className="bg-secondary/10 border border-border/40 rounded-sm py-2 max-h-64 overflow-y-auto">
        {visibleFolders.map(folder => (
          <FolderRow
            key={folder.id}
            folder={folder}
            expanded={!!expanded[folder.id]}
            onToggle={toggleExpand}
            onDelete={deleteFolder}
            allFolders={folders}
          />
        ))}
        {visibleFolders.length === 0 && (
          <div className="text-[9px] text-slate-500 px-4 py-3">No folders defined. Add one below.</div>
        )}
      </div>

      {/* Add Folder */}
      <div className="bg-card border border-border/40 rounded-sm p-3 space-y-2">
        <div className="text-[8px] font-bold uppercase text-slate-400">Add Folder (Preview Only)</div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Folder name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="flex-1 bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
          <select
            value={newParent}
            onChange={e => setNewParent(e.target.value)}
            className="bg-secondary/30 border border-border/40 rounded-sm px-2 py-1.5 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-primary/40"
          >
            <option value="">Root</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addFolder}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="text-[8px] text-slate-600">
          Execution status: <span className="text-amber-400 font-bold">PREVIEW_ONLY</span> · No actual vault folder will be created
        </div>
      </div>
    </div>
  );
}