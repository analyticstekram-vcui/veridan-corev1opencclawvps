import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Monitor, Wifi, WifiOff, Shield, AlertTriangle } from 'lucide-react';
import BrowserStatusCards from '@/components/browser-control/BrowserStatusCards';
import BrowserCommandPanel from '@/components/browser-control/BrowserCommandPanel';
import BridgeResponsePanel from '@/components/browser-control/BridgeResponsePanel';
import SessionAuditLog from '@/components/browser-control/SessionAuditLog';

const GOVERNANCE_MODE = 'SAFE_READ_ONLY';

async function callBridge(commandType, targetUrl) {
  const res = await base44.functions.invoke('openclawSafeBridge', {
    commandType,
    targetUrl,
    operator: 'VeridanCore',
    governanceLevel: GOVERNANCE_MODE,
  });
  return res.data;
}

function buildAuditEntry(commandType, targetUrl, data) {
  const screenshotBase64 = data.screenshotBase64 || data.screenshot_base64 || null;
  const screenshotUrl    = data.screenshotUrl    || data.screenshot_url    || null;
  const mimeType         = data.screenshotMimeType || 'image/png';
  const base64Src = screenshotBase64 || (
    screenshotUrl && !screenshotUrl.startsWith('http') && !screenshotUrl.startsWith('data:')
      ? screenshotUrl : null
  );
  return {
    id:                 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp:          new Date().toISOString(),
    commandType,
    targetUrl,
    status:             data.status === 'success' ? 'success' : 'failed',
    pageTitle:          data.pageTitle   || null,
    sessionActive:      data.raw?.session_active ?? null,
    screenshotCaptured: data.screenshotCaptured ?? false,
    screenshotMimeType: mimeType,
    base64Length:       base64Src?.length || 0,
    error:              data.error || null,
    diagnostics:        data.diagnostics || [],
    mode:               data.executionMode || 'UNKNOWN',
    governanceMode:     GOVERNANCE_MODE,
    raw:                data.raw || null,
    safeDiag:           data.safeDiag || null,
  };
}

export default function BrowserSession() {
  const [targetUrl,   setTargetUrl]   = useState('https://www.tradingview.com');
  const [running,     setRunning]     = useState(null);
  const [result,      setResult]      = useState(null);
  const [activityLog, setActivityLog] = useState(() => {
    try {
      const stored = localStorage.getItem('veridan_browser_session_audit_log');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const invoke = useCallback(async (commandType, url) => {
    const resolvedUrl = url || targetUrl;
    setRunning(commandType);
    setResult(null);
    const data = await callBridge(commandType, resolvedUrl);
    setResult(data);
    setActivityLog(prev => {
      const next = [...prev, buildAuditEntry(commandType, resolvedUrl, data)].slice(-100);
      try { localStorage.setItem('veridan_browser_session_audit_log', JSON.stringify(next)); } catch {}
      return next;
    });
    setRunning(null);
  }, [targetUrl]);

  const bridgeConnected = result ? result.status === 'success' : null;

  const clearAuditLog = () => {
    setActivityLog([]);
    try { localStorage.removeItem('veridan_browser_session_audit_log'); } catch {}
  };

  return (
    <div className="min-h-screen bg-background font-mono">

      {/* ── Header ── */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold tracking-wider text-foreground">OPENCLAW BROWSER CONTROL</h1>
              <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                Veridan Safe Bridge · Real Browser · Safe Read-Only Governance
              </p>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/30 bg-primary/5 text-[9px] text-primary uppercase tracking-wider font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> REAL
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/20 bg-primary/5 text-[9px] text-primary/70 uppercase tracking-wider">
              <Shield className="w-2.5 h-2.5" /> {GOVERNANCE_MODE}
            </span>
            {bridgeConnected === null ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 border border-border text-[9px] text-muted-foreground uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" /> BRIDGE_IDLE
              </span>
            ) : bridgeConnected ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/30 bg-primary/5 text-[9px] text-primary uppercase tracking-wider font-semibold">
                <Wifi className="w-2.5 h-2.5" /> BRIDGE_CONNECTED
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 border border-destructive/30 bg-destructive/5 text-[9px] text-destructive uppercase tracking-wider font-semibold">
                <WifiOff className="w-2.5 h-2.5" /> BRIDGE_ERROR
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-3xl space-y-5">

        {/* ── System Status Cards ── */}
        <div>
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">System Status</div>
          <BrowserStatusCards result={result} activityLog={activityLog} />
        </div>

        {/* ── Command Panel ── */}
        <BrowserCommandPanel
          targetUrl={targetUrl}
          onUrlChange={setTargetUrl}
          onInvoke={invoke}
          running={running}
        />

        {/* ── Bridge Response + Screenshot Preview ── */}
        {result && <BridgeResponsePanel result={result} />}

        {/* ── Session Activity / Audit Log ── */}
        <SessionAuditLog entries={activityLog} onClear={clearAuditLog} />

      </div>
    </div>
  );
}