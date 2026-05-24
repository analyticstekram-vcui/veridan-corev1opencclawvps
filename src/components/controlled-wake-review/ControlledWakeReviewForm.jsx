import React, { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  evaluateReviewRequirements,
  generateReviewId,
  generateReviewAuditHash,
  saveReviewPacket,
} from './controlledWakeReviewContracts';

export default function ControlledWakeReviewForm({ record, onPacketGenerated }) {
  const [approved, setApproved] = useState(false);
  const [packet, setPacket]     = useState(null);

  const { checks, allPass } = evaluateReviewRequirements(record);
  const reviewDecision = allPass
    ? 'CONTROLLED_REVIEW_PASSED_PENDING_FUTURE_ACTIVATION'
    : 'CONTROLLED_REVIEW_BLOCKED_REQUIREMENTS_NOT_MET';

  const handleGenerate = () => {
    if (!approved || !record) return;
    const ts = new Date().toISOString();
    const reviewId = generateReviewId();
    const auditHash = generateReviewAuditHash(reviewId, record.evidenceId, reviewDecision, ts);
    const pkt = {
      reviewId,
      sourceReadinessEvidenceId: record.evidenceId,
      sourceAuditHash: record.auditHash,
      reviewDecision,
      allPass,
      auditHash,
      createdAt: ts,
      activationStatus:   'NOT_ACTIVATED',
      networkRequest:     'NOT_SENT',
      openclawWakeCall:   'NOT_SENT',
      openclawAgentCall:  'PROHIBITED',
      tokenAccess:        'SERVER_SIDE_ONLY_NOT_READ',
      executionStatus:    'NOT_EXECUTED',
      dispatchStatus:     'NOT_DISPATCHED',
      browserAutomation:  'DISABLED',
      filesystemWrite:    'DISABLED',
      brokerAction:       'DISABLED',
      note: 'Controlled activation review only. No activation performed. No network request sent.',
    };
    const updated = saveReviewPacket(pkt);
    setPacket(pkt);
    onPacketGenerated(pkt, updated);
  };

  const canGenerate = approved && !!record;

  return (
    <div className="space-y-4 font-mono">
      {/* Decision preview */}
      <div className={`border rounded-sm p-3 space-y-1 ${
        allPass
          ? 'border-primary/30 bg-primary/10'
          : 'border-destructive/30 bg-destructive/10'
      }`}>
        <div className="text-[7px] uppercase text-slate-500 font-bold">Review Decision</div>
        <div className={`text-[10px] font-bold ${allPass ? 'text-primary' : 'text-destructive'}`}>
          {reviewDecision}
        </div>
        <div className="text-[7px] text-slate-400">
          {allPass
            ? 'All review requirements met. Packet can be generated for audit. No activation is performed.'
            : 'One or more requirements not met. Load a valid readiness evidence record to proceed.'}
        </div>
      </div>

      {/* Operator approval */}
      <div className={`border rounded-sm p-3 flex items-start gap-3 ${
        approved ? 'bg-primary/5 border-primary/20' : 'bg-secondary/10 border-border/40'
      }`}>
        <input type="checkbox" id="cwr-operator-approval" checked={approved}
          onChange={e => setApproved(e.target.checked)}
          className="mt-0.5 accent-green-500 w-4 h-4 shrink-0" />
        <label htmlFor="cwr-operator-approval" className="text-[9px] text-slate-300 cursor-pointer leading-relaxed">
          <span className="font-bold text-slate-100">Operator Confirmation — </span>
          I confirm this is a controlled activation review only. No wake call is made. No token is accessed. No execution occurs. This record is for audit planning only.
        </label>
      </div>

      {/* Generate button */}
      <button type="button" onClick={handleGenerate} disabled={!canGenerate}
        className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
        Generate Controlled Wake Review Packet
      </button>

      {!approved && (
        <div className="text-[8px] text-amber-400 font-mono text-center">
          Operator confirmation required before generating review packet.
        </div>
      )}

      {/* Generated packet display */}
      {packet && (
        <div className="border border-primary/20 bg-card rounded-sm overflow-hidden">
          <div className="bg-primary/10 px-4 py-2.5 border-b border-primary/20">
            <span className="text-[9px] font-bold uppercase tracking-widest text-primary">
              Review Packet Generated — NOT_ACTIVATED
            </span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2 text-[8px]">
            {[
              { k: 'reviewId',           v: packet.reviewId,           c: 'text-primary' },
              { k: 'auditHash',          v: packet.auditHash,          c: 'text-amber-400' },
              { k: 'reviewDecision',     v: packet.reviewDecision,     c: packet.allPass ? 'text-primary' : 'text-destructive' },
              { k: 'allPass',            v: String(packet.allPass),    c: packet.allPass ? 'text-primary' : 'text-destructive' },
              { k: 'activationStatus',   v: packet.activationStatus,   c: 'text-destructive font-bold' },
              { k: 'networkRequest',     v: packet.networkRequest,     c: 'text-destructive font-bold' },
              { k: 'openclawWakeCall',   v: packet.openclawWakeCall,   c: 'text-destructive font-bold' },
              { k: 'executionStatus',    v: packet.executionStatus,    c: 'text-destructive font-bold' },
              { k: 'dispatchStatus',     v: packet.dispatchStatus,     c: 'text-destructive font-bold' },
              { k: 'createdAt',          v: packet.createdAt,          c: 'text-slate-300' },
            ].map(({ k, v, c }) => (
              <div key={k} className="bg-secondary/20 border border-border/30 rounded-sm px-2 py-1.5">
                <div className="text-[6px] uppercase text-slate-500 mb-0.5">{k}</div>
                <div className={`font-mono break-all text-[8px] ${c}`}>{v}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3 text-[7px] text-slate-500 italic">
            Saved to localStorage only. No backend write. No execution.
          </div>
        </div>
      )}
    </div>
  );
}