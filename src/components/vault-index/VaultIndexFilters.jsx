import React from 'react';
import { Search, X } from 'lucide-react';

export default function VaultIndexFilters({ filters, onChange, uniqueFolders, uniqueSources, uniqueDraftTypes }) {
  const set = (key, val) => onChange(prev => ({ ...prev, [key]: val }));
  const clear = () => onChange({ search: '', folder: '', source: '', draftType: '' });
  const hasActive = filters.search || filters.folder || filters.source || filters.draftType;

  return (
    <div className="border border-border/40 bg-card rounded-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest">Filters</span>
        {hasActive && (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-[7px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            placeholder="Search filename / path / folder…"
            className="w-full pl-7 pr-3 py-1.5 text-[8px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40"
          />
        </div>

        {/* Folder */}
        <select
          value={filters.folder}
          onChange={e => set('folder', e.target.value)}
          className="w-full px-2.5 py-1.5 text-[8px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 focus:outline-none focus:border-primary/40"
        >
          <option value="">All Folders</option>
          {uniqueFolders.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {/* Source */}
        <select
          value={filters.source}
          onChange={e => set('source', e.target.value)}
          className="w-full px-2.5 py-1.5 text-[8px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 focus:outline-none focus:border-primary/40"
        >
          <option value="">All Sources</option>
          {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Draft Type */}
        <select
          value={filters.draftType}
          onChange={e => set('draftType', e.target.value)}
          className="w-full px-2.5 py-1.5 text-[8px] bg-secondary/30 border border-border/30 rounded-sm text-slate-200 focus:outline-none focus:border-primary/40"
        >
          <option value="">All Draft Types</option>
          {uniqueDraftTypes.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
    </div>
  );
}