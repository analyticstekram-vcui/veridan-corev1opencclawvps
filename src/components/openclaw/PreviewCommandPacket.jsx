/**
 * PreviewCommandPacket
 * Generates, displays, and manages read-only preview command packets
 * for approved Safe Command proposals.
 * No OpenClaw calls. No execution. No browser tools.
 */
import React, { useState } from 'react';
import { FileText, Copy, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, Zap, XCircle } from 'lucide-react';
import { generatePacket, markPacketReadyForBridgeTest } from '@/lib/proposalStore';

const PACKET_STATUS_CFG = {
  GENERATED:              { label: 'GENERATED',               color: 'text-primary',     bg: 'bg-primary/5 border-primary/20' },
  READY_FOR_BRIDGE_TEST:  { label: 'READY FOR BRIDGE TEST',   color: 'text-blue-400',    bg: 'bg-blue-400/5 border-blue-400/20' },
  BLOCKED:                { label: 'BLOCKED',                  color: 'text-destructive', bg: 'bg-destructive/5 border-destructive/20' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={handle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 rounded font-bold transition-colors">
      {copied ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy Packet JSON'}
    </button>
  );
}

function PacketCard({ packet, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = PACKET_STATUS_CFG[packet.packetStatus] || PACKET_STATUS_CFG.GENERATED;
  const isReady = packet.packetStatus === 'READY_FOR_BRIDGE_TEST';

  const handleMarkReady = () => {
    markPacketReadyForBridgeTest(packet.packetId);
    onRefresh();
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${cfg.bg}`}>
      <div
        className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-black/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-foreground font-mono">{packet.commandType}</span>
            <span className={`text-[7px] px-1.5 py-0.5 border rounded font-bold uppercase ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            {packet.allowedCommand
              ? <span className="text-[7px] text-primary font-bold">ALLOWED</span>
              : <span className="text-[7px] text-destructive font-bold">BLOCKED</span>
            }
          </div>
          <div className="text-[9px] text-blue-400 font-mono truncate mt-0.5">{packet.target}</div>
        </div>
        <span className="text-[8px] text-slate-500 font-mono shrink-0">{new Date(packet.createdAt).toLocaleTimeString()}</span>
      </div>

      {expanded && (
        <div className="border-t border-border/20 px-3 py-3 space-y-3 bg-black/10">
          {/* Packet fields summary */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8px] text-slate-500">
            <span>Packet ID: <span className="text-slate-300 font-mono">{packet.packetId}</span></span>
            <span>Proposal ID: <span className="text-slate-300 font-mono">{packet.proposalId}</span></span>
            <span>Safety Mode: <span className="text-primary font-semibold">{packet.safetyMode}</span></span>
            <span>Gateway Mode: <span className="text-amber-500 font-semibold">{packet.gatewayMode}</span></span>
            <span>Execution Attempted: <span className="text-destructive font-semibold">{String(packet.executionAttempted)}</span></span>
            <span>OpenClaw Call: <span className="text-destructive font-semibold">{String(packet.openclawCallAttempted)}</span></span>
            <span>Governance: <span className="text-slate-300">{packet.governanceDecision || '—'}</span></span>
            <span>Reviewed by: <span className="text-slate-300">{packet.reviewedBy || '—'}</span></span>
            <span>Risk Tier: <span className={packet.riskTier === 'HIGH' ? 'text-destructive font-semibold' : packet.riskTier === 'MEDIUM' ? 'text-amber-500 font-semibold' : 'text-primary font-semibold'}>{packet.riskTier}</span></span>
            <span>Audit Hash: <span className="text-slate-400 font-mono">{packet.auditHashPlaceholder}</span></span>
          </div>

          {packet.blockedReasons?.length > 0 && (
            <div className="px-2 py-1.5 bg-destructive/5 border border-destructive/20 rounded space-y-0.5">
              {packet.blockedReasons.map((r, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[8px] text-destructive">
                  <XCircle className="w-2.5 h-2.5 shrink-0" /> {r}
                </div>
              ))}
            </div>
          )}

          {/* Full JSON viewer */}
          <div>
            <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Preview Packet JSON (read-only)</div>
            <pre className="bg-secondary/40 border border-border/30 rounded p-2 text-[7px] font-mono text-slate-300 overflow-auto max-h-48">
              {JSON.stringify(packet, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <CopyButton text={JSON.stringify(packet, null, 2)} />
            {!isReady && packet.allowedCommand && (
              <button type="button" onClick={handleMarkReady}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-blue-400/40 text-blue-400 bg-blue-400/5 hover:bg-blue-400/15 rounded font-bold transition-colors">
                <Zap className="w-3 h-3" /> Mark Ready for Read-Only Bridge Test
              </button>
            )}
            {isReady && (
              <div className="flex items-center gap-1.5 text-[9px] text-blue-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> READY_FOR_BRIDGE_TEST
              </div>
            )}
          </div>

          {/* Safety note */}
          <div className="flex items-center gap-2 px-2 py-1.5 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            Read-only packet. No OpenClaw calls. No execution. No browser tools.
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Props:
 *   proposal    – the approved/queued proposal object
 *   packets     – all loaded packets
 *   onRefresh   – callback to reload packets from store
 */
export default function PreviewCommandPacket({ proposal, packets, onRefresh }) {
  const [genError, setGenError] = useState('');
  const [showPanel, setShowPanel] = useState(false);

  // Packets for this proposal
  const myPackets = packets.filter(pk => pk.proposalId === proposal.id);

  const handleGenerate = () => {
    setGenError('');
    const result = generatePacket(proposal);
    if (result.error) {
      setGenError(result.error);
    } else {
      setShowPanel(true);
      onRefresh();
    }
  };

  const canGenerate = !['DENIED', 'BLOCKED_PREVIEW'].includes(proposal.status)
    && proposal.riskTier !== 'HIGH'
    && !proposal.blockedReasons?.length
    && proposal.reviewNote;

  return (
    <div className="space-y-2">
      {/* Generate button */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-primary/40 text-primary bg-primary/5 hover:bg-primary/15 rounded font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText className="w-3 h-3" /> Generate Preview Packet
        </button>
        {myPackets.length > 0 && (
          <button type="button" onClick={() => setShowPanel(p => !p)}
            className="text-[8px] text-slate-400 hover:text-slate-200 underline">
            {showPanel ? 'Hide' : 'Show'} packets ({myPackets.length})
          </button>
        )}
      </div>

      {/* Validation error */}
      {genError && (
        <div className="flex items-start gap-1.5 text-[9px] text-destructive">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> {genError}
        </div>
      )}

      {/* Hint for missing review note */}
      {!canGenerate && !genError && !proposal.reviewNote && (
        <div className="text-[8px] text-slate-500">Review note required before generating a packet.</div>
      )}

      {/* Packets panel */}
      {showPanel && myPackets.length > 0 && (
        <div className="space-y-1.5 border-l-2 border-primary/20 pl-3">
          <div className="text-[8px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Preview Packets ({myPackets.length})</div>
          {myPackets.map(pk => (
            <PacketCard key={pk.packetId} packet={pk} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}