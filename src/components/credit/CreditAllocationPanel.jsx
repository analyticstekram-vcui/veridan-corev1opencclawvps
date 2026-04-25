import React from 'react';
import { Loader2 } from 'lucide-react';

function centsToDisplay(cents) {
  if (cents == null) return '—';
  const val = cents / 100;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function bpsToPercent(bps) {
  if (bps == null) return '—';
  return `${(bps / 100).toFixed(2)}%`;
}

const riskColors = {
  low: 'text-primary',
  medium: 'text-amber-500',
  high: 'text-orange-500',
  critical: 'text-destructive',
};

const statusColors = {
  active: 'text-primary bg-primary/10 border-primary/30',
  repaid: 'text-muted-foreground bg-secondary/60 border-border',
  defaulted: 'text-destructive bg-destructive/10 border-destructive/30',
};

const COLS = [
  { label: 'Type', key: 'allocationType' },
  { label: 'Amount', key: 'amountCents', align: 'right' },
  { label: 'Outstanding', key: 'outstandingCents', align: 'right' },
  { label: 'Cost of Capital', key: 'costOfCapitalBps', align: 'right' },
  { label: 'Expected ROI', key: 'expectedRoiBps', align: 'right' },
  { label: 'Risk', key: 'riskRating' },
  { label: 'Allocated', key: 'allocationDate' },
  { label: 'Repayment', key: 'repaymentDate' },
  { label: 'Status', key: 'status' },
];

export default function CreditAllocationPanel({ allocations, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      </div>
    );
  }

  if (!allocations || allocations.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[11px] font-mono text-muted-foreground/40">
        No allocations
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-[11px] font-mono border-collapse">
        <thead className="sticky top-0 bg-card">
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
          {allocations.map(a => (
            <tr key={a.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
              <td className="px-3 py-2 capitalize text-foreground">{a.allocationType || '—'}</td>
              <td className="px-3 py-2 text-right">{centsToDisplay(a.amountCents)}</td>
              <td className="px-3 py-2 text-right text-amber-500">{centsToDisplay(a.outstandingCents)}</td>
              <td className="px-3 py-2 text-right">{bpsToPercent(a.costOfCapitalBps)}</td>
              <td className="px-3 py-2 text-right text-primary">{bpsToPercent(a.expectedRoiBps)}</td>
              <td className={`px-3 py-2 capitalize ${riskColors[a.riskRating] || 'text-muted-foreground'}`}>{a.riskRating || '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{a.allocationDate || '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{a.repaymentDate || '—'}</td>
              <td className="px-3 py-2">
                <span className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-wider ${statusColors[a.status] || ''}`}>
                  {a.status || '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}