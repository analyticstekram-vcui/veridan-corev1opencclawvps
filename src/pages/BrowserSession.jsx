import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Monitor, Wifi, WifiOff, Shield, AlertTriangle, Database } from 'lucide-react';
import BrowserStatusCards from '@/components/browser-control/BrowserStatusCards';
import BrowserCommandPanel from '@/components/browser-control/BrowserCommandPanel';
import BridgeResponsePanel from '@/components/browser-control/BridgeResponsePanel';
import SessionAuditLog from '@/components/browser-control/SessionAuditLog';
import ProposedActionsAuditPanel from '@/components/browser-control/ProposedActionsAuditPanel';
import ExecutionQueuePanel from '@/components/browser-control/ExecutionQueuePanel';
import SafeReadValidationPanel from '@/components/browser-control/SafeReadValidationPanel';

const GOVERNANCE_MODE = 'SAFE_READ_ONLY';
const INSPECT_TIMEOUT_MS = 20000;

// ── Normalize INSPECT_ELEMENTS response — never store full raw payload ────────
function normalizeInspectionResponse(data) {
  const raw = data.raw || {};
  const inspection = raw.inspection || data.inspection || {};
  const allElements = inspection.elements || raw.elements || [];

  return {
    status:          data.status,
    commandType:     data.commandType || 'INSPECT_ELEMENTS',
    executionMode:   data.executionMode || 'REAL',
    error:           data.error || null,
    diagnostics:     data.diagnostics || [],
    safeDiag:        data.safeDiag || null,
    pageTitle:       inspection.pageTitle || data.pageTitle || raw.title || null,
    finalUrl:        inspection.currentUrl || raw.url || data.targetUrl || null,
    totalElements:   inspection.totalElements   ?? allElements.length,
    visibleElements: inspection.visibleElements ?? allElements.filter(e => e.visible).length,
    enabledElements: inspection.enabledElements ?? allElements.filter(e => e.enabled !== false).length,
    links:           inspection.visibleLinks    ?? allElements.filter(e => e.type === 'a').length,
    buttons:         inspection.visibleButtons  ?? allElements.filter(e => e.type === 'button').length,
    inputs:          inspection.visibleInputs   ?? allElements.filter(e => e.type === 'input').length,
    forms:           inspection.detectedForms   ?? allElements.filter(e => e.type === 'form').length,
    timestamp:       data.completedAt || new Date().toISOString(),
    // Cap elements for rendering — no full payload in state
    elements:        allElements.slice(0, 50),
    // Truncated raw preview only — max 10k chars
    rawPreview:      JSON.stringify(raw, null, 2).slice(0, 10000),
    // Flag so BridgeResponsePanel / ElementInspectionPanel know this is normalized
    _normalized:     true,
  };
}

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
  const isInspect = commandType === 'INSPECT_ELEMENTS';

  const screenshotBase64 = data.screenshotBase64 || data.screenshot_base64 || null;
  const screenshotUrl    = data.screenshotUrl    || data.screenshot_url    || null;
  const mimeType         = data.screenshotMimeType || 'image/png';
  const base64Src = screenshotBase64 || (
    screenshotUrl && !screenshotUrl.startsWith('http') && !screenshotUrl.startsWith('data:')
      ? screenshotUrl : null
  );

  // For INSPECT_ELEMENTS: strip full raw, store only first 20 elements summary
  const safeRaw = isInspect ? (() => {
    const r = data.raw || {};
    const insp = r.inspection || {};
    const els  = (insp.elements || r.elements || []).slice(0, 20);
    return { ...r, inspection: { ...insp, elements: els }, elements: undefined };
  })() : (data.raw || null);

  return {
    id:                 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    timestamp:          new Date().toISOString(),
    commandType,
    targetUrl,
    status:             data.status === 'success' ? 'success' : 'failed',
    pageTitle:          data.pageTitle || data._normalized && data.pageTitle || null,
    sessionActive:      data.raw?.session_active ?? null,
    screenshotCaptured: data.screenshotCaptured ?? false,
    screenshotMimeType: mimeType,
    base64Length:       base64Src?.length || 0,
    error:              data.error || null,
    diagnostics:        data.diagnostics || [],
    mode:               data.executionMode || 'UNKNOWN',
    governanceMode:     GOVERNANCE_MODE,
    raw:                safeRaw,
    safeDiag:           data.safeDiag || null,
  };
}

// Normalize commandType to enum-safe lastAction value
function normalizeCommandType(commandType) {
  if (!commandType) return null;
  // Convert uppercase to lowercase with underscores
  const normalized = commandType.toLowerCase().replace(/([A-Z])/g, '_$1').replace(/^_/, '');
  // Map known command types to enum values
  const mapping = {
    'open_url_and_read_title': 'read_title',
    'open_url_and_screenshot': 'screenshot',
    'inspect_elements': 'inspect_elements',
    'read_element_text': 'read_element_text',
    'click_element': 'click_element',
    'type_into_element': 'type_into_element',
    'propose_action': 'propose_action',
    'approve_proposal': 'approve_proposal',
    'queue_execution': 'queue_execution',
    'execute_command': 'execute_command',
  };
  return mapping[normalized] || normalized;
}

// Safe audit entry for database storage — minimal metadata only
function buildDatabaseAuditEntry(commandType, targetUrl, data) {
  const diagnosticsArray = Array.isArray(data.diagnostics) ? data.diagnostics : [];
  const diagnosticsSummary = diagnosticsArray.slice(0, 5); // First 5 diagnostics only

  return {
    timestamp:          new Date().toISOString(),
    commandType,
    targetUrl,
    status:             data.status === 'success' ? 'success' : 'failed',
    pageTitle:          data.pageTitle || (data._normalized && data.pageTitle) || null,
    screenshotCaptured: data.screenshotCaptured ?? false,
    base64Length:       0, // Never store actual screenshot
    error:              data.error || null,
    diagnosticsSummary,
  };
}

async function persistSessionToEntity(sessionId, targetUrl, result, activityLog) {
  try {
    const user = await base44.auth.me();
    if (!user) return;

    const lastEntry = activityLog[activityLog.length - 1] || {};
    
    // Build safe audit trail — metadata only, no secrets/screenshots/raw JSON
    const databaseEntries = activityLog.slice(-50).map(entry => ({
      timestamp: entry.timestamp,
      commandType: entry.commandType,
      targetUrl: entry.targetUrl,
      status: entry.status,
      pageTitle: entry.pageTitle,
      screenshotCaptured: entry.screenshotCaptured,
      diagnosticsSummary: Array.isArray(entry.diagnostics) ? entry.diagnostics.slice(0, 5) : [],
    }));

    // Create or update BrowserSession entity
    const existingSessions = await base44.entities.BrowserSession.filter({
      sessionId,
    });

    // Normalize lastAction to enum-safe value
    const normalizedLastAction = normalizeCommandType(lastEntry.commandType);

    const sessionData = {
      sessionId,
      status: result?.status === 'success' ? 'active' : 'error',
      mode: 'real_browser',
      governance: GOVERNANCE_MODE,
      currentUrl: result?.targetUrl || targetUrl,
      pageTitle: result?.pageTitle || null,
      lastAction: normalizedLastAction,
      auditTrail: databaseEntries,
      createdBy: user.email,
    };

    if (existingSessions && existingSessions.length > 0) {
      // Update existing session
      await base44.entities.BrowserSession.update(existingSessions[0].id, sessionData);
    } else {
      // Create new session
      sessionData.createdAt = new Date().toISOString();
      await base44.entities.BrowserSession.create(sessionData);
    }
  } catch (err) {
    console.warn('Failed to persist session to entity:', err.message);
    // Silently fail — localStorage is fallback
  }
}

export default function BrowserSession() {
  const [targetUrl,   setTargetUrl]   = useState('https://www.tradingview.com');
  const [running,     setRunning]     = useState(null);
  const [result,      setResult]      = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [sessionId]   = useState('session_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  const [persistEnabled] = useState(true);
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
    try {
      let data;
      if (commandType === 'INSPECT_ELEMENTS') {
        // 20-second frontend timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('INSPECT_TIMEOUT')), INSPECT_TIMEOUT_MS)
        );
        try {
          const raw = await Promise.race([callBridge(commandType, resolvedUrl), timeoutPromise]);
          data = normalizeInspectionResponse(raw);
        } catch (err) {
          if (err.message === 'INSPECT_TIMEOUT') {
            data = {
              status: 'failed',
              commandType: 'INSPECT_ELEMENTS',
              executionMode: 'FAILED',
              error: 'Inspection timed out. Backend may still be working, but frontend stopped waiting.',
              diagnostics: ['frontend_timeout: 20s exceeded'],
              _normalized: true,
              elements: [],
              rawPreview: '',
            };
          } else {
            throw err;
          }
        }
      } else {
        data = await callBridge(commandType, resolvedUrl);
      }

      setResult(data);
      setActivityLog(prev => {
        const entry = buildAuditEntry(commandType, resolvedUrl, data);
        const next = [...prev, entry].slice(-100);
        // Never persist full INSPECT_ELEMENTS raw to localStorage (already capped in buildAuditEntry)
        try { localStorage.setItem('veridan_browser_session_audit_log', JSON.stringify(next)); } catch {}
        
        // Persist to entity if enabled (non-blocking)
        if (persistEnabled) {
          persistSessionToEntity(sessionId, resolvedUrl, data, next);
        }
        
        return next;
      });
    } finally {
      setRunning(null);
    }
  }, [targetUrl, sessionId, persistEnabled]);

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

        {/* ── Navigation ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/browser-session-records"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-primary/30 bg-primary/5 text-[9px] text-primary uppercase tracking-wider font-semibold hover:bg-primary/10 transition-colors"
          >
            <Database className="w-3 h-3" /> View Session Records
          </Link>
        </div>

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
        {result && <BridgeResponsePanel result={result} selectedElement={selectedElement} onSelectElement={setSelectedElement} />}

        {/* ── Session Activity / Audit Log ── */}
        <SessionAuditLog entries={activityLog} onClear={clearAuditLog} />

        {/* ── Safe Read Validation Panel ── */}
        <SafeReadValidationPanel inspectionResult={result} selectedElement={selectedElement} />

        {/* ── Proposed Actions Audit Panel ── */}
        <ProposedActionsAuditPanel />

        {/* ── Execution Queue Panel ── */}
        <ExecutionQueuePanel />

      </div>
    </div>
  );
}