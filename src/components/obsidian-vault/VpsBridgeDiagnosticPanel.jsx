/**
 * VpsBridgeDiagnosticPanel
 * Displays structured diagnostics when obsidianVpsDryRunBridge returns an error.
 * Never exposes VERIDAN_BRIDGE_TOKEN or any credential.
 * UI-only · No backend calls · No localStorage writes.
 */

import React from 'react';
import { XCircle, AlertTriangle, HelpCircle, ChevronRight } from 'lucide-react';

const DIAGNOSTICS = {
  502: {
    icon: XCircle,
    color: 'text-destructive',
    border: 'border-destructive/40',
    bg: 'bg-destructive/5',
    headerBg: 'bg-destructive/10',
    title: 'VPS Bridge Unreachable (502)',
    likelyCause: 'The Base44 backend could not reach the public bridge URL (https://bridge.veridancore.com/api/obsidian/dry-run). Likely causes: Cloudflare Tunnel is down, DNS is not resolving bridge.veridancore.com, an access policy is blocking the server-to-server request, or the backend still has VERIDAN_BRIDGE_URL configured as localhost.',
    endpointNote: 'Target: https://bridge.veridancore.com/api/obsidian/dry-run  (token hidden)',
    checks: [
      'Confirm cloudflared is running and connected on the VPS',
      'Test https://bridge.veridancore.com/health from a remote server (not localhost)',
      'Verify VERIDAN_BRIDGE_URL is set to https://bridge.veridancore.com in App Secrets (not localhost)',
      'Confirm server-side authorization header config is present (Bearer token)',
      'Check Cloudflare Access rules allow Base44 backend IP range',
    ],
  },
  503: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/5',
    headerBg: 'bg-amber-500/10',
    title: 'Bridge Not Configured (503)',
    likelyCause: 'The backend function could not find OBSIDIAN_VPS_BRIDGE_URL or VERIDAN_BRIDGE_TOKEN in App Secrets.',
    endpointNote: 'Endpoint cannot be determined — secrets not configured',
    checks: [
      'Go to App Settings → Secrets and confirm OBSIDIAN_VPS_BRIDGE_URL is set to https://bridge.veridancore.com',
      'Confirm VERIDAN_BRIDGE_TOKEN is set (value is hidden — never expose in UI)',
      'Re-deploy or trigger a function warm-up after adding secrets',
    ],
  },
  401: {
    icon: XCircle,
    color: 'text-destructive',
    border: 'border-destructive/40',
    bg: 'bg-destructive/5',
    headerBg: 'bg-destructive/10',
    title: 'Authorization Failed (401)',
    likelyCause: 'The VPS bridge rejected the Authorization: Bearer token. The VERIDAN_BRIDGE_TOKEN may be wrong, expired, or not accepted by the VPS bridge service.',
    endpointNote: 'Target: VERIDAN_BRIDGE_URL + /api/obsidian/dry-run  (token hidden)',
    checks: [
      'Verify VERIDAN_BRIDGE_TOKEN matches the token expected by the VPS bridge service',
      'Re-generate and re-set the token if it may have expired or rotated',
      'Check VPS bridge service logs for the rejected auth header',
    ],
  },
  403: {
    icon: XCircle,
    color: 'text-destructive',
    border: 'border-destructive/40',
    bg: 'bg-destructive/5',
    headerBg: 'bg-destructive/10',
    title: 'Forbidden (403)',
    likelyCause: 'The VPS bridge accepted the token but denied this specific request — possibly due to IP allowlist, route policy, or Cloudflare Access rules.',
    endpointNote: 'Target: VERIDAN_BRIDGE_URL + /api/obsidian/dry-run  (token hidden)',
    checks: [
      'Check Cloudflare Access or firewall policy for IP or header restrictions',
      'Confirm the bridge route /api/obsidian/dry-run is permitted for this token',
      'Review VPS bridge service logs for the denial reason',
    ],
  },
  timeout: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/5',
    headerBg: 'bg-amber-500/10',
    title: 'Network Timeout',
    likelyCause: 'The request to the VPS bridge timed out. The tunnel or VPS is reachable but not responding within the allowed window.',
    endpointNote: 'Target: VERIDAN_BRIDGE_URL + /api/obsidian/dry-run  (token hidden)',
    checks: [
      'Check VPS CPU / memory — the service may be under load',
      'Confirm the VPS bridge service is not stuck or deadlocked',
      'Check tunnel latency (Cloudflare Tunnel / ngrok health)',
      'Retry once — transient timeouts may self-resolve',
    ],
  },
  unknown: {
    icon: HelpCircle,
    color: 'text-slate-400',
    border: 'border-border/40',
    bg: 'bg-secondary/10',
    headerBg: 'bg-secondary/20',
    title: 'Unexpected Bridge Error',
    likelyCause: 'An unclassified error occurred. Check the raw message below for details.',
    endpointNote: 'Target: VERIDAN_BRIDGE_URL + /api/obsidian/dry-run  (token hidden)',
    checks: [
      'Review the raw error message below',
      'Check Base44 backend function logs for the obsidianVpsDryRunBridge function',
      'Check VPS bridge service logs for matching request timing',
    ],
  },
};

function classifyError(error) {
  if (!error) return DIAGNOSTICS.unknown;
  const s = error.status;
  if (s === 502) return DIAGNOSTICS[502];
  if (s === 503) return DIAGNOSTICS[503];
  if (s === 401) return DIAGNOSTICS[401];
  if (s === 403) return DIAGNOSTICS[403];
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('network') || msg.includes('econnrefused')) return DIAGNOSTICS.timeout;
  return DIAGNOSTICS.unknown;
}

export default function VpsBridgeDiagnosticPanel({ error }) {
  if (!error) return null;

  const diag = classifyError(error);
  const Icon = diag.icon;
  const statusCode = error.status ? `HTTP ${error.status}` : 'Network/Timeout';

  return (
    <div className={`border ${diag.border} ${diag.bg} rounded-sm overflow-hidden`}>
      {/* Header */}
      <div className={`${diag.headerBg} px-4 py-2.5 flex items-center gap-2 border-b ${diag.border}`}>
        <Icon className={`w-4 h-4 ${diag.color} shrink-0`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${diag.color}`}>
          Bridge Error — {diag.title}
        </span>
        <span className="ml-auto text-[7px] font-mono text-slate-500">{statusCode}</span>
      </div>

      <div className="p-3 space-y-3">
        {/* User-facing message */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm px-3 py-2">
          <div className="text-[7px] uppercase text-slate-500 mb-0.5">Error Message</div>
          <div className={`text-[9px] font-mono ${diag.color}`}>{error.message}</div>
        </div>

        {/* Likely cause */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm px-3 py-2">
          <div className="text-[7px] uppercase text-slate-500 mb-0.5">Likely Cause</div>
          <div className="text-[9px] text-slate-300 leading-relaxed">{diag.likelyCause}</div>
        </div>

        {/* Endpoint target */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm px-3 py-2">
          <div className="text-[7px] uppercase text-slate-500 mb-0.5">Endpoint Target</div>
          <div className="text-[8px] font-mono text-slate-400">{diag.endpointNote}</div>
        </div>

        {/* Operator checks */}
        <div className="bg-secondary/20 border border-border/30 rounded-sm px-3 py-2 space-y-1.5">
          <div className="text-[7px] uppercase text-slate-500 mb-1">Next Operator Checks</div>
          {diag.checks.map((check, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[8px] text-slate-300">
              <ChevronRight className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
              {check}
            </div>
          ))}
        </div>

        {/* Raw details if available */}
        {error.raw && (
          <details className="bg-secondary/10 border border-border/20 rounded-sm px-3 py-2">
            <summary className="text-[7px] uppercase text-slate-500 cursor-pointer select-none">Raw Response (expand)</summary>
            <pre className="mt-2 text-[7px] font-mono text-slate-500 whitespace-pre-wrap break-all max-h-32 overflow-auto">
              {JSON.stringify(error.raw, null, 2)}
            </pre>
          </details>
        )}

        <div className="text-[7px] font-mono text-slate-600">
          VERIDAN_BRIDGE_TOKEN not shown · No credentials in this panel · Dry-run diagnostics only
        </div>
      </div>
    </div>
  );
}