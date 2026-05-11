import React from 'react';
import { CheckCircle2, XCircle, Wifi, WifiOff, Shield, Clock, FileText } from 'lucide-react';

function StatusCard({ label, value, ok, mono }) {
  return (
    <div className="bg-card border border-border px-3 py-2.5 space-y-1">
      <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40">{label}</div>
      <div className={`text-[11px] font-semibold font-mono ${ok === true ? 'text-primary' : ok === false ? 'text-destructive' : 'text-foreground'} ${mono ? 'font-mono' : ''}`}>
        {value ?? '—'}
      </div>
    </div>
  );
}

export default function BrowserStatusCards({ result, activityLog }) {
  const last = activityLog.length > 0 ? activityLog[activityLog.length - 1] : null;
  const bridgeDiag = result?.safeDiag || last?.safeDiag || null;
  const hasBridgeToken = bridgeDiag?.hasBridgeToken ?? null;
  const tokenLength    = bridgeDiag?.bridgeTokenLength ?? null;
  const bridgeUrl      = result?.diagnostics?.find(d => d.startsWith('bridgeUrl:'))?.replace('bridgeUrl: ', '') || null;
  const sessionActive  = result?.raw?.session_active ?? last?.sessionActive ?? null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      <StatusCard
        label="Bridge Token"
        value={hasBridgeToken === null ? 'Checking…' : hasBridgeToken ? 'Present' : 'MISSING'}
        ok={hasBridgeToken === null ? null : hasBridgeToken}
      />
      <StatusCard
        label="Token Length"
        value={tokenLength !== null ? `${tokenLength} chars` : '—'}
        ok={tokenLength > 0 ? true : tokenLength === 0 ? false : null}
        mono
      />
      <StatusCard
        label="Bridge URL"
        value={bridgeUrl ? 'Configured' : '—'}
        ok={bridgeUrl ? true : null}
      />
      <StatusCard
        label="Session Active"
        value={sessionActive !== null ? String(sessionActive) : '—'}
        ok={sessionActive === true ? true : sessionActive === false ? false : null}
      />
      <StatusCard
        label="Last Command Status"
        value={last ? last.status.toUpperCase() : '—'}
        ok={last ? last.status === 'success' : null}
      />
      <StatusCard
        label="Last Page Title"
        value={last?.pageTitle || '—'}
        ok={null}
      />
    </div>
  );
}