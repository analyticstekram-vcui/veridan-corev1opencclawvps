/**
 * TradingAlertNotifications — Deployment Readiness Dashboard
 *
 * Shows live status of the Veridan TradingView alert + APNs notification flow.
 * READ-ONLY · NO execution · NO broker · NO trading
 */

import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import ModuleNav from '../components/navigation/ModuleNav';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Bell, Smartphone, Zap, Shield } from 'lucide-react';

const APP_ID = import.meta.env.VITE_APP_ID || window?.location?.hostname?.split('.')[0] || 'YOUR_APP_ID';
const BASE_URL = `https://app.base44.com/api/apps/${APP_ID}/functions`;

function StatusDot({ ok, warn }) {
  if (warn) return <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  return ok
    ? <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
    : <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />;
}

function SectionCard({ title, icon: IconComp, children }) {
  const Icon = IconComp;
  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function TradingAlertNotifications() {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('tradingAlertDeploymentCheck', {});
      setStatus(res.data);
    } catch (e) {
      setError(e.message || 'Failed to fetch deployment status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const webhookUrl    = `${BASE_URL}/tradingViewAlertWebhook?secret=YOUR_VERIDAN_TV_SECRET`;
  const registerUrl   = `${BASE_URL}/registerVeridanDevice`;
  const checkUrl      = `${BASE_URL}/tradingAlertDeploymentCheck`;

  return (
    <div className="min-h-screen bg-background flex flex-col font-mono">
      <ModuleNav />

      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-primary mb-1">
              Veridan Core · Alert Notifications
            </div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              TradingView Alert + APNs Deployment
            </h1>
            <p className="text-[9px] text-slate-400 mt-1">
              Deployment readiness checklist · Webhook + device registration status · Dry-run gate
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 text-[7px] font-bold uppercase border border-primary/30 bg-primary/10 text-primary rounded-sm">READ_ONLY</span>
            <span className="px-2 py-1 text-[7px] font-bold uppercase border border-destructive/30 bg-destructive/10 text-destructive rounded-sm">NO_BROKER</span>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[8px] font-bold uppercase border border-border/40 text-slate-300 hover:text-slate-100 hover:border-primary/40 hover:bg-primary/5 transition-colors rounded-sm"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-4">

        {error && (
          <div className="border border-destructive/40 bg-destructive/5 rounded-sm px-4 py-3 text-[9px] text-destructive">
            Error: {error}
          </div>
        )}

        {/* ── Endpoint URLs ─────────────────────────────────────────────────── */}
        <SectionCard title="Endpoint URLs" icon={Zap}>
          <div className="space-y-3">
            <EndpointRow
              label="TradingView Webhook"
              method="POST"
              url={webhookUrl}
              note="Append ?secret=YOUR_VERIDAN_TV_SECRET to the URL in TradingView alert settings"
            />
            <EndpointRow
              label="iOS Device Registration"
              method="POST"
              url={registerUrl}
              note="Send Bearer token in Authorization header. Body: { deviceToken, bundleId?, environment?, label? }"
            />
            <EndpointRow
              label="Deployment Check (this page)"
              method="GET/POST"
              url={checkUrl}
              note="Read-only status check — no mutations"
            />
          </div>
        </SectionCard>

        {/* ── Env Var Status ────────────────────────────────────────────────── */}
        <SectionCard title="Required Environment Variables" icon={Shield}>
          {loading && !status && (
            <div className="text-[9px] text-slate-500 animate-pulse">Loading…</div>
          )}
          {status && (
            <div className="space-y-1.5">
              {status.envStatus?.map(v => (
                <div key={v.name} className="flex items-start gap-2 py-1.5 border-b border-border/20 last:border-0">
                  <StatusDot ok={v.present} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] font-bold font-mono text-slate-200">{v.name}</span>
                      {v.present
                        ? <span className="text-[7px] text-primary font-bold">SET{v.value && !v.sensitive ? ` = ${v.value}` : ''}</span>
                        : <span className="text-[7px] text-destructive font-bold">MISSING</span>
                      }
                    </div>
                    <div className="text-[7px] text-slate-500 mt-0.5">{v.description}</div>
                  </div>
                </div>
              ))}
              {status.missing?.length > 0 && (
                <div className="mt-3 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-sm">
                  <div className="text-[8px] font-bold text-destructive mb-1">Missing ({status.missing.length})</div>
                  <div className="text-[7px] text-slate-400">
                    Set these in Base44 Dashboard → App Settings → Environment Variables:
                    {' '}<span className="font-mono text-slate-300">{status.missing.join(', ')}</span>
                  </div>
                </div>
              )}
              {status.missing?.length === 0 && (
                <div className="mt-3 px-3 py-2 bg-primary/5 border border-primary/20 rounded-sm text-[8px] text-primary font-bold">
                  ✓ All required environment variables are set
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {/* ── Deployment Status ─────────────────────────────────────────────── */}
        {status && (
          <SectionCard title="Deployment Readiness" icon={CheckCircle2}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatusTile label="Webhook Ready" ok={status.webhookReady} />
              <StatusTile label="APNs Creds" ok={status.apnsCredsReady} />
              <StatusTile label="Push Dry-Run" ok={status.dryRun} warn={!status.dryRun} warnLabel="LIVE MODE" okLabel="SAFE (true)" />
              <StatusTile label="All Vars Set" ok={status.deploymentReady} />
            </div>
            <div className="mt-3 px-3 py-2 border border-border/30 bg-secondary/10 rounded-sm text-[7px] text-slate-500 space-y-0.5">
              <div>Registered devices: <span className="text-slate-300 font-bold">{status.registeredDeviceCount ?? '—'}</span> active / <span className="text-slate-400">{status.totalDeviceCount ?? '—'}</span> total</div>
              <div>App ID: <span className="font-mono text-slate-400">{status.appId}</span></div>
              <div>Checked at: <span className="font-mono text-slate-400">{status.checkedAt}</span></div>
            </div>
          </SectionCard>
        )}

        {/* ── Latest Alerts ─────────────────────────────────────────────────── */}
        <SectionCard title="Latest Alerts Received" icon={Bell}>
          {!status && !loading && <div className="text-[9px] text-slate-500">Press Refresh to load.</div>}
          {loading && !status && <div className="text-[9px] text-slate-500 animate-pulse">Loading…</div>}
          {status?.latestAlerts?.length === 0 && (
            <div className="text-[9px] text-slate-500">No alerts received yet.</div>
          )}
          {status?.latestAlerts?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[8px]">
                <thead>
                  <tr className="border-b border-border/30 text-slate-500 text-left">
                    <th className="pb-1.5 font-bold pr-3">Ticker</th>
                    <th className="pb-1.5 font-bold pr-3">Type</th>
                    <th className="pb-1.5 font-bold pr-3">Price</th>
                    <th className="pb-1.5 font-bold pr-3">Push Status</th>
                    <th className="pb-1.5 font-bold pr-3">Dry Run</th>
                    <th className="pb-1.5 font-bold">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {status.latestAlerts.map(a => (
                    <tr key={a.id} className="border-b border-border/20 last:border-0">
                      <td className="py-1.5 pr-3 font-mono text-slate-200">{a.ticker || '—'}</td>
                      <td className="py-1.5 pr-3 text-slate-400">{a.alertType || '—'}</td>
                      <td className="py-1.5 pr-3 font-mono text-slate-300">{a.price || '—'}</td>
                      <td className="py-1.5 pr-3">
                        <span className={`px-1.5 py-0.5 rounded-sm font-bold text-[7px] ${
                          a.pushStatus === 'SENT' ? 'bg-primary/10 text-primary' :
                          a.pushStatus === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                          a.pushStatus === 'DRY_RUN_SKIPPED' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-secondary/30 text-slate-400'
                        }`}>{a.pushStatus}</span>
                      </td>
                      <td className="py-1.5 pr-3 text-slate-500">{a.dryRun ? 'yes' : 'no'}</td>
                      <td className="py-1.5 text-slate-500 font-mono">{a.receivedAt ? a.receivedAt.slice(0, 19).replace('T', ' ') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* ── Registered Devices ────────────────────────────────────────────── */}
        <SectionCard title="Registered iOS Devices" icon={Smartphone}>
          {!status && !loading && <div className="text-[9px] text-slate-500">Press Refresh to load.</div>}
          {status && (
            <div className="text-[9px] text-slate-400">
              {status.registeredDeviceCount === 0
                ? 'No active devices registered yet. POST a device token to the registration endpoint.'
                : `${status.registeredDeviceCount} active device(s) registered. Tokens are stored but not displayed here for security.`}
            </div>
          )}
        </SectionCard>

        {/* ── What to Test First ────────────────────────────────────────────── */}
        <SectionCard title="What to Test First" icon={Zap}>
          <ol className="space-y-2 list-none">
            {[
              { n: 1, text: 'Set VERIDAN_TV_SECRET in Base44 Dashboard → App Settings → Environment Variables', done: status?.webhookReady },
              { n: 2, text: 'Do a GET request to the webhook URL — should return { ok: true, status: "LISTENING" }', done: null },
              { n: 3, text: 'Send a test POST to the webhook with ?secret=YOUR_SECRET and body { "ticker":"TEST","message":"hello" }', done: null },
              { n: 4, text: 'Confirm the alert appears in Latest Alerts above with pushStatus = DRY_RUN_SKIPPED', done: null },
              { n: 5, text: 'Register a real iPhone token via POST to registerVeridanDevice (with Authorization: Bearer YOUR_SECRET)', done: status?.registeredDeviceCount > 0 },
              { n: 6, text: 'Set all APNS_* env vars, then set VERIDAN_PUSH_DRY_RUN=false only after confirming above steps', done: status?.apnsCredsReady },
              { n: 7, text: 'Send a live alert from TradingView and confirm push arrives on iPhone', done: null },
            ].map(({ n, text, done }) => (
              <li key={n} className="flex items-start gap-2.5">
                <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold mt-0.5 ${
                  done === true ? 'bg-primary/20 text-primary' :
                  done === false ? 'bg-destructive/20 text-destructive' :
                  'bg-secondary/40 text-slate-400'
                }`}>{n}</div>
                <span className="text-[8px] text-slate-300 leading-relaxed">{text}</span>
                {done === true && <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />}
              </li>
            ))}
          </ol>
        </SectionCard>

        {/* ── Safety Boundary ───────────────────────────────────────────────── */}
        <div className="border border-amber-500/20 bg-amber-500/5 rounded-sm px-4 py-3 space-y-1">
          <div className="text-[8px] font-bold text-amber-400 uppercase tracking-widest">Safety Boundary</div>
          <div className="text-[8px] text-slate-400 leading-relaxed">
            Live iPhone push does NOT work until: (a) VERIDAN_PUSH_DRY_RUN=false, (b) all APNS_* vars are set, and (c) a real device token from a physical iPhone is registered.
            Simulator tokens are rejected by APNs. Do not claim push is working until confirmed end-to-end on hardware.
          </div>
        </div>

      </div>
    </div>
  );
}

function EndpointRow({ label, method, url, note }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[7px] font-bold uppercase px-1.5 py-0.5 bg-secondary/30 border border-border/30 text-slate-400 rounded-sm">{method}</span>
        <span className="text-[8px] font-bold text-slate-200">{label}</span>
      </div>
      <div className="font-mono text-[7px] text-primary bg-secondary/20 px-2 py-1.5 rounded-sm break-all">{url}</div>
      <div className="text-[7px] text-slate-500">{note}</div>
    </div>
  );
}

function StatusTile({ label, ok, warn, okLabel, warnLabel }) {
  const isWarn = warn && ok;
  return (
    <div className={`border rounded-sm px-3 py-2 flex flex-col gap-1 ${
      isWarn ? 'border-amber-500/30 bg-amber-500/5' :
      ok ? 'border-primary/30 bg-primary/5' :
      'border-destructive/30 bg-destructive/5'
    }`}>
      <div className="text-[7px] text-slate-500 uppercase">{label}</div>
      <div className={`text-[9px] font-bold font-mono ${isWarn ? 'text-amber-400' : ok ? 'text-primary' : 'text-destructive'}`}>
        {isWarn ? (warnLabel || 'WARN') : ok ? (okLabel || 'READY') : 'NOT READY'}
      </div>
    </div>
  );
}