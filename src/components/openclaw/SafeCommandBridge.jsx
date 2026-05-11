import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Shield, Play, Loader2, CheckCircle2, XCircle,
  Globe, FileText, Camera, AlertTriangle, ScrollText, Ban
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const COMMAND_TYPES = [
  { id: 'OPEN_URL_AND_READ_TITLE',  label: 'Read Title',    icon: FileText },
  { id: 'OPEN_URL_AND_SCREENSHOT',  label: 'Screenshot',    icon: Camera  },
];

// Client-side URL block patterns (server is final authority)
const CLIENT_BLOCKED = [
  /^http:\/\//i,
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /192\.168\./,
  /^https?:\/\/10\./,
  /172\.(1[6-9]|2\d|3[01])\./,
  /file:\/\//i,
  /javascript:/i,
];

function clientBlockReason(url) {
  if (!url) return null;
  if (!url.startsWith('https://')) return 'URL must start with https://';
  for (const re of CLIENT_BLOCKED) {
    if (re.test(url)) return `Blocked: private/unsafe URL pattern detected`;
  }
  return null;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  ready:      { label: 'Ready',      color: 'text-muted-foreground',  dot: 'bg-muted-foreground/40', icon: null },
  executing:  { label: 'Executing',  color: 'text-blue-400',          dot: 'bg-blue-400',            icon: Loader2, spin: true },
  success:    { label: 'Success',    color: 'text-primary',           dot: 'bg-primary',             icon: CheckCircle2 },
  blocked:    { label: 'Blocked',    color: 'text-amber-500',         dot: 'bg-amber-500',           icon: Ban },
  failed:     { label: 'Failed',     color: 'text-destructive',       dot: 'bg-destructive',         icon: XCircle },
};

function nowTs() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// ── Result Panel ──────────────────────────────────────────────────────────────
function ResultPanel({ result, uiStatus }) {
  const cfg   = STATUS[uiStatus] || STATUS.ready;
  const Icon  = cfg.icon;
  const isReal = result?.executionMode === 'REAL';

  return (
    <div className="bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Command Result</span>
        {result && uiStatus !== 'executing' && (
          isReal
            ? <span className="text-[9px] px-2 py-0.5 border border-primary/30 text-primary bg-primary/5 uppercase tracking-wider">REAL MODE</span>
            : <span className="text-[9px] px-2 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-500/5 uppercase tracking-wider">SIMULATED</span>
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        {Icon && <Icon className={`w-3.5 h-3.5 ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`} />}
        <span className={`text-[13px] font-semibold uppercase ${cfg.color}`}>{cfg.label}</span>
      </div>

      {result && (
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {[
            ['Command ID',    result.commandId,    'font-mono'],
            ['Command Type',  result.commandType,  'font-mono truncate'],
          ].map(([label, val, extra]) => (
            <div key={label} className="bg-secondary/30 border border-border px-3 py-2">
              <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">{label}</div>
              <div className={`text-foreground ${extra}`}>{val || '—'}</div>
            </div>
          ))}

          <div className="bg-secondary/30 border border-border px-3 py-2 col-span-2">
            <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Target URL</div>
            <div className="text-blue-400 font-mono truncate">{result.targetUrl}</div>
          </div>

          {result.pageTitle && (
            <div className="bg-secondary/30 border border-border px-3 py-2 col-span-2">
              <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Page Title</div>
              <div className="text-foreground">{result.pageTitle}</div>
            </div>
          )}

          <div className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Started</div>
            <div className="text-foreground font-mono">{result.startedAt ? new Date(result.startedAt).toLocaleTimeString() : '—'}</div>
          </div>
          <div className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Completed</div>
            <div className="text-foreground font-mono">{result.completedAt ? new Date(result.completedAt).toLocaleTimeString() : '—'}</div>
          </div>

          {result.error && (
            <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 col-span-2">
              <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Error</div>
              <div className="text-destructive break-all">{result.error}</div>
            </div>
          )}
        </div>
      )}

      {/* Diagnostics */}
      {result?.diagnostics?.length > 0 && (
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1.5">Diagnostics</div>
          <div className="space-y-0.5">
            {result.diagnostics.map((d, i) => {
              const ok   = d.includes(': YES') || d.includes(': REAL') || d.includes('executed');
              const fail = d.includes('FAILED') || d.includes('command_failed') || d.includes('SIMULATED') || d.includes('exception');
              return (
                <div key={i} className={`font-mono text-[10px] ${fail ? 'text-amber-400' : ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
                  › {d}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Audit Log Table ───────────────────────────────────────────────────────────
function AuditLogTable({ entries }) {
  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <ScrollText className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Audit Log</span>
        <span className="text-[9px] text-muted-foreground/40">({entries.length} entries)</span>
      </div>

      {entries.length === 0 ? (
        <div className="flex items-center justify-center h-12 text-[11px] text-muted-foreground/30">
          No commands executed yet
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="grid grid-cols-5 gap-2 px-4 py-1.5 border-b border-border/40 text-[9px] text-muted-foreground/30 uppercase tracking-wider">
            <div>Time</div>
            <div className="col-span-2">Command Type</div>
            <div>Status</div>
            <div className="text-right">Mode</div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border/30 max-h-52 overflow-auto">
            {[...entries].reverse().map((e, i) => {
              const statusCfg = STATUS[e.uiStatus] || STATUS.ready;
              return (
                <div key={i} className="grid grid-cols-5 gap-2 px-4 py-2 text-[10px] font-mono hover:bg-secondary/20 transition-colors">
                  <div className="text-muted-foreground/50">{e.time}</div>
                  <div className="text-foreground col-span-2 truncate">{e.commandType}</div>
                  <div className={statusCfg.color}>{statusCfg.label}</div>
                  <div className={`text-right ${e.executionMode === 'REAL' ? 'text-primary' : 'text-amber-400/60'}`}>
                    {e.executionMode || 'SIMULATED'}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SafeCommandBridge() {
  const [targetUrl,   setTargetUrl]   = useState('https://example.com');
  const [commandType, setCommandType] = useState('OPEN_URL_AND_READ_TITLE');
  const [running,     setRunning]     = useState(false);
  const [uiStatus,    setUiStatus]    = useState('ready');
  const [result,      setResult]      = useState(null);
  const [clientError, setClientError] = useState(null);
  const [auditLog,    setAuditLog]    = useState([]);

  const blockReason = clientBlockReason(targetUrl);

  const handleExecute = async () => {
    if (running) return;

    // Client-side block check
    const clientBlock = clientBlockReason(targetUrl);
    if (clientBlock) {
      setClientError(clientBlock);
      setUiStatus('blocked');
      setResult({ commandId: '—', commandType, targetUrl, error: clientBlock, diagnostics: [`client_blocked: ${clientBlock}`] });
      setAuditLog(prev => [...prev, { time: nowTs(), commandType, targetUrl, uiStatus: 'blocked', executionMode: 'N/A' }]);
      return;
    }

    setClientError(null);
    setRunning(true);
    setUiStatus('executing');
    setResult(null);

    let res;
    try {
      const response = await base44.functions.invoke('openclawSafeBridge', {
        commandType,
        targetUrl,
        operator: 'VeridanCore',
        governanceLevel: 'SAFE_READ_ONLY',
      });
      res = response.data;
    } catch (err) {
      const errMsg = err?.response?.data?.error || err.message || 'Request failed';
      setUiStatus('failed');
      setResult({ commandId: '—', commandType, targetUrl, error: errMsg, diagnostics: [`exception: ${errMsg}`], executionMode: 'SIMULATED' });
      setAuditLog(prev => [...prev, { time: nowTs(), commandType, targetUrl, uiStatus: 'failed', executionMode: 'SIMULATED' }]);
      setRunning(false);
      return;
    }

    const finalStatus = res.status === 'success' ? 'success' : res.status === 'blocked' ? 'blocked' : 'failed';
    setUiStatus(finalStatus);
    setResult(res);
    setAuditLog(prev => [...prev, {
      time: nowTs(),
      commandType: res.commandType,
      targetUrl:   res.targetUrl,
      uiStatus:    finalStatus,
      executionMode: res.executionMode || 'SIMULATED',
    }]);
    setRunning(false);
  };

  return (
    <div className="p-6 max-w-3xl space-y-5 font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        <div className="w-7 h-7 bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Shield className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold tracking-wider text-foreground">SAFE BROWSER COMMAND BRIDGE</h2>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            Live · openclaw.veridancore.com/api/safe-command · Read-only governance
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 border border-primary/30 bg-primary/5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary">GOVERNANCE: SAFE_READ_ONLY</span>
        </div>
      </div>

      {/* Command Builder */}
      <div className="bg-card border border-border p-4 space-y-4">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">
          Command Builder · CF-Access secured
        </div>

        {/* Target URL */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5 mb-1.5">
            <Globe className="w-2.5 h-2.5" /> Target URL
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={e => { setTargetUrl(e.target.value); setClientError(null); if (uiStatus !== 'ready') setUiStatus('ready'); }}
            className={`w-full px-3 py-2 bg-secondary/50 border text-[12px] text-blue-400 font-mono outline-none transition-colors ${
              blockReason ? 'border-amber-500/50 focus:border-amber-500' : 'border-border focus:border-primary/50'
            }`}
            placeholder="https://example.com"
          />
          {blockReason && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-amber-500">
              <Ban className="w-3 h-3" /> {blockReason}
            </div>
          )}
        </div>

        {/* Command Type */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 block mb-1.5">
            Command Type
          </label>
          <div className="flex gap-2">
            {COMMAND_TYPES.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setCommandType(id)}
                className={`flex items-center gap-1.5 px-3 py-2 border text-[10px] transition-colors flex-1 justify-center ${
                  commandType === id
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}>
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={running || !!blockReason || !targetUrl.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...</>
            : <><Play className="w-3.5 h-3.5" /> Execute Command</>
          }
        </button>

        {/* Warning */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[9px] text-amber-500/70 leading-relaxed">
            Safe read-only mode only. No login, no form submission, no trading, no credentials.
            CF-Access service tokens sent server-side only — never exposed to browser.
          </div>
        </div>
      </div>

      {/* Result Panel — always visible after first attempt */}
      {(result || uiStatus !== 'ready') && (
        <ResultPanel result={result} uiStatus={uiStatus} />
      )}

      {/* Audit Log */}
      <AuditLogTable entries={auditLog} />
    </div>
  );
}