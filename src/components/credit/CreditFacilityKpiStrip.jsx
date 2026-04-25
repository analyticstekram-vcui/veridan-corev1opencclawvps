import React from 'react';
import { CreditCard, TrendingDown, TrendingUp, AlertTriangle, DollarSign, Clock } from 'lucide-react';

function centsToDisplay(cents) {
  if (cents == null) return '$0';
  const val = cents / 100;
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function KpiCard({ icon: Icon, label, value, sub, valueClass, loading }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-r border-border last:border-r-0 min-w-0 flex-1">
      <div className="w-7 h-7 rounded-sm bg-secondary/80 border border-border flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-0.5">{label}</div>
        {loading ? (
          <div className="h-4 w-20 bg-secondary/50 animate-pulse rounded-sm" />
        ) : (
          <div className={`text-sm font-mono font-semibold ${valueClass || 'text-foreground'}`}>{value}</div>
        )}
        {sub && !loading && <div className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export default function CreditFacilityKpiStrip({ facilities = [], loading }) {
  const totalLimit = facilities.reduce((s, f) => s + (f.creditLimitCents || 0), 0);
  const totalBalance = facilities.reduce((s, f) => s + (f.currentBalanceCents || 0), 0);
  const totalAvailable = facilities.reduce((s, f) => s + (f.availableCreditCents || 0), 0);
  const totalMin = facilities.reduce((s, f) => s + (f.minimumPaymentCents || 0), 0);
  const utilization = totalLimit > 0 ? ((totalBalance / totalLimit) * 100).toFixed(1) : '0.0';

  const now = new Date();
  const in45 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);
  const promoExpiring = facilities.filter(f => {
    if (!f.promoEndDate) return false;
    const d = new Date(f.promoEndDate);
    return d >= now && d <= in45;
  }).length;

  const utilizationColor =
    parseFloat(utilization) >= 90 ? 'text-destructive' :
    parseFloat(utilization) >= 70 ? 'text-amber-500' :
    'text-primary';

  return (
    <div className="shrink-0 bg-card border-b border-border flex overflow-x-auto">
      <KpiCard icon={CreditCard} label="Total Credit Limit" value={centsToDisplay(totalLimit)} loading={loading} />
      <KpiCard icon={TrendingDown} label="Current Balance" value={centsToDisplay(totalBalance)} valueClass="text-amber-500" loading={loading} />
      <KpiCard icon={TrendingUp} label="Available Credit" value={centsToDisplay(totalAvailable)} valueClass="text-primary" loading={loading} />
      <KpiCard
        icon={DollarSign}
        label="System Utilization"
        value={`${utilization}%`}
        valueClass={utilizationColor}
        sub={`${facilities.length} facilities`}
        loading={loading}
      />
      <KpiCard icon={DollarSign} label="Monthly Minimums" value={centsToDisplay(totalMin)} loading={loading} />
      <KpiCard
        icon={AlertTriangle}
        label="Promo Expiring"
        value={`${promoExpiring}`}
        sub="within 45 days"
        valueClass={promoExpiring > 0 ? 'text-amber-500' : 'text-muted-foreground'}
        loading={loading}
      />
    </div>
  );
}