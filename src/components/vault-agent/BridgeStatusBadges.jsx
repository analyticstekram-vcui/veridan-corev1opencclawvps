import React from 'react';
import { Cable, ShieldCheck, WifiOff } from 'lucide-react';

function Badge({ label, tone = 'safe' }) {
  const toneClass = tone === 'warn'
    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
    : tone === 'danger'
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : 'border-primary/30 bg-primary/10 text-primary';

  return (
    <span className={`px-2 py-0.5 text-[6px] font-bold uppercase border rounded-sm font-mono ${toneClass}`}>
      {label}
    </span>
  );
}

export default function BridgeStatusBadges({ bridgeStatus }) {
  const isLive = bridgeStatus?.mode === 'LIVE_READ_ONLY';
  const requestVerified = bridgeStatus?.requestStatus === 'BRIDGE_REQUEST_VERIFIED';
  const payloadVerified = bridgeStatus?.payloadStatus === 'BRIDGE_PAYLOAD_VERIFIED';

  return (
    <div className="flex items-start gap-3 px-4 py-2.5 border border-border/30 bg-card/40 rounded-sm">
      {isLive ? (
        <Cable className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <span className="text-[7px] font-bold uppercase tracking-widest text-slate-300">
            Phase 5 Bridge Status
          </span>
          <span className="text-[7px] font-mono text-slate-600 truncate">
            {bridgeStatus?.endpoint || 'http://127.0.0.1:57445/vault-agent/reports'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge label="GET_ONLY" />
          <Badge label="LOCALHOST_ONLY" />
          <Badge label="NO_WRITES" />
          <Badge label="NO_DATABASE_MUTATIONS" />
          <Badge label="NO_OPENCLAW_EXECUTION" />
          <Badge label="NO_BROKER_ACCESS" />
          <Badge label="NO_BANKING_ACCESS" />
          <Badge label="NO_GOVERNANCE_ACTIVATION" />
          <Badge label={isLive ? 'LIVE_READ_ONLY' : 'MOCK_FALLBACK'} tone={isLive ? 'safe' : 'warn'} />
          <Badge label={requestVerified ? 'REQUEST_VERIFIED' : bridgeStatus?.requestStatus || 'REQUEST_PENDING'} tone={requestVerified ? 'safe' : 'warn'} />
          <Badge label={payloadVerified ? 'PAYLOAD_VERIFIED' : bridgeStatus?.payloadStatus || 'PAYLOAD_NOT_USED'} tone={payloadVerified ? 'safe' : 'warn'} />
        </div>
        <div className="flex items-center gap-1.5 text-[7px] font-mono text-slate-500 mt-1.5">
          <ShieldCheck className="w-2.5 h-2.5 text-primary shrink-0" />
          Unsafe, unavailable, non-localhost, or non-GET bridge data is rejected and replaced with mock report data.
        </div>
      </div>
    </div>
  );
}
