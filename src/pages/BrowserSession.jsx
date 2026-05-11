import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Monitor, Play, Square, Globe, FileText, Type, Camera, AlertTriangle,
  Ban, CheckCircle2, Loader2, RefreshCw, Clock, ScrollText
} from 'lucide-react';

// ── Client-side URL block ─────────────────────────────────────────────────────
const CLIENT_BLOCKED = [
  /^(?!https:\/\/)/i,
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /192\.168\./,
  /^https?:\/\/10\./,
  /172\.(1[6-9]|2\d|3[01])\./,
  /file:\/\//i,
  /javascript:/i,
];

function blockReason(url) {
  if (!url) return null;
  if (!url.startsWith('https://')) return 'URL must start with https://';
  for (const re of CLIENT_BLOCKED) {
    if (re.test(url)) return 'Blocked: private or unsafe URL pattern';
  }
  return null;
}

function nowTs() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function nowIso() { return new Date().toISOString(); }

// ── Status badge ──────────────────────────────────────────────────────────────
function Badge({ label, value, color }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 border text-[10px] font-mono ${color}`}>
      <span className="text-muted-foreground/50 uppercase tracking-wider">{label}:</span>
      <span className="font-semibold uppercase tracking-wider">{value}</span>
    </div>
  );
}

// ── Result panel ──────────────────────────────────────────────────────────────
function ResultPanel({ result }) {
  if (!result) return null;
  return (
    <div className="bg-card border border-border p-4 space-y-3">
      <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Last Action Result</div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        {[
          ['Action',    result.action,    'font-mono'],
          ['Status',    result.status,    result.status === 'success' ? 'text-primary font-semibold' : 'text-destructive font-semibold'],
          ['Timestamp', result.timestamp ? new Date(result.timestamp).toLocaleTimeString() : '—', 'font-mono'],
          ['Mode',      result.mode || 'real_browser', 'font-mono'],
        ].map(([label, val, extra]) => (
          <div key={label} className="bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">{label}</div>
            <div className={`text-foreground ${extra || ''}`}>{val || '—'}</div>
          </div>
        ))}

        {result.currentUrl && (
          <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Current URL</div>
            <div className="text-blue-400 font-mono truncate">{result.currentUrl}</div>
          </div>
        )}

        {result.pageTitle && (
          <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Page Title</div>
            <div className="text-foreground">{result.pageTitle}</div>
            {result.isMockTitle && (
              <div className="mt-1.5 flex items-start gap-1.5 px-2 py-1.5 bg-amber-500/5 border border-amber-500/20">
                <span className="text-amber-500 text-[9px]">⚠</span>
                <span className="text-[10px] text-amber-400/80">
                  Bridge connected, but VPS browser automation is not yet returning real page title.
                </span>
              </div>
            )}
          </div>
        )}

        {result.pageText && (
          <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Page Text Preview</div>
            <div className="text-foreground/80 text-[11px] font-mono whitespace-pre-wrap max-h-32 overflow-auto leading-relaxed">
              {result.pageText.slice(0, 600)}{result.pageText.length > 600 ? '…' : ''}
            </div>
          </div>
        )}

        {result.screenshotUrl && (
          <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-1.5">Screenshot</div>
            {result.screenshotUrl.startsWith('data:') ? (
              <img src={result.screenshotUrl} alt="Screenshot" className="w-full rounded border border-border/50 max-h-72 object-contain" />
            ) : (
              <div className="text-blue-400 font-mono text-[11px] break-all">{result.screenshotUrl}</div>
            )}
          </div>
        )}

        {result.error && (
          <div className="col-span-2 bg-destructive/5 border border-destructive/20 px-3 py-2">
            <div className="text-muted-foreground/40 uppercase tracking-wider mb-0.5">Error</div>
            <div className="text-destructive text-[11px] font-mono break-all">{result.error}</div>
          </div>
        )}
      </div>

      {result.diagnostics?.length > 0 && (
        <div className="bg-secondary/30 border border-border px-3 py-2 space-y-0.5">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-1">Diagnostics</div>
          {result.diagnostics.map((d, i) => {
            const ok   = d.includes(': YES') || d.includes(': REAL') || d.includes('executed') || d.includes('true');
            const fail = d.includes('FAILED') || d.includes('SIMULATED') || d.includes('exception') || d.includes('MOCK');
            return (
              <div key={i} className={`text-[10px] font-mono ${fail ? 'text-amber-400' : ok ? 'text-primary' : 'text-muted-foreground/60'}`}>
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
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Session Activity Log</span>
        <span className="text-[9px] text-muted-foreground/30">({entries.length})</span>
      </div>
      {entries.length === 0 ? (
        <div className="flex items-center justify-center h-12 text-[11px] text-muted-foreground/30">
          No actions yet
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[80px_1fr_2fr_80px_1fr] gap-2 px-4 py-1.5 border-b border-border/40 text-[9px] text-muted-foreground/30 uppercase tracking-wider">
            <div>Time</div><div>Action</div><div>URL</div><div>Status</div><div>Result</div>
          </div>
          <div className="divide-y divide-border/30 max-h-56 overflow-auto">
            {[...entries].reverse().map((e, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_2fr_80px_1fr] gap-2 px-4 py-2 text-[10px] font-mono hover:bg-secondary/20 transition-colors items-start">
                <div className="text-muted-foreground/50">{e.time}</div>
                <div className="text-foreground uppercase">{e.action}</div>
                <div className="text-blue-400/70 truncate">{e.targetUrl || '—'}</div>
                <div className={e.status === 'success' ? 'text-primary' : e.status === 'blocked' ? 'text-amber-400' : 'text-destructive'}>
                  {e.status}
                </div>
                <div className="text-muted-foreground/60 truncate">{e.summary || '—'}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BrowserSession() {
  const [currentUser,  setCurrentUser]  = useState(null);
  const [session,      setSession]      = useState(null);   // persisted entity
  const [targetUrl,    setTargetUrl]    = useState('https://');
  const [running,      setRunning]      = useState(null);   // which action is running
  const [lastResult,   setLastResult]   = useState(null);
  const [activityLog,  setActivityLog]  = useState([]);
  const [urlErr,       setUrlErr]       = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const sessionActive = session?.status === 'active';

  // ── Append to local activity log ──────────────────────────────────────────
  const logActivity = useCallback((action, targetUrl, status, summary) => {
    setActivityLog(prev => [...prev, { time: nowTs(), action, targetUrl, status, summary }]);
  }, []);

  // ── Invoke the safe bridge backend ───────────────────────────────────────
  const callBridge = useCallback(async (commandType, url) => {
    const response = await base44.functions.invoke('openclawSafeBridge', {
      commandType,
      targetUrl: url,
      operator: currentUser?.email || 'VeridanCore',
      governanceLevel: 'SAFE_READ_ONLY',
    });
    return response.data;
  }, [currentUser]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleStartSession = async () => {
    const err = blockReason(targetUrl);
    if (err) { setUrlErr(err); return; }
    setUrlErr(null);
    setRunning('start');

    const sessionId = 'sess_' + Date.now();
    const now = nowIso();
    const auditEntry = { timestamp: now, event: 'SESSION_STARTED', actor: currentUser?.email || 'unknown', targetUrl };

    const created = await base44.entities.BrowserSession.create({
      sessionId,
      status: 'active',
      mode: 'real_browser',
      governance: 'safe_read_only',
      currentUrl: targetUrl,
      lastAction: 'start',
      auditTrail: [auditEntry],
      createdBy: currentUser?.email || 'unknown',
      createdAt: now,
      diagnostics: [],
    });

    setSession(created);
    setLastResult({ action: 'start', status: 'success', currentUrl: targetUrl, timestamp: now });
    logActivity('start', targetUrl, 'success', 'Session started');
    setRunning(null);
  };

  const handleAction = async (action) => {
    if (!sessionActive) return;
    const url = targetUrl;
    const err = blockReason(url);
    if (err) { setUrlErr(err); return; }
    setUrlErr(null);
    setRunning(action);

    const commandType =
      action === 'navigate'        ? 'OPEN_URL_AND_READ_TITLE' :
      action === 'read_title'      ? 'OPEN_URL_AND_READ_TITLE' :
      action === 'read_page_text'  ? 'OPEN_URL_AND_READ_TITLE' : // bridge returns title; text when bridge supports it
      action === 'screenshot'      ? 'OPEN_URL_AND_SCREENSHOT'  :
      'OPEN_URL_AND_READ_TITLE';

    let res;
    let status = 'success';
    let summary = '';

    try {
      res = await callBridge(commandType, url);
      status = res.status === 'success' ? 'success' : 'failed';
    } catch (err) {
      status = 'failed';
      res = { error: err.message, diagnostics: [] };
    }

    const pageTitle    = res.pageTitle   || null;
    const screenshotUrl = res.screenshotUrl || null;
    const isMockTitle  = res.isMockTitle  || false;
    const diagnostics  = Array.isArray(res.diagnostics) ? res.diagnostics : [];
    const now          = nowIso();

    summary = pageTitle ? `Title: ${pageTitle.slice(0, 40)}` : (res.error || status);

    const result = {
      action,
      status,
      currentUrl: url,
      pageTitle,
      isMockTitle,
      screenshotUrl,
      diagnostics,
      timestamp: now,
      mode: res.executionMode || 'real_browser',
      error: res.error || null,
    };

    setLastResult(result);
    logActivity(action, url, status, summary);

    // Persist to session entity
    const auditEntry = { timestamp: now, event: `ACTION_${action.toUpperCase()}`, actor: currentUser?.email, targetUrl: url, status };
    const newAudit = [...(session.auditTrail || []), auditEntry];
    const updated = await base44.entities.BrowserSession.update(session.id, {
      currentUrl: url,
      pageTitle:  pageTitle || session.pageTitle,
      lastAction: action,
      diagnostics,
      auditTrail: newAudit,
    });
    setSession(updated);
    setRunning(null);
  };

  const handleEndSession = async () => {
    if (!session) return;
    setRunning('end');
    const now = nowIso();
    const auditEntry = { timestamp: now, event: 'SESSION_ENDED', actor: currentUser?.email };
    const newAudit = [...(session.auditTrail || []), auditEntry];
    const updated = await base44.entities.BrowserSession.update(session.id, {
      status: 'ended',
      endedAt: now,
      lastAction: 'end',
      auditTrail: newAudit,
    });
    setSession(updated);
    setLastResult({ action: 'end', status: 'success', timestamp: now });
    logActivity('end', session.currentUrl, 'success', 'Session ended');
    setRunning(null);
  };

  const isBlocked = !!blockReason(targetUrl);
  const isRunning = !!running;

  // ── Button config ─────────────────────────────────────────────────────────
  const actions = [
    { id: 'navigate',       label: 'Navigate',        icon: Globe,     needsSession: true },
    { id: 'read_title',     label: 'Read Title',       icon: Type,      needsSession: true },
    { id: 'read_page_text', label: 'Read Page Text',   icon: FileText,  needsSession: true },
    { id: 'screenshot',     label: 'Take Screenshot',  icon: Camera,    needsSession: true },
  ];

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
              Governed read-only browser · Safe Bridge · Veridan Core
            </p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            label="Session"
            value={session?.status || 'inactive'}
            color={sessionActive ? 'border-primary/30 text-primary bg-primary/5' : 'border-border text-muted-foreground'}
          />
          <Badge label="Mode"       value="real_browser"    color="border-border text-muted-foreground" />
          <Badge label="Governance" value="safe_read_only"  color="border-amber-500/30 text-amber-400 bg-amber-500/5" />
          {session?.sessionId && (
            <Badge label="ID" value={session.sessionId.slice(0, 14) + '…'} color="border-border text-muted-foreground/50" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 max-w-3xl space-y-5">

        {/* URL Input + Session Controls */}
        <div className="bg-card border border-border p-4 space-y-4">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Target URL · HTTPS required</div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Globe className="w-2.5 h-2.5 text-muted-foreground/50" />
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/50">URL</span>
            </div>
            <input
              type="text"
              value={targetUrl}
              onChange={e => { setTargetUrl(e.target.value); setUrlErr(null); }}
              className={`w-full px-3 py-2 bg-secondary/50 border text-[12px] text-blue-400 font-mono outline-none transition-colors ${
                isBlocked || urlErr ? 'border-amber-500/50 focus:border-amber-500' : 'border-border focus:border-primary/50'
              }`}
              placeholder="https://example.com"
            />
            {(isBlocked || urlErr) && (
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-amber-500">
                <Ban className="w-3 h-3" /> {urlErr || blockReason(targetUrl)}
              </div>
            )}
          </div>

          {/* Primary session buttons */}
          <div className="flex gap-2 flex-wrap">
            {!sessionActive ? (
              <button
                onClick={handleStartSession}
                disabled={isRunning || isBlocked || !targetUrl.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {running === 'start' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Start Session
              </button>
            ) : (
              <button
                onClick={handleEndSession}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-2 border border-destructive/30 text-destructive text-[11px] hover:bg-destructive/10 transition-colors disabled:opacity-40"
              >
                {running === 'end' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                End Session
              </button>
            )}
          </div>

          {/* Action buttons — only when session active */}
          {sessionActive && (
            <div className="flex gap-2 flex-wrap pt-1 border-t border-border/50">
              {actions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleAction(id)}
                  disabled={isRunning || isBlocked || !targetUrl.trim()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border text-[10px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    running === id
                      ? 'border-primary/50 text-primary bg-primary/10'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                  }`}
                >
                  {running === id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Governance notice */}
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-500/70 leading-relaxed">
              Safe read-only mode. No login, no form submission, no trading, no credentials, no POST actions.
              CF-Access tokens sent server-side only — never exposed to browser.
            </p>
          </div>
        </div>

        {/* Result Panel */}
        <ResultPanel result={lastResult} />

        {/* Activity Log */}
        <ActivityLog entries={activityLog} />
      </div>
    </div>
  );
}