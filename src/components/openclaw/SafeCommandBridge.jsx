import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Shield, Play, Loader2, CheckCircle2, XCircle, Clock,
  Globe, FileText, Camera, AlertTriangle, ScrollText
} from 'lucide-react';

const COMMAND_TYPES = [
  { id: 'OPEN_URL_AND_READ_TITLE', label: 'OPEN_URL_AND_READ_TITLE', icon: FileText },
  { id: 'OPEN_URL_AND_SCREENSHOT',  label: 'OPEN_URL_AND_SCREENSHOT',  icon: Camera },
];

const STATUS_CONFIG = {
  Pending: { color: 'text-amber-400',    dot: 'bg-amber-400',    icon: Clock },
  Running: { color: 'text-blue-400',     dot: 'bg-blue-400',     icon: Loader2, spin: true },
  Success: { color: 'text-primary',      dot: 'bg-primary',      icon: CheckCircle2 },
  Failed:  { color: 'text-destructive',  dot: 'bg-destructive',  icon: XCircle },
};

function nowIso() { return new Date().toISOString(); }
function nowTs()  { return new Date().toLocaleTimeString('en-US', { hour12: false }); }
function shortId() { return 'CMD-' + Math.random().toString(36).slice(2, 8).toUpperCase(); }

// Mocked executor — structured to later swap in a real openclawSafeBridge backend call
async function executeSafeCommand(targetUrl, commandType) {
  // Future wiring point:
  // const res = await base44.functions.invoke('openclawSafeBridge', { targetUrl, commandType });
  // return res.data;

  // Simulate network latency
  await new Promise(r => setTimeout(r, 1800));

  const id = shortId();
  const startedAt = nowIso();

  if (commandType === 'OPEN_URL_AND_READ_TITLE') {
    // Attempt to derive a plausible title from the URL
    let title = null;
    try {
      const domain = new URL(targetUrl).hostname.replace('www.', '');
      title = domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1) + ' · ' + domain;
    } catch (_) {
      title = '(could not parse URL)';
    }
    return {
      commandId: id,
      status: 'Success',
      targetUrl,
      commandType,
      pageTitle: title + ' [MOCK — live read requires OpenClaw agent]',
      screenshotStatus: 'N/A',
      startedAt,
      completedAt: nowIso(),
      error: null,
      mock: true,
    };
  }

  if (commandType === 'OPEN_URL_AND_SCREENSHOT') {
    return {
      commandId: id,
      status: 'Success',
      targetUrl,
      commandType,
      pageTitle: null,
      screenshotStatus: 'Captured [MOCK — stored at /tmp/screenshot.png on OpenClaw agent]',
      startedAt,
      completedAt: nowIso(),
      error: null,
      mock: true,
    };
  }

  return { commandId: id, status: 'Failed', targetUrl, commandType, error: 'Unknown command type', startedAt, completedAt: nowIso(), mock: true };
}

function ResultPanel({ result }) {
  const cfg = STATUS_CONFIG[result.status] || STATUS_CONFIG.Pending;
  const Icon = cfg.icon;

  return (
    <div className="bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Command Result</span>
        {result.mock && (
          <span className="text-[9px] px-2 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-500/5 uppercase tracking-wider">MOCK</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        <Icon className={`w-3.5 h-3.5 ${cfg.color} ${cfg.spin ? 'animate-spin' : ''}`} />
        <span className={`text-[13px] font-semibold ${cfg.color}`}>{result.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Command ID</div>
          <div className="text-foreground font-mono">{result.commandId}</div>
        </div>
        <div className="bg-secondary/30 border border-border px-3 py-2">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Command Type</div>
          <div className="text-foreground font-mono">{result.commandType}</div>
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
        {result.screenshotStatus && result.screenshotStatus !== 'N/A' && (
          <div className="bg-secondary/30 border border-border px-3 py-2 col-span-2">
            <div className="text-muted-foreground/50 uppercase tracking-wider mb-0.5">Screenshot Status</div>
            <div className="text-foreground">{result.screenshotStatus}</div>
          </div>
        )}
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
              <div className={
                e.status === 'Success' ? 'text-primary' :
                e.status === 'Failed'  ? 'text-destructive' :
                'text-amber-400'
              }>{e.status}</div>
              <div className="text-muted-foreground/40 text-right">SAFE_READ_ONLY</div>
            </div>
          ))
        )}
      </div>
      {entries.length > 0 && (
        <div className="px-4 py-1.5 border-t border-border/40 grid grid-cols-6 gap-2 text-[9px] text-muted-foreground/30 uppercase tracking-wider">
          <div>Time</div>
          <div className="col-span-2">Command Type</div>
          <div>Target URL</div>
          <div>Status</div>
          <div className="text-right">Governance</div>
        </div>
      )}
    </div>
  );
}

export default function SafeCommandBridge() {
  const [targetUrl, setTargetUrl]   = useState('https://example.com');
  const [commandType, setCommandType] = useState('OPEN_URL_AND_READ_TITLE');
  const [running, setRunning]       = useState(false);
  const [result, setResult]         = useState(null);
  const [auditLog, setAuditLog]     = useState([]);

  const handleExecute = async () => {
    if (running) return;
    setRunning(true);
    setResult({ commandId: '...', status: 'Running', targetUrl, commandType, startedAt: nowIso() });

    const res = await executeSafeCommand(targetUrl, commandType);
    setResult(res);
    setAuditLog(prev => [...prev, {
      timestamp: nowTs(),
      commandType: res.commandType,
      targetUrl: res.targetUrl,
      status: res.status,
      operator: 'OpenClaw',
      governanceLevel: 'SAFE_READ_ONLY',
    }]);
    setRunning(false);
  };

  return (
    <div className="p-6 max-w-3xl space-y-5 font-mono">
      {/* Section Header */}
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
          ['Gateway', 'https://openclaw.veridancore.com', 'text-blue-400'],
          ['WebSocket', 'wss://openclaw.veridancore.com', 'text-blue-400/70'],
          ['CDP Port', '18800 · Browser Automation: Operational', 'text-primary'],
        ].map(([label, val, cls]) => (
          <div key={label} className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`font-mono truncate ${cls}`}>{val}</div>
          </div>
        ))}
      </div>

      {/* Command Builder */}
      <div className="bg-card border border-border p-4 space-y-4">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Command Builder</div>

        {/* Target URL */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 block mb-1.5 flex items-center gap-1.5">
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

        {/* Command Type */}
        <div>
          <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 block mb-1.5">Command Type</label>
          <div className="flex gap-2">
            {COMMAND_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setCommandType(id)}
                className={`flex items-center gap-1.5 px-3 py-2 border text-[10px] transition-colors flex-1 justify-center ${
                  commandType === id
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={running || !targetUrl.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-[12px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...</>
            : <><Play className="w-3.5 h-3.5" /> Execute Test Command</>
          }
        </button>

        {/* Safety Rules */}
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[9px] text-amber-500/70 leading-relaxed">
            Safe read-only mode only. No login, no form submission, no trading actions, no credential handling. 
            OpenClaw externally available at <span className="text-amber-400 cursor-pointer underline" onClick={() => window.open('https://openclaw.veridancore.com', '_blank', 'noopener,noreferrer')}>openclaw.veridancore.com</span>
          </div>
        </div>
      </div>

      {/* Result Panel */}
      {result && <ResultPanel result={result} />}

      {/* Audit Log */}
      <AuditLogPanel entries={auditLog} />
    </div>
  );
}