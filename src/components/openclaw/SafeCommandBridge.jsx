import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Shield, Play, Loader2, CheckCircle2, XCircle, Clock,
  Globe, FileText, Camera, AlertTriangle, ScrollText
} from 'lucide-react';

const COMMAND_TYPES = [
  { id: 'OPEN_URL_AND_READ_TITLE', label: 'OPEN_URL_AND_READ_TITLE', icon: FileText },
  { id: 'OPEN_URL_AND_SCREENSHOT', label: 'OPEN_URL_AND_SCREENSHOT',  icon: Camera },
];

const STATUS_CONFIG = {
  Running: { color: 'text-blue-400',    dot: 'bg-blue-400',    icon: Loader2,       spin: true  },
  success: { color: 'text-primary',     dot: 'bg-primary',     icon: CheckCircle2,  spin: false },
  failed:  { color: 'text-destructive', dot: 'bg-destructive', icon: XCircle,       spin: false },
};

function nowTs() { return new Date().toLocaleTimeString('en-US', { hour12: false }); }

// ── Real backend call ──
async function executeSafeCommand(targetUrl, commandType) {
  const res = await base44.functions.invoke('openclawSafeBridge', {
    commandType,
    targetUrl,
    operator: 'VeridanCore',
    governanceLevel: 'SAFE_READ_ONLY',
  });
  return res.data;
}

// ── Result Panel ──
function ResultPanel({ result }) {
  const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.failed;
  const Icon = cfg.icon;
  const isMock = result.pageTitle?.includes('[MOCK') || result.screenshotCaptured && !result.screenshotUrl;

  return (
    <div className="bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Command Result</span>
        {isMock && (
          <span className="text-[9px] px-2 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-500/5 uppercase tracking-wider">MOCK MODE</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <Icon className={`w-3.5 h-3.5 ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`} />
        <span className={`text-[13px] font-semibold ${cfg.color} uppercase`}>{result.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Command ID</div>
          <div className="text-foreground font-mono">{result.commandId}</div>
        </div>
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Command Type</div>
          <div className="text-foreground font-mono truncate">{result.commandType}</div>
        </div>
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
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Screenshot Status</div>
          <div className={result.screenshotCaptured ? 'text-primary' : 'text-muted-foreground/50'}>
            {result.screenshotCaptured ? 'Captured' : 'N/A'}
          </div>
        </div>
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Screenshot URL</div>
          <div className="text-muted-foreground/40">{result.screenshotUrl || '—'}</div>
        </div>
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Started At</div>
          <div className="text-foreground font-mono">{result.startedAt ? new Date(result.startedAt).toLocaleTimeString() : '—'}</div>
        </div>
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Completed At</div>
          <div className="text-foreground font-mono">{result.completedAt ? new Date(result.completedAt).toLocaleTimeString() : '—'}</div>
        </div>
        {result.error && (
          <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 col-span-2">
            <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Error</div>
            <div className="text-destructive">{result.error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Audit Log Panel ──
function AuditLogPanel({ entries }) {
  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <ScrollText className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Audit Log</span>
        <span className="text-[9px] text-muted-foreground/40">({entries.length} entries)</span>
      </div>
      <div className="divide-y divide-border/40 max-h-56 overflow-auto">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-12 text-[11px] text-muted-foreground/30">
            No commands executed yet
          </div>
        ) : (
          [...entries].reverse().map((e, i) => (
            <div key={i} className="grid grid-cols-6 gap-2 px-4 py-2 text-[10px] font-mono hover:bg-secondary/20 transition-colors">
              <div className="text-muted-foreground/50">{e.timestamp}</div>
              <div className="text-foreground col-span-2 truncate">{e.commandType}</div>
              <div className="text-blue-400 truncate">{e.targetUrl}</div>
              <div className={e.status === 'success' ? 'text-primary' : e.status === 'failed' ? 'text-destructive' : 'text-amber-400'}>
                {e.status}
              </div>
              <div className="text-muted-foreground/40 text-right">SAFE_READ_ONLY</div>
            </div>
          ))
        )}
      </div>
      {entries.length > 0 && (
        <div className="px-4 py-1.5 border-t border-border/40 grid grid-cols-6 gap-2 text-[9px] text-muted-foreground/30 uppercase tracking-wider">
          <div>Time</div><div className="col-span-2">Command Type</div>
          <div>Target URL</div><div>Status</div><div className="text-right">Governance</div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ──
export default function SafeCommandBridge() {
  const [targetUrl,    setTargetUrl]    = useState('https://example.com');
  const [commandType,  setCommandType]  = useState('OPEN_URL_AND_READ_TITLE');
  const [running,      setRunning]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [auditLog,     setAuditLog]     = useState([]);
  const [error,        setError]        = useState(null);

  const handleExecute = async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setResult({ commandId: '…', status: 'Running', targetUrl, commandType, startedAt: new Date().toISOString() });

    let res;
    try {
      res = await executeSafeCommand(targetUrl, commandType);
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Unknown error';
      setError(msg);
      setResult(prev => ({ ...prev, status: 'failed', error: msg, completedAt: new Date().toISOString() }));
      setAuditLog(prev => [...prev, { timestamp: nowTs(), commandType, targetUrl, status: 'failed', operator: 'VeridanCore', governanceLevel: 'SAFE_READ_ONLY' }]);
      setRunning(false);
      return;
    }

    setResult(res);
    setAuditLog(prev => [...prev, {
      timestamp: nowTs(),
      commandType: res.commandType,
      targetUrl:   res.targetUrl,
      status:      res.status,
      operator:    'VeridanCore',
      governanceLevel: 'SAFE_READ_ONLY',
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
          <h2 className="text-[13px] font-semibold tracking-wider text-foreground">SAFE BROWSER COMMAND TEST</h2>
          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">Read-only · No login · No trading · No credentials</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 border border-primary/30 bg-primary/5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary">GOVERNANCE: SAFE_READ_ONLY</span>
        </div>
      </div>

      {/* Production Config Strip */}
      <div className="grid grid-cols-3 gap-2 text-[9px]">
        {[
          ['Gateway',   'https://openclaw.veridancore.com', 'text-blue-400'],
          ['WebSocket', 'wss://openclaw.veridancore.com',   'text-blue-400/70'],
          ['CDP Port',  '18800 · Browser Automation: Operational', 'text-primary'],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`font-mono truncate ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Command Builder */}
      <div className="bg-card border border-border p-4 space-y-4">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Command Builder · openclawSafeBridge</div>

        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5 mb-1.5">
            <Globe className="w-2.5 h-2.5" /> Target URL
          </label>
          <input
            type="text"
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            className="w-full px-3 py-2 bg-secondary/50 border border-border text-[12px] text-blue-400 font-mono outline-none focus:border-primary/50 transition-colors"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 block mb-1.5">Command Type</label>
          <div className="flex gap-2">
            {COMMAND_TYPES.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setCommandType(id)}
                className={`flex items-center gap-1.5 px-3 py-2 border text-[10px] transition-colors flex-1 justify-center ${
                  commandType === id
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}>
                <Icon className="w-3 h-3" />{label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleExecute} disabled={running || !targetUrl.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {running
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...</>
            : <><Play className="w-3.5 h-3.5" /> Execute Test Command</>}
        </button>

        {error && (
          <div className="flex items-start gap-2 px-3 py-2 bg-destructive/5 border border-destructive/20">
            <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />
            <div className="text-[10px] text-destructive">{error}</div>
          </div>
        )}

        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[9px] text-amber-500/70 leading-relaxed">
            Safe read-only mode only. No login, no form submission, no trading, no credentials.
            OpenClaw externally available at{' '}
            <span className="text-amber-400 cursor-pointer underline"
              onClick={() => window.open('https://openclaw.veridancore.com', '_blank', 'noopener,noreferrer')}>
              openclaw.veridancore.com
            </span>
          </div>
        </div>
      </div>

      {result && <ResultPanel result={result} />}
      <AuditLogPanel entries={auditLog} />
    </div>
  );
}