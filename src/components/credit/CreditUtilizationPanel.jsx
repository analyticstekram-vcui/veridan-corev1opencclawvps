import React from 'react';

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

function UtilizationBar({ percent }) {
  const clamped = Math.min(100, Math.max(0, percent || 0));
  const color = clamped >= 90 ? 'bg-destructive' : clamped >= 70 ? 'bg-amber-500' : 'bg-primary';
  return (
    <div className="mt-2">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>Utilization</span><span>{clamped.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-secondary/60 rounded-sm overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${clamped}%` }} />
      </div>
      {clamped >= 90 && <div className="text-[10px] font-mono text-destructive mt-1">⚠ Critical utilization</div>}
      {clamped >= 70 && clamped < 90 && <div className="text-[10px] font-mono text-amber-500 mt-1">⚡ High utilization</div>}
    </div>
  );
}

function AvailableCreditBar({ availableCents, limitCents }) {
  const pct = limitCents > 0 ? (availableCents / limitCents * 100) : 100;
  return (
    <div className="mt-3">
      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
        <span>Available Credit</span><span>{centsToDisplay(availableCents)}</span>
      </div>
      <div className="h-2 bg-secondary/60 rounded-sm overflow-hidden">
        <div className="h-full bg-primary/60 transition-all duration-500" style={{ width: `${Math.max(0, pct)}%` }} />
      </div>
    </div>
  );
}

function Row({ label, value, valueClass }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border/40 last:border-b-0">
      <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider w-40 shrink-0 pt-0.5">{label}</div>
      <div className={`text-[11px] font-mono ${valueClass || 'text-foreground'}`}>{value ?? '—'}</div>
    </div>
  );
}

export default function CreditUtilizationPanel({ facility: f }) {
  const utilization = f.creditLimitCents > 0
    ? ((f.currentBalanceCents || 0) / f.creditLimitCents * 100)
    : 0;

  return (
    <div className="p-5 space-y-6">
      {/* Bars */}
      <div className="p-4 border border-border bg-card/50">
        <UtilizationBar percent={utilization} />
        <AvailableCreditBar availableCents={f.availableCreditCents} limitCents={f.creditLimitCents} />
      </div>

      {/* Figures */}
      <div>
        <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-2">Credit Figures</div>
        <Row label="Credit Limit" value={centsToDisplay(f.creditLimitCents)} />
        <Row label="Current Balance" value={centsToDisplay(f.currentBalanceCents)} valueClass="text-amber-500" />
        <Row label="Available Credit" value={centsToDisplay(f.availableCreditCents)} valueClass="text-primary" />
        <Row label="Utilization %" value={`${utilization.toFixed(2)}%`} />
      </div>

      {/* Rates */}
      <div>
        <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-2">Rate Information</div>
        <Row label="APR" value={bpsToPercent(f.aprBps)} />
        <Row label="Promo APR" value={bpsToPercent(f.promoAprBps)} />
        <Row label="Promo Start" value={f.promoStartDate} />
        <Row label="Promo End" value={f.promoEndDate} />
      </div>

      {/* Payment */}
      <div>
        <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-2">Payment Schedule</div>
        <Row label="Minimum Payment" value={centsToDisplay(f.minimumPaymentCents)} />
        <Row label="Statement Day" value={f.statementDay != null ? `Day ${f.statementDay}` : null} />
        <Row label="Due Day" value={f.dueDay != null ? `Day ${f.dueDay}` : null} />
      </div>
    </div>
  );
}