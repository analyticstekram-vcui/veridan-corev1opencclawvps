import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

function centsToDisplay(cents) {
  if (cents == null) return '—';
  const val = cents / 100;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

const typeColors = {
  draw: 'text-amber-500',
  paydown: 'text-primary',
  fee: 'text-destructive',
  interest: 'text-orange-500',
  adjustment: 'text-blue-400',
  allocation: 'text-purple-400',
  reversal: 'text-muted-foreground',
};

const COLS = [
  { label: 'Date', key: 'eventDate' },
  { label: 'Type', key: 'eventType' },
  { label: 'Description', key: 'description' },
  { label: 'Amount', key: 'amountCents', align: 'right' },
  { label: 'Balance After', key: 'balanceAfterCents', align: 'right' },
  { label: 'Available After', key: 'availableAfterCents', align: 'right' },
  { label: 'Source Account', key: 'sourceAccount' },
  { label: 'Dest Account', key: 'destinationAccount' },
];

export default function CreditLedgerEventsTable({ events, loading, onRefresh }) {
  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border/50">
        <span className="text-[10px] font-mono text-muted-foreground/60">{events.length} events</span>
        <button
          onClick={onRefresh}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[11px] font-mono text-muted-foreground/40">
          No ledger events
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px] font-mono border-collapse">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                {COLS.map(col => (
                  <th
                    key={col.key}
                    className={`px-3 py-2 text-[9px] uppercase tracking-widest text-muted-foreground/60 font-normal whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => (
                <tr key={e.id || i} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{e.eventDate || '—'}</td>
                  <td className={`px-3 py-2 capitalize font-medium ${typeColors[e.eventType] || 'text-foreground'}`}>{e.eventType || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{e.description || '—'}</td>
                  <td className={`px-3 py-2 text-right font-medium ${e.amountCents > 0 ? 'text-amber-500' : 'text-primary'}`}>
                    {centsToDisplay(e.amountCents)}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{centsToDisplay(e.balanceAfterCents)}</td>
                  <td className="px-3 py-2 text-right text-primary">{centsToDisplay(e.availableAfterCents)}</td>
                  <td className="px-3 py-2 text-muted-foreground/70 truncate max-w-[100px]">{e.sourceAccount || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground/70 truncate max-w-[100px]">{e.destinationAccount || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}