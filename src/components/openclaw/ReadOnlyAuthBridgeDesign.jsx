/**
 * ReadOnlyAuthBridgeDesign
 * Design-only panel for the authenticated read-only OpenClaw status bridge.
 *
 * SAFETY CONTRACT:
 *   - No network calls
 *   - No OpenClaw command dispatch
 *   - No browser tools / credentials / trading / money movement
 *   - Reads and writes localStorage only
 *   - PREVIEW_ONLY / READ_ONLY / LOCKED
 */
import React, { useState, useCallback } from 'react';
import { CheckCircle2, Copy, ShieldCheck, Ban, ArrowRight, Server, Globe, Cpu, Monitor } from 'lucide-react';

const DESIGN_KEY = 'openclawReadOnlyAuthenticatedBridgeDesigns';

const ALLOWED_ENDPOINTS = ['/health', '/status', '/version', '/capabilities'];

const AUTH_CHECKLIST = [
  { label: 'Cloudflare Access required',             pass: true },
  { label: 'Gateway token required',                 pass: true },
  { label: 'No secrets displayed in frontend',       pass: true },
  { label: 'No credentials stored in frontend',      pass: true },
  { label: 'No command payloads allowed',            pass: true },
  { label: 'No mutation methods allowed',            pass: true },
];

const BACKEND_CONTRACT = {
  method:               'GET only',
  allowedMethods:       ['GET'],
  blockedMethods:       ['POST', 'PUT', 'PATCH', 'DELETE'],
  dispatchAllowed:      false,
  executionAttempted:   false,
  openClawCommandSent:  false,
  browserToolUsed:      false,
};

const PREVIEW_REQUEST = {
  method:              'GET',
  endpoint:            '/status',
  headers: {
    'CF-Access-Client-Id':     '[CF_ACCESS_CLIENT_ID — injected server-side only]',
    'CF-Access-Client-Secret': '[CF_ACCESS_CLIENT_SECRET — injected server-side only]',
    'Authorization':           '[OPENCLAW_SERVICE_TOKEN — injected server-side only]',
  },
  body:                null,
  commandPayload:      null,
  dispatchAllowed:     false,
  executionAttempted:  false,
  note:                'Non-dispatchable preview shape only. Credentials injected server-side. Not sent from frontend.',
};

const PREVIEW_RESPONSE = {
  online:          true,
  status:          'healthy',
  version:         '1.x.x',
  gatewayMode:     'READ_ONLY',
  uptime:          12345,
  capabilities:    ['READ', 'VERIFY', 'SNAPSHOT'],
  executionLocked: true,
  cfAccessLayer:   true,
  note:            'Safe status fields only. No command results. No secrets. No execution outputs.',
};

function tryAppendAudit(entry) {
  try {
    import('@/lib/proposalStore').then(m => m.appendAudit?.(entry)).catch(() => {});
  } catch {}
}

function buildDesignRecord() {
  const designId = 'roab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const now = new Date().toISOString();
  return {
    designId,
    createdAt:          now,
    phase:              'READ_ONLY_AUTHENTICATED_BRIDGE_DESIGN',
    systemName:         'VeridanCore OpenClaw Operator Portal',
    gatewayMode:        'READ_ONLY',
    executionMode:      'DISABLED',
    executionLock:      'LOCKED',
    dispatchAllowed:    false,
    allowedEndpoints:   ALLOWED_ENDPOINTS,
    backendContract:    BACKEND_CONTRACT,
    previewRequestShape: PREVIEW_REQUEST,
    previewResponseShape: PREVIEW_RESPONSE,
    authChecklist:      AUTH_CHECKLIST,
    flowSteps: [
      'Veridan Core UI',
      'Base44 backend function (server-side auth injection)',
      'Cloudflare Access boundary',
      'OpenClaw Gateway — read-only status endpoint',
    ],
    note: 'Design only. No OpenClaw call. No network call. No execution. No dispatch. No credentials.',
  };
}

// ── Copy button ───────────────────────────────────────────────────────────────
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

// ── Flow diagram ──────────────────────────────────────────────────────────────
const FLOW_NODES = [
  { icon: Monitor, label: 'Veridan Core UI',      sub: 'Frontend — no credentials',   color: 'text-blue-400',   border: 'border-blue-400/30',   bg: 'bg-blue-400/5' },
  { icon: Server,  label: 'Base44 Backend Fn',    sub: 'Server-side auth injection',  color: 'text-amber-500',  border: 'border-amber-500/30',  bg: 'bg-amber-500/5' },
  { icon: Globe,   label: 'Cloudflare Access',    sub: 'Auth boundary / zero-trust',  color: 'text-purple-400', border: 'border-purple-400/30', bg: 'bg-purple-400/5' },
  { icon: Cpu,     label: 'OpenClaw Gateway',     sub: 'Read-only status endpoint',   color: 'text-primary',    border: 'border-primary/30',    bg: 'bg-primary/5' },
];

function FlowDiagram() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {FLOW_NODES.map((node, i) => {
        const Icon = node.icon;
        return (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${node.bg} ${node.border}`}>
              <Icon className={`w-3.5 h-3.5 shrink-0 ${node.color}`} />
              <div>
                <div className={`text-[9px] font-bold ${node.color}`}>{node.label}</div>
                <div className="text-[7px] text-slate-500">{node.sub}</div>
              </div>
            </div>
            {i < FLOW_NODES.length - 1 && (
              <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ReadOnlyAuthBridgeDesign({ refreshTrigger }) {
  const [design, setDesign] = useState(null);

  const handleRecord = useCallback(() => {
    const d = buildDesignRecord();
    try {
      const all = JSON.parse(localStorage.getItem(DESIGN_KEY) || '[]');
      all.unshift(d);
      localStorage.setItem(DESIGN_KEY, JSON.stringify(all.slice(0, 20)));
    } catch {}
    tryAppendAudit({
      event:    'read_only_authenticated_bridge_design_recorded',
      designId: d.designId,
      phase:    d.phase,
      note:     `Read-only authenticated bridge design recorded (${d.designId}). Design only. No execution. No network calls. No dispatch.`,
    });
    setDesign(d);
  }, []);

  return (
    <div className="space-y-4">

      {/* Header */}
      <div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Phase: Auth Bridge Design</div>
        <div className="text-[13px] font-bold text-foreground">Read-Only Authenticated OpenClaw Status Bridge Design</div>
        <div className="text-[9px] text-slate-500 mt-0.5">Architecture design only — no dispatch, no execution, no credentials.</div>
      </div>

      {/* Safety banner */}
      <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded text-[9px] text-amber-500/90">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><span className="font-bold">PREVIEW_ONLY / READ_ONLY / LOCKED</span> — Design record only. No network calls. No OpenClaw calls. No execution. No credentials.</span>
      </div>

      {/* Flow diagram */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold">Status Bridge Flow</div>
        <FlowDiagram />
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ALLOWED_ENDPOINTS.map(ep => (
            <span key={ep} className="px-2 py-1 bg-primary/5 border border-primary/20 rounded text-[8px] font-mono text-primary">{ep}</span>
          ))}
          <span className="px-2 py-1 bg-secondary/30 border border-border/40 rounded text-[7px] text-slate-500 uppercase font-bold">GET only</span>
        </div>
      </div>

      {/* Auth Boundary Checklist */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/10 border-b border-border">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Auth Boundary Checklist</span>
        </div>
        <div className="px-4 py-2 space-y-1.5">
          {AUTH_CHECKLIST.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Proposed Backend Contract */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/10 border-b border-border">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Proposed Backend Contract</span>
        </div>
        <div className="px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Method',              value: BACKEND_CONTRACT.method,             color: 'text-primary font-bold' },
              { label: 'Dispatch Allowed',    value: String(BACKEND_CONTRACT.dispatchAllowed),   color: 'text-destructive font-bold' },
              { label: 'Execution Attempted', value: String(BACKEND_CONTRACT.executionAttempted), color: 'text-destructive font-bold' },
              { label: 'OpenClaw Cmd Sent',   value: String(BACKEND_CONTRACT.openClawCommandSent), color: 'text-destructive font-bold' },
              { label: 'Browser Tool Used',   value: String(BACKEND_CONTRACT.browserToolUsed),   color: 'text-destructive font-bold' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary/20 border border-border/40 px-2.5 py-2 rounded">
                <div className="text-[7px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">{label}</div>
                <div className={`text-[10px] ${color}`}>{value}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="text-[7px] text-slate-500 font-semibold uppercase tracking-widest self-center">Blocked:</span>
            {BACKEND_CONTRACT.blockedMethods.map(m => (
              <span key={m} className="flex items-center gap-1 px-2 py-0.5 bg-destructive/5 border border-destructive/20 rounded text-[8px] font-mono text-destructive">
                <Ban className="w-2.5 h-2.5" />{m}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Request Shape */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Preview Request Shape</span>
          <span className="text-[7px] px-1.5 py-0.5 border border-amber-500/30 bg-amber-500/5 text-amber-500 rounded font-bold uppercase">Non-dispatchable</span>
        </div>
        <div className="p-3">
          <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-40">
            {JSON.stringify(PREVIEW_REQUEST, null, 2)}
          </pre>
        </div>
      </div>

      {/* Preview Response Shape */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Preview Response Shape</span>
          <span className="text-[7px] px-1.5 py-0.5 border border-primary/30 bg-primary/5 text-primary rounded font-bold uppercase">Safe fields only</span>
        </div>
        <div className="p-3">
          <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-32">
            {JSON.stringify(PREVIEW_RESPONSE, null, 2)}
          </pre>
        </div>
      </div>

      {/* Record + confirmation */}
      {!design ? (
        <button type="button" onClick={handleRecord}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 border border-primary text-primary text-[11px] font-bold hover:bg-primary/20 transition-colors rounded w-full justify-center">
          <CheckCircle2 className="w-4 h-4" /> Record Bridge Design to Audit Log
        </button>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-[11px] font-bold text-primary uppercase tracking-wide">
              BRIDGE DESIGN RECORDED — design-only, no execution, no dispatch.
            </div>
            <div className="text-[8px] text-slate-400 mt-0.5 font-mono">{design.designId}</div>
          </div>
        </div>
      )}

      {/* Actions */}
      {design && (
        <div className="flex flex-wrap gap-2">
          <CopyButton data={design} label="Copy Bridge Design JSON" />
          <button type="button" onClick={handleRecord}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors">
            <CheckCircle2 className="w-3 h-3" /> Re-record
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
        <CheckCircle2 className="w-3 h-3 shrink-0" />
        Design only · No OpenClaw call · No network call · No execution · No dispatch · No credentials.
      </div>
    </div>
  );
}