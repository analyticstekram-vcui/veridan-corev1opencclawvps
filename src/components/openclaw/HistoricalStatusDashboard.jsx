/**
 * HistoricalStatusDashboard
 * Read-only chronological view of prior status bridge checks.
 *
 * SAFETY CONTRACT:
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback, useEffect } from 'react';
import { CheckCircle2, XCircle, Copy, ShieldCheck, RefreshCw, Clock, Wifi, WifiOff, Shield } from 'lucide-react';

const BRIDGE_KEY    = 'openclawReadOnlyStatusBridgeReports';
const DASHBOARD_KEY = 'openclawHistoricalStatusDashboardReports';

const FILTERS = ['ALL', 'ONLINE', 'FAILED', 'CLOUDFLARE_DETECTED'];

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem(BRIDGE_KEY) || '[]');
  } catch { return []; }
}

function saveDashboardReport(report) {
  try {
    const all = JSON.parse(localStorage.getItem(DASHBOARD_KEY) || '[]');
    all.unshift(report);
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(all.slice(0, 30)));
  } catch {}
}

function statusColor(r) {
  if (r.gatewayStatus === 'ONLINE') return 'text-primary';
  if (r.gatewayStatus === 'CLOUDFLARE_PROTECTED') return 'text-amber-500';
  return 'text-destructive';
}

function BoolBadge({ value, trueIsGood = true }) {
  const good = trueIsGood ? value : !value;
  return (
    <span className={`font-bold ${good ? 'text-primary' : 'text-destructive'}`}>
      {String(value)}
    </span>
  );
}

function CopyButton({ data, label = 'Copy JSON' }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export default function HistoricalStatusDashboard({ refreshTrigger }) {
  const [filter, setFilter]   = useState('ALL');
  const [records, setRecords] = useState(() => loadRecords());
  const [generated, setGenerated] = useState(false);

  const refresh = useCallback(() => {
    const fresh = loadRecords();
    setRecords(fresh);

    const reportId = 'hsd-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    const now = new Date().toISOString();

    const total       = fresh.length;
    const successful  = fresh.filter(r => r.reachable === true).length;
    const failed      = fresh.filter(r => r.reachable === false || r.reachable === null).length;
    const cfDetected  = fresh.filter(r => r.cfAccessDetected === true).length;
    const latestRec   = fresh[0] || null;
    const lastOnlineRec = fresh.find(r => r.reachable === true);

    const report = {
      reportId,
      generatedAt:          now,
      totalChecks:          total,
      successfulChecks:     successful,
      failedChecks:         failed,
      cfAccessDetectedCount: cfDetected,
      latestStatus:         latestRec?.gatewayStatus ?? 'NONE',
      latestTimestamp:      latestRec?.timestamp ?? null,
      lastOnlineTime:       lastOnlineRec?.timestamp ?? null,
      executionAttempted:   false,
      openClawCommandSent:  false,
      secretExposed:        false,
      gatewayMode:          'READ_ONLY',
      executionMode:        'DISABLED',
      note:                 'Historical status dashboard generated. Read-only. No execution. No dispatch.',
    };

    saveDashboardReport(report);
    tryAppendAudit({
      event:     'historical_status_dashboard_generated',
      reportId,
      total,
      successful,
      failed,
      note:      `Historical status dashboard generated (${reportId}). ${total} records. No execution. No dispatch.`,
    });

    setGenerated(true);
  }, []);

  // Auto-load on mount
  useEffect(() => { refresh(); }, [refreshTrigger]);

  const filtered = records.filter(r => {
    if (filter === 'ONLINE')               return r.gatewayStatus === 'ONLINE';
    if (filter === 'FAILED')               return !r.reachable;
    if (filter === 'CLOUDFLARE_DETECTED')  return r.cfAccessDetected === true;
    return true;
  });

  const total      = records.length;
  const successful = records.filter(r => r.reachable === true).length;
  const failed     = records.filter(r => !r.reachable).length;
  const cfCount    = records.filter(r => r.cfAccessDetected === true).length;
  const latestRec  = records[0] || null;
  const lastOnline = records.find(r => r.reachable === true);

  const summaryCards = [
    { label: 'Total Checks',         value: total,                                          color: 'text-foreground' },
    { label: 'Successful',           value: successful,                                     color: 'text-primary' },
    { label: 'Failed',               value: failed,                                         color: failed > 0 ? 'text-destructive' : 'text-slate-500' },
    { label: 'Latest Status',        value: latestRec?.gatewayStatus ?? '—',                color: latestRec?.reachable ? 'text-primary' : 'text-destructive' },
    { label: 'Last Online',          value: lastOnline ? new Date(lastOnline.timestamp).toLocaleTimeString() : '—', color: 'text-slate-300' },
    { label: 'CF Access Detected',   value: cfCount,                                        color: cfCount > 0 ? 'text-amber-500' : 'text-slate-500' },
  ];

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Historical Status</div>
          <div className="text-[13px] font-bold text-foreground">Historical Status Dashboard</div>
        </div>
        <button type="button" onClick={refresh}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">READ_ONLY / LOCKED</span> — Reads localStorage only. No network calls. No dispatch. No execution.</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-card border border-border/60 rounded-lg px-3 py-2.5">
            <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{c.label}</div>
            <div className={`text-[12px] font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-[8px] font-bold rounded border transition-colors ${
              filter === f
                ? 'bg-primary/15 border-primary text-primary'
                : 'bg-secondary/20 border-border text-slate-400 hover:bg-secondary/40'
            }`}>
            {f}
          </button>
        ))}
        <span className="ml-auto text-[8px] text-slate-500 self-center">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-[9px] text-slate-500">No records found for filter: {filter}</div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  {['Timestamp', 'Endpoint', 'HTTP', 'Reachable', 'CF Access', 'Exec Attempted', 'Secret Exposed', 'Gateway Mode', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[7px] uppercase tracking-widest text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.callId || i} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 font-mono text-slate-400 whitespace-nowrap">
                      {r.timestamp ? new Date(r.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-blue-400 whitespace-nowrap">{r.endpoint ?? '—'}</td>
                    <td className="px-3 py-2 font-semibold whitespace-nowrap">
                      <span className={r.httpStatus === 200 ? 'text-primary' : r.httpStatus ? 'text-amber-500' : 'text-slate-500'}>
                        {r.httpStatus ?? 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.reachable
                        ? <span className="flex items-center gap-1 text-primary"><Wifi className="w-3 h-3" />yes</span>
                        : <span className="flex items-center gap-1 text-destructive"><WifiOff className="w-3 h-3" />no</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.cfAccessDetected
                        ? <span className="flex items-center gap-1 text-amber-500"><Shield className="w-3 h-3" />yes</span>
                        : <span className="text-slate-500">no</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap"><BoolBadge value={r.executionAttempted ?? false} trueIsGood={false} /></td>
                    <td className="px-3 py-2 whitespace-nowrap"><BoolBadge value={r.secretExposed ?? false} trueIsGood={false} /></td>
                    <td className="px-3 py-2 text-amber-500 font-semibold whitespace-nowrap">{r.gatewayMode ?? 'READ_ONLY'}</td>
                    <td className={`px-3 py-2 font-bold whitespace-nowrap ${statusColor(r)}`}>{r.gatewayStatus ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <CopyButton data={records} label="Copy Status History JSON" />
        <button type="button" onClick={refresh}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors">
          <RefreshCw className="w-3 h-3" /> Generate Dashboard Report
        </button>
      </div>

      {/* Safety footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Historical status dashboard is read-only. No OpenClaw command dispatch. No execution. No trading. No credentials exposed.
      </div>
    </div>
  );
}