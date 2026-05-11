import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Monitor, Play, Globe, Camera, AlertTriangle,
  Ban, CheckCircle2, XCircle, Loader2, ScrollText, RefreshCw
} from 'lucide-react';

const TRADIGVIEW_URL = 'https://www.tradingview.com';

function blockReason(url) {
  if (!url) return null;
  if (!url.startsWith('https://')) return 'URL must start with https://';
  const blocked = [/localhost/i, /127\.0\.0\.1/, /0\.0\.0\.0/, /192\.168\./, /^https?:\/\/10\./, /172\.(1[6-9]|2\d|3[01])\./, /file:\/\//i, /javascript:/i];
  for (const re of blocked) if (re.test(url)) return 'Blocked: private or unsafe URL pattern';
  return null;
}

function nowTs() { return new Date().toLocaleTimeString('en-US', { hour12: false }); }

// ── Shared bridge call ────────────────────────────────────────────────────────
async function callBridge(commandType, targetUrl) {
  const res = await base44.functions.invoke('openclawSafeBridge', {
    commandType,
    targetUrl,
    operator: 'VeridanCore',
    governanceLevel: 'SAFE_READ_ONLY',
  });
  return res.data;
}

// ── Result Panel ──────────────────────────────────────────────────────────────
function ResultPanel({ result }) {
  if (!result) return null;
  const isSuccess = result.status === 'success';

  // Resolve screenshot sources in priority order
  const screenshotBase64 = result.screenshotBase64 || result.screenshot_base64 || null;
  const screenshotUrl = result.screenshotUrl || result.screenshot_url || null;
  const mimeType = result.screenshotMimeType || 'image/png';

  let resolvedScreenshotSrc = null;
  let resolvedSourceType = 'none';

  // Priority 1: direct base64 field
  if (screenshotBase64) {
    resolvedScreenshotSrc = `data:${mimeType};base64,${screenshotBase64}`;
    resolvedSourceType = 'base64';
  }
  // Priority 2: screenshotUrl that is actually raw base64 (starts with PNG magic or is not a URL)
  else if (screenshotUrl && !screenshotUrl.startsWith('http') && !screenshotUrl.startsWith('data:')) {
    // Check if it looks like base64 PNG magic bytes (iVBOR...) or other base64
    if (screenshotUrl.startsWith('iVBOR') || /^[A-Za-z0-9+/=]+$/.test(screenshotUrl)) {
      resolvedScreenshotSrc = `data:${mimeType};base64,${screenshotUrl}`;
      resolvedSourceType = 'base64';
    }
  }
  // Priority 3: data URL
  else if (screenshotUrl?.startsWith('data:image')) {
    resolvedScreenshotSrc = screenshotUrl;
    resolvedSourceType = 'data-url';
  }
  // Priority 4: HTTP URL
  else if (screenshotUrl?.startsWith('http')) {
    resolvedScreenshotSrc = screenshotUrl;
    resolvedSourceType = 'http-url';
  }

  const base64Length = screenshotBase64?.length || screenshotUrl?.length || 0;
  const screenshotCaptured = result.screenshotCaptured;

  return (
    <div className="bg-card border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Bridge Response</span>
        <span className={`text-[9px] px-2 py-0.5 border uppercase tracking-wider ${
          isSuccess ? 'border-primary/30 text-primary bg-primary/5' : 'border-destructive/30 text-destructive bg-destructive/5'
        }`}>{result.executionMode || (isSuccess ? 'REAL' : 'FAILED')}</span>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {isSuccess
          ? <CheckCircle2 className="w-4 h-4 text-primary" />
          : <XCircle className="w-4 h-4 text-destructive" />}
        <span className={`text-[13px] font-semibold uppercase ${isSuccess ? 'text-primary' : 'text-destructive'}`}>
          {result.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {result.commandType && (
          <div className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Command</div>
            <div className="text-foreground font-mono truncate">{result.commandType}</div>
          </div>
        )}
        {result.raw?.session_active !== undefined && (
          <div className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Session Active</div>
            <div className={result.raw.session_active ? 'text-primary font-semibold' : 'text-muted-foreground'}>
              {String(result.raw.session_active)}
            </div>
          </div>
        )}
        {result.raw?.online !== undefined && (
          <div className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Online</div>
            <div className={result.raw.online ? 'text-primary font-semibold' : 'text-destructive font-semibold'}>
              {String(result.raw.online)}
            </div>
          </div>
        )}
        {(result.targetUrl || result.raw?.current_url) && (
          <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">URL</div>
            <div className="text-blue-400 font-mono truncate">{result.raw?.current_url || result.targetUrl}</div>
          </div>
        )}
        {result.pageTitle && (
          <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Page Title</div>
            <div className="text-foreground">{result.pageTitle}</div>
          </div>
        )}
        {result.error && (
          <div className="col-span-2 bg-destructive/5 border border-destructive/20 px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Error</div>
            <div className="text-destructive text-[11px] font-mono break-all">{result.error}</div>
          </div>
        )}
      </div>

      {/* Screenshot debug + preview — shown for screenshot command type */}
      {result.commandType === 'OPEN_URL_AND_SCREENSHOT' && (
        <div className="space-y-2">
          {/* Debug block */}
          <div className="bg-secondary/20 border border-amber-500/20 px-3 py-2.5 space-y-1">
            <div className="text-[9px] uppercase tracking-widest text-amber-500/70 mb-1.5">Screenshot Debug Info</div>
            {[
              ['screenshotCaptured',  String(screenshotCaptured ?? false)],
              ['image source type',   resolvedSourceType],
              ['base64 length',       String(base64Length)],
              ['MIME type',           mimeType],
            ].map(([label, val]) => (
              <div key={label} className="font-mono text-[10px] text-muted-foreground/70">
                <span className="text-muted-foreground/40">{label}: </span>
                <span className="text-foreground">{val}</span>
              </div>
            ))}
          </div>

          {/* Screenshot preview */}
          {resolvedScreenshotSrc ? (
            <div className="bg-secondary/30 border border-border px-3 py-2 space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="w-3 h-3 text-primary" />
                <div className="text-[9px] uppercase tracking-widest text-primary font-semibold">Browser Screenshot Preview</div>
              </div>
              <img
                src={resolvedScreenshotSrc}
                alt="OpenClaw browser screenshot"
                className="w-full rounded border border-border/50 max-h-[500px] object-contain"
              />
            </div>
          ) : screenshotCaptured ? (
            <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 text-[11px] text-amber-400 font-mono">
              Screenshot was captured but no image data was returned by the bridge.
            </div>
          ) : null}
        </div>
      )}

      {/* Raw JSON */}
      {result.raw && (
        <details className="text-[10px]">
          <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground uppercase tracking-widest text-[9px]">
            Raw JSON Response
          </summary>
          <pre className="mt-2 bg-secondary/30 border border-border px-3 py-2 overflow-auto max-h-48 text-muted-foreground/70 leading-relaxed">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </details>
      )}

      {/* Diagnostics */}
      {result.diagnostics?.length > 0 && (
        <div className="bg-secondary/30 border border-border px-3 py-2 space-y-0.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1">Diagnostics</div>
          {result.diagnostics.map((d, i) => {
            const ok   = d.includes(': YES') || d.includes(': REAL') || d.includes('OK') || d.includes('true');
            const fail = d.includes('FAILED') || d.includes('MISSING') || d.includes('MOCK') || d.includes('exception');
            return (
              <div key={i} className={`font-mono text-[10px] ${fail ? 'text-amber-400' : ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
                › {d}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Activity Log ──────────────────────────────────────────────────────────────
function ActivityLog({ entries }) {
  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <ScrollText className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Session Activity</span>
        <span className="text-[9px] text-muted-foreground/30">({entries.length})</span>
      </div>
      {entries.length === 0 ? (
        <div className="flex items-center justify-center h-12 text-[11px] text-muted-foreground/30">No actions yet</div>
      ) : (
        <div className="divide-y divide-border/30 max-h-52 overflow-auto">
          {[...entries].reverse().map((e, i) => (
            <div key={i} className="grid grid-cols-[70px_1fr_2fr_70px] gap-2 px-4 py-2 text-[10px] font-mono hover:bg-secondary/20 items-start">
              <div className="text-muted-foreground/40">{e.time}</div>
              <div className="text-foreground uppercase truncate">{e.action}</div>
              <div className="text-blue-400/60 truncate">{e.url || '—'}</div>
              <div className={e.status === 'success' ? 'text-primary' : 'text-destructive'}>{e.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BrowserSession() {
  const [targetUrl,   setTargetUrl]   = useState('https://www.tradingview.com');
  const [running,     setRunning]     = useState(null);
  const [result,      setResult]      = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const urlErr = blockReason(targetUrl);

  const log = (action, url, status) =>
    setActivityLog(prev => [...prev, { time: nowTs(), action, url, status }]);

  const invoke = useCallback(async (commandType, url) => {
    setRunning(commandType);
    setResult(null);
    const data = await callBridge(commandType, url || targetUrl);
    setResult(data);
    log(commandType, url || targetUrl, data.status);
    setRunning(null);
  }, [targetUrl]);

  const isRunning = !!running;

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Monitor className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-foreground">OPENCLAW BROWSER SESSION</h1>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Veridan Safe Bridge · via openclawSafeBridge · Read-only governance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/30 bg-primary/5">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-primary">GOVERNANCE: SAFE_READ_ONLY</span>
        </div>
      </div>

      <div className="p-6 max-w-3xl space-y-5">

        {/* Control Panel */}
        <div className="bg-card border border-border p-4 space-y-4">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">
            Browser Session Control · All calls via openclawSafeBridge backend
          </div>

          {/* URL input */}
          <div>
            <label className="text-[9px] uppercase tracking-wider text-muted-foreground/50 flex items-center gap-1.5 mb-1.5">
              <Globe className="w-2.5 h-2.5" /> Target URL
            </label>
            <input
              type="text"
              value={targetUrl}
              onChange={e => setTargetUrl(e.target.value)}
              className={`w-full px-3 py-2 bg-secondary/50 border text-[12px] text-blue-400 font-mono outline-none transition-colors ${
                urlErr ? 'border-amber-500/50' : 'border-border focus:border-primary/50'
              }`}
              placeholder="https://example.com"
            />
            {urlErr && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-500">
                <Ban className="w-3 h-3" /> {urlErr}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'SESSION_STATUS',           label: 'Check Session',             icon: RefreshCw,  url: TRADIGVIEW_URL },
              { id: 'START_SESSION',            label: 'Start TradingView Session', icon: Play,        url: TRADIGVIEW_URL },
              { id: 'OPEN_URL_AND_READ_TITLE',  label: 'Navigate & Read Title',     icon: Globe,       url: null },
              { id: 'OPEN_URL_AND_SCREENSHOT',  label: 'Capture Screenshot',        icon: Camera,      url: null },
            ].map(({ id, label, icon: Icon, url: fixedUrl }) => (
              <button
                key={id}
                onClick={() => invoke(id, fixedUrl || targetUrl)}
                disabled={isRunning || (!!urlErr && !fixedUrl)}
                className={`flex items-center justify-center gap-2 px-4 py-3 border text-[11px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  running === id
                    ? 'border-primary bg-primary/10 text-primary'
                    : id === 'START_SESSION'
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {running === id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />}
                {label}
              </button>
            ))}
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-500/70 leading-relaxed">
              All commands route through <span className="text-amber-500">openclawSafeBridge</span> backend only.
              VERIDAN_BRIDGE_TOKEN is never exposed to the browser. Safe read-only mode enforced server-side.
            </p>
          </div>
        </div>

        {/* Result Panel */}
        <ResultPanel result={result} />

        {/* Activity Log */}
        <ActivityLog entries={activityLog} />
      </div>
    </div>
  );
}