/**
 * OpenClawMonitoringRunbook
 * READ-ONLY operator runbook for OpenClaw gateway monitoring.
 * No command execution, no dispatch, no automation, no vault write, no trading, no credentials.
 */

import React, { useState } from 'react';
import {
  Shield, BookOpen, ChevronDown, ChevronUp, CheckCircle2,
  Lock, Terminal, AlertTriangle, XCircle, WifiOff, Activity,
  Server, Cpu, AlertCircle
} from 'lucide-react';

const VPS = {
  label:          'ubuntu-s-1vcpu-2gb-nyc1',
  ip:             '142.93.206.36',
  openclawUrl:    'openclaw.veridancore.com',
  bridgeUrl:      'bridge.veridancore.com',
  configPath:     '/root/.openclaw/openclaw.json',
  baselineFolder: '/root/veridan-baseline-2026-05-31-openclaw-live',
};

const OPERATOR_COMMANDS = [
  { label: 'SSH into VPS',                 cmd: `ssh root@${VPS.ip}` },
  { label: 'Local health check',           cmd: 'curl -s http://127.0.0.1:18789/health' },
  { label: 'OpenClaw service status',      cmd: 'systemctl status openclaw --no-pager' },
  { label: 'Cloudflared tunnel status',    cmd: 'systemctl status cloudflared --no-pager' },
  { label: 'Chromium CDP status',          cmd: 'systemctl status chromium-cdp --no-pager' },
];

const VERIFICATION_CHECKS = [
  'Runbook displays instructions only — no interactive execution',
  'No command execution is wired to any button',
  'No OpenClaw dispatch exists in this panel',
  'No browser automation trigger exists',
  'No vault write trigger exists',
  'No trading trigger exists',
  'No credential field exists',
  'No backend mutation occurs',
  'No InvokeLLM occurs',
  'Safety warnings are visible in every runbook section',
];

const SECTIONS = [
  {
    id: 'safe-mode',
    icon: Shield,
    iconColor: 'text-primary',
    title: 'Current Safe Operating Mode',
    badge: { label: 'READ_ONLY', cls: 'text-primary border-primary/30 bg-primary/10' },
    steps: [
      'This monitoring page is READ_ONLY. No commands execute from this UI.',
      'Gateway health is checked via manual refresh only — no auto-polling.',
      'Capture Evidence Snapshot (above) to record state locally before any VPS action.',
      'All VPS actions must be performed manually via SSH — this panel shows commands for reference only.',
      'Do NOT use /execute, /dispatch, /trade, /vault/write, or /credentials endpoints.',
    ],
  },
  {
    id: 'gateway-live',
    icon: Activity,
    iconColor: 'text-primary',
    title: 'If Gateway is LIVE',
    badge: { label: 'NOMINAL', cls: 'text-primary border-primary/30 bg-primary/10' },
    steps: [
      'Gateway is reachable and returning {"ok":true,"status":"live"} from /health.',
      'Capture an Evidence Snapshot to document the healthy state.',
      'Verify agents and commands show DETECTED or a count in the status panel.',
      'If models/agents/commands show DETECTED (not JSON), gateway is serving HTML at those paths — this is normal if API routes are not separately mapped.',
      'No operator intervention required. Continue monitoring.',
    ],
  },
  {
    id: 'health-unknown',
    icon: AlertCircle,
    iconColor: 'text-amber-400',
    title: 'If Health is UNKNOWN or FAILED',
    badge: { label: 'INVESTIGATE', cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
    steps: [
      'Click Manual Refresh to re-attempt the health check.',
      'If still UNKNOWN: SSH into VPS and run: curl -s http://127.0.0.1:18789/health',
      'Check OpenClaw service: systemctl status openclaw --no-pager',
      'Check Cloudflare tunnel: systemctl status cloudflared --no-pager',
      'If OpenClaw is stopped: systemctl start openclaw (manual VPS action only)',
      'If Cloudflared is stopped: systemctl start cloudflared (manual VPS action only)',
      'Capture a new Evidence Snapshot once health recovers.',
    ],
  },
  {
    id: 'not-connected',
    icon: WifiOff,
    iconColor: 'text-slate-400',
    title: 'If Gateway is NOT_CONNECTED',
    badge: { label: 'NOT_CONNECTED', cls: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
    steps: [
      'OPENCLAW_GATEWAY_URL secret is not configured in the app environment.',
      'Go to app Settings → Secrets and verify OPENCLAW_GATEWAY_URL is set to: https://openclaw.veridancore.com',
      'Also verify OPENCLAW_SERVICE_TOKEN, CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET are set.',
      'After setting secrets, click Manual Refresh.',
      'If URL is set but still NOT_CONNECTED: VPS may be offline. SSH and check services.',
    ],
  },
  {
    id: 'cors-blocked',
    icon: XCircle,
    iconColor: 'text-destructive',
    title: 'If CORS_OR_ACCESS_BLOCKED',
    badge: { label: 'ACCESS_BLOCKED', cls: 'text-destructive border-destructive/30 bg-destructive/10' },
    steps: [
      'The backend cannot reach the gateway — likely a Cloudflare Access policy or auth header issue.',
      'Verify CF_ACCESS_CLIENT_ID and CF_ACCESS_CLIENT_SECRET are correct in app secrets.',
      'SSH into VPS and verify Cloudflared tunnel is active: systemctl status cloudflared --no-pager',
      'Check Cloudflare Zero Trust dashboard to confirm the service token policy is active.',
      'Local test: curl -s http://127.0.0.1:18789/health should return {"ok":true} from VPS.',
      'Do NOT attempt to bypass Cloudflare Access — fix credentials via the Zero Trust dashboard.',
    ],
  },
  {
    id: 'model-detected',
    icon: Cpu,
    iconColor: 'text-slate-400',
    title: 'If Model is DETECTED but not JSON',
    badge: { label: 'INFORMATIONAL', cls: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
    steps: [
      'The /models endpoint on this gateway returns HTML (a web UI), not a JSON API response.',
      'DETECTED means the endpoint is reachable and returning non-empty content.',
      'This is expected if OpenClaw serves a browser UI at /models rather than a REST endpoint.',
      'Default model (gpt-4.1-mini) is configured in /root/.openclaw/openclaw.json on the VPS.',
      'To confirm: SSH and run: cat /root/.openclaw/openclaw.json | grep model',
      'No action required if gateway health is otherwise LIVE.',
    ],
  },
  {
    id: 'agents-commands-detected',
    icon: Terminal,
    iconColor: 'text-slate-400',
    title: 'If Agents/Commands are DETECTED but not JSON',
    badge: { label: 'INFORMATIONAL', cls: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
    steps: [
      'The /agents and /commands endpoints return HTML rather than a JSON agent/command list.',
      'DETECTED means the endpoints are reachable and returning content.',
      'This is expected if OpenClaw routes those paths to a browser UI.',
      'Actual agent and command configuration lives in /root/.openclaw/openclaw.json.',
      'To list agents: SSH and inspect openclaw.json or check OpenClaw logs.',
      'No action required if gateway health is LIVE.',
    ],
  },
  {
    id: 'vps-restart',
    icon: Server,
    iconColor: 'text-amber-400',
    title: 'If VPS Restart is Required',
    badge: { label: 'MANUAL_VPS_ACTION', cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' },
    steps: [
      '⚠ VPS restart must be performed manually via SSH — never from this UI.',
      'SSH: ssh root@142.93.206.36',
      'Before restarting: capture an Evidence Snapshot from this page to record pre-restart state.',
      'Restart sequence (manual): systemctl restart openclaw → systemctl restart cloudflared → systemctl restart chromium-cdp',
      'After restart: wait 30 seconds, then click Manual Refresh on this page.',
      'Capture a second Evidence Snapshot to document post-restart state.',
      'If services do not recover: check /var/log/syslog or journalctl -u openclaw -n 50',
    ],
  },
  {
    id: 'api-quota',
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    title: 'If API Quota is Exhausted',
    badge: { label: 'QUOTA_ISSUE', cls: 'text-destructive border-destructive/30 bg-destructive/10' },
    steps: [
      'OpenAI quota exhaustion will show as errors in OpenClaw logs, not in the /health endpoint.',
      'Gateway health may still show LIVE even when quota is exhausted.',
      'SSH into VPS and check: journalctl -u openclaw -n 100 | grep -i quota',
      'Go to platform.openai.com → Usage to check token consumption.',
      'Do NOT rotate API keys from this UI — update OPENAI_API_KEY in openclaw.json on VPS only.',
      'After updating the key: systemctl restart openclaw (manual VPS action only)',
    ],
  },
  {
    id: 'do-not-touch',
    icon: XCircle,
    iconColor: 'text-destructive',
    title: 'What NOT to Touch',
    badge: { label: 'CRITICAL', cls: 'text-destructive border-destructive/30 bg-destructive/10' },
    steps: [
      '🚫 Do NOT call /execute, /dispatch, /browser, /trade, /vault/write, /filesystem, or /credentials.',
      '🚫 Do NOT hardcode or paste API keys, tokens, or secrets into any UI field.',
      '🚫 Do NOT run OpenClaw task commands from this monitoring page.',
      '🚫 Do NOT click execution buttons in other panels without operator approval workflow.',
      '🚫 Do NOT delete or overwrite the baseline folder: /root/veridan-baseline-2026-05-31-openclaw-live',
      '🚫 Do NOT modify /root/.openclaw/openclaw.json without capturing a pre-change snapshot.',
      '🚫 Do NOT restart services during active trading or live sessions without a rollback plan.',
    ],
  },
];

function CommandBlock({ label, cmd }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[6px] font-mono text-slate-600 uppercase tracking-widest">{label}</div>
      <pre className="text-[7px] font-mono text-primary/80 bg-background/60 border border-primary/15 rounded-sm px-3 py-1.5 whitespace-pre-wrap break-all select-all">
        {cmd}
      </pre>
    </div>
  );
}

function RunbookSection({ section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;
  return (
    <div className="border border-border/30 rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-secondary/20 transition-colors"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className={`w-3 h-3 shrink-0 ${section.iconColor}`} />
          <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wide">{section.title}</span>
          <span className={`px-1.5 py-0.5 text-[6px] font-bold uppercase border rounded-sm ${section.badge.cls}`}>
            {section.badge.label}
          </span>
        </div>
        {open ? <ChevronUp className="w-3 h-3 text-slate-500 shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5 border-t border-border/20 bg-background/30">
          {section.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2 text-[7px] font-mono text-slate-400">
              <span className="text-slate-600 shrink-0 w-4">{i + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OpenClawMonitoringRunbook() {
  const [showCommands, setShowCommands] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  return (
    <div className="border border-border/50 bg-card rounded-sm overflow-hidden font-mono">

      {/* Safety banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/5 border-b border-amber-500/20 flex-wrap gap-y-1">
        <Shield className="w-3 h-3 text-amber-500 shrink-0" />
        <span className="text-[7px] font-bold text-amber-500 uppercase tracking-widest">
          OPERATOR RUNBOOK — READ ONLY INSTRUCTIONS
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="px-2 py-0.5 text-[6px] font-bold uppercase border border-primary/30 bg-primary/10 text-primary rounded-sm">READ_ONLY</span>
          <span className="px-2 py-0.5 text-[6px] font-bold uppercase border border-primary/20 bg-primary/5 text-primary/70 rounded-sm">MANUAL_ONLY</span>
          <span className="px-2 py-0.5 text-[6px] font-bold uppercase border border-slate-600/40 bg-slate-700/40 text-slate-400 rounded-sm">EXECUTION_DISABLED</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
        <BookOpen className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-200">
          OpenClaw Monitoring Runbook
        </span>
      </div>

      <div className="p-4 space-y-3">

        {/* Runbook sections */}
        {SECTIONS.map(section => (
          <RunbookSection key={section.id} section={section} />
        ))}

        {/* VPS reference + operator commands */}
        <div className="border border-border/30 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowCommands(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3 text-primary" />
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-wide">VPS Reference &amp; Read-Only Command Reference</span>
              <span className="px-1.5 py-0.5 text-[6px] font-bold uppercase border border-slate-500/30 bg-slate-500/10 text-slate-400 rounded-sm">DISPLAY ONLY</span>
            </div>
            {showCommands ? <ChevronUp className="w-3 h-3 text-slate-500 shrink-0" /> : <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />}
          </button>
          {showCommands && (
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/20 bg-background/30">
              <div className="flex items-center gap-1.5 text-[6px] font-mono text-amber-500/70">
                <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                These are reference commands only. No execution occurs from this panel. Run manually via SSH.
              </div>

              {/* VPS facts */}
              <div className="border border-border/20 bg-background/50 rounded-sm p-2.5 space-y-1">
                <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600 mb-1.5">VPS Facts</div>
                {[
                  ['VPS Label',       VPS.label],
                  ['VPS IP',          VPS.ip],
                  ['OpenClaw URL',    VPS.openclawUrl],
                  ['Bridge URL',      VPS.bridgeUrl],
                  ['Config Path',     VPS.configPath],
                  ['Baseline Folder', VPS.baselineFolder],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-2 text-[7px] font-mono">
                    <span className="text-slate-600 shrink-0 w-32">{k}</span>
                    <span className="text-slate-400 break-all">{v}</span>
                  </div>
                ))}
              </div>

              {/* Commands */}
              <div className="space-y-2">
                <div className="text-[6px] font-bold uppercase tracking-widest text-slate-600">Reference Commands (select-all, copy manually)</div>
                {OPERATOR_COMMANDS.map(({ label, cmd }) => (
                  <CommandBlock key={cmd} label={label} cmd={cmd} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verification */}
        <div className="border border-border/30 rounded-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowVerification(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2 text-[7px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-200 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-2.5 h-2.5" />
              Safety Verification Checks ({VERIFICATION_CHECKS.length})
            </div>
            {showVerification ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showVerification && (
            <div className="px-3 pb-3 pt-1 space-y-1 border-t border-border/20 bg-background/30">
              {VERIFICATION_CHECKS.map((check, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
                  <CheckCircle2 className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
                  {check}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[6px] font-mono text-slate-600 space-y-0.5 border-t border-border/20 pt-2">
          <div>runbookMode: READ_ONLY_INSTRUCTIONS · executionWired: FALSE · dispatchWired: FALSE</div>
          <div>credentialFields: NONE · backendMutation: FALSE · automationTrigger: FALSE</div>
        </div>

      </div>
    </div>
  );
}