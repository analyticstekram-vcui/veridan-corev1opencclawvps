import React, { useMemo } from 'react';
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

const statusColors = {
  active: 'text-primary bg-primary/10 border-primary/30',
  inactive: 'text-muted-foreground bg-secondary/60 border-border',
  suspended: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  closed: 'text-destructive bg-destructive/10 border-destructive/30',
  pending: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
};

const riskColors = {
  low: 'text-primary',
  medium: 'text-amber-500',
  high: 'text-orange-500',
  critical: 'text-destructive',
};

const approvalColors = {
  approved: 'text-primary',
  pending: 'text-amber-500',
  rejected: 'text-destructive',
  expired: 'text-muted-foreground',
};

const COLS = [
  { key: 'facilityName', label: 'Facility Name', width: 'min-w-[140px]' },
  { key: 'borrowerEntityName', label: 'Borrower Entity', width: 'min-w-[120px]' },
  { key: 'creditLimitCents', label: 'Credit Limit', width: 'min-w-[100px]', align: 'right' },
  { key: 'availableCreditCents', label: 'Available', width: 'min-w-[90px]', align: 'right' },
  { key: 'utilization', label: 'Util %', width: 'min-w-[70px]', align: 'right' },
  { key: 'aprBps', label: 'APR', width: 'min-w-[65px]', align: 'right' },
  { key: 'status', label: 'Status', width: 'min-w-[80px]' },
  { key: 'riskRating', label: 'Risk', width: 'min-w-[65px]' },
  { key: 'approvalStatus', label: 'Approval', width: 'min-w-[80px]' },
  { key: 'paymentDueDate', label: 'Due Date', width: 'min-w-[90px]' },
  { key: 'promoEndDate', label: 'Promo', width: 'min-w-[90px]' },
];

export default function CreditFacilityTable({ facilities, filters, loading, selectedId, onSelect }) {
  const filtered = useMemo(() => {
    return facilities.filter(f => {
      if (filters.status && f.status !== filters.status) return false;
      if (filters.entityId && f.borrowerEntityName !== filters.entityId) return false;
      if (filters.dateFrom && f.openedDate && f.openedDate < filters.dateFrom) return false;
      if (filters.dateTo && f.openedDate && f.openedDate > filters.dateTo) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        return (
          f.facilityName?.toLowerCase().includes(q) ||
          f.facilityCode?.toLowerCase().includes(q) ||
          f.borrowerEntityName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [facilities, filters]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[11px] font-mono text-muted-foreground/40">No credit facilities configured.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-[11px] font-mono border-collapse">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="border-b border-border">
            {COLS.map(col => (
              <th
                key={col.key}
                className={`px-3 py-2 text-left text-[9px] uppercase tracking-widest text-muted-foreground/60 font-normal whitespace-nowrap ${col.width} ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map(f => {
            const util = f.creditLimitCents > 0
              ? ((f.currentBalanceCents || 0) / f.creditLimitCents * 100).toFixed(1)
              : '0.0';
            const utilNum = parseFloat(util);
            const utilColor = utilNum >= 90 ? 'text-destructive' : utilNum >= 70 ? 'text-amber-500' : 'text-primary';
            const isSelected = f.id === selectedId;

            const now = new Date();
            const in45 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
            const promoSoon = f.promoEndDate && new Date(f.promoEndDate) <= in45 && new Date(f.promoEndDate) >= now;

            return (
              <tr
                key={f.id}
                onClick={() => onSelect(isSelected ? null : f)}
                className={`border-b border-border/40 cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-secondary/30'
                }`}
              >
                <td className="px-3 py-2 text-foreground font-medium whitespace-nowrap">{f.facilityName || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{f.borrowerEntityName || '—'}</td>
                <td className="px-3 py-2 text-right">{centsToDisplay(f.creditLimitCents)}</td>
                <td className="px-3 py-2 text-right text-primary">{centsToDisplay(f.availableCreditCents)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${utilColor}`}>{util}%</td>
                <td className="px-3 py-2 text-right text-muted-foreground">{bpsToPercent(f.aprBps)}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-wider ${statusColors[f.status] || 'text-muted-foreground'}`}>
                    {f.status || '—'}
                  </span>
                </td>
                <td className={`px-3 py-2 capitalize ${riskColors[f.riskRating] || 'text-muted-foreground'}`}>
                  {f.riskRating || '—'}
                </td>
                <td className={`px-3 py-2 capitalize ${approvalColors[f.approvalStatus] || 'text-muted-foreground'}`}>
                  {f.approvalStatus || '—'}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{f.paymentDueDate || '—'}</td>
                <td className={`px-3 py-2 ${promoSoon ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {f.promoEndDate || '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}