import React from 'react';
import { Search, X } from 'lucide-react';

const STATUS_OPTIONS = ['active', 'inactive', 'suspended', 'closed', 'pending'];

export default function CreditFacilityFilters({ filters, onChange, facilities = [] }) {
  const entities = [...new Set(facilities.map(f => f.borrowerEntityName).filter(Boolean))];

  const set = (key, val) => onChange(prev => ({ ...prev, [key]: val || null }));
  const reset = () => onChange({ status: null, entityId: null, dateFrom: null, dateTo: null, search: '' });

  const hasFilters = filters.status || filters.entityId || filters.dateFrom || filters.dateTo || filters.search;

  return (
    <div className="shrink-0 bg-card border-b border-border px-4 py-2 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex items-center">
        <Search className="absolute left-2 w-3 h-3 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={filters.search || ''}
          onChange={e => onChange(prev => ({ ...prev, search: e.target.value }))}
          placeholder="Search facilities..."
          className="pl-7 pr-2 py-1 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 w-44 transition-colors"
        />
      </div>

      {/* Status */}
      <select
        value={filters.status || ''}
        onChange={e => set('status', e.target.value)}
        className="px-2 py-1 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors"
      >
        <option value="">All Statuses</option>
        {STATUS_OPTIONS.map(s => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      {/* Entity */}
      <select
        value={filters.entityId || ''}
        onChange={e => set('entityId', e.target.value)}
        className="px-2 py-1 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors"
      >
        <option value="">All Entities</option>
        {entities.map(e => <option key={e} value={e}>{e}</option>)}
      </select>

      {/* Date From */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-muted-foreground/60">From</span>
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={e => set('dateFrom', e.target.value)}
          className="px-2 py-1 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Date To */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] font-mono text-muted-foreground/60">To</span>
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={e => set('dateTo', e.target.value)}
          className="px-2 py-1 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {hasFilters && (
        <button
          onClick={reset}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-colors"
        >
          <X className="w-3 h-3" /> Reset
        </button>
      )}
    </div>
  );
}