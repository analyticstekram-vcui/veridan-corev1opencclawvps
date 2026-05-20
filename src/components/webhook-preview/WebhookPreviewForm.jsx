/**
 * WebhookPreviewForm
 * Operator-facing form to generate a payload preview only.
 * Does NOT send any network request.
 * Does NOT write files.
 * Does NOT call OpenClaw, Obsidian, Gmail, TradingView, or any execution route.
 */

import React, { useState, useCallback } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';
import { CONTRACT_REGISTRY, RISK_COLORS } from './webhookContracts';

function generatePreviewHash(payload) {
  const str = JSON.stringify(payload);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return `PREV-${Math.abs(h).toString(16).toUpperCase().padStart(8, '0')}`;
}

export default function WebhookPreviewForm({ onGenerated }) {
  const [selectedType, setSelectedType] = useState('');
  const [sampleFields, setSampleFields] = useState('');
  const [copied, setCopied] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const contract = CONTRACT_REGISTRY.find(c => c.eventType === selectedType);

  const handleGenerate = useCallback(() => {
    setError(null);
    if (!contract) { setError('Select an event type first.'); return; }

    let extraFields = {};
    if (sampleFields.trim()) {
      try { extraFields = JSON.parse(sampleFields); } catch { setError('Sample fields must be valid JSON.'); return; }
    }

    const payload = {
      ...contract.samplePayload,
      ...extraFields,
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus: 'NOT_DISPATCHED',
    };

    const packet = {
      previewId:    `WHPREV-${Date.now().toString(36).toUpperCase()}`,
      eventType:    contract.eventType,
      description:  contract.description,
      riskLevel:    contract.riskLevel,
      allowedRoute: contract.allowedRoute,
      destinationSystem: contract.destinationSystem,
      approvalState: contract.approvalState,
      payload,
      previewHash:  generatePreviewHash(payload),
      auditHash:    generatePreviewHash({ ...payload, ts: Date.now() }),
      executionStatus: 'NOT_EXECUTED',
      dispatchStatus:  'NOT_DISPATCHED',
      previewMode:  'PREVIEW_ONLY',
      networkRequest: 'NOT_SENT',
      filesystemWrite: 'DISABLED',
      openClawDispatch: 'DISABLED',
      externalWebhookExposure: 'DISABLED',
      agentApiUsage: 'DISABLED',
      nextStepRecommendation: contract.nextStepRecommendation,
      createdAt: new Date().toISOString(),
    };

    setPreview(packet);
    onGenerated(packet);
  }, [contract, sampleFields, onGenerated]);

  const handleCopy = () => {
    if (!preview) return;
    navigator.clipboard.writeText(JSON.stringify(preview, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const risk = contract ? RISK_COLORS[contract.riskLevel] : null;

  return (
    <div className="bg-card border border-border/40 rounded-sm overflow-hidden font-mono space-y-0">
      <div className="bg-secondary/20 px-4 py-2.5 border-b border-border/30">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Payload Preview Generator</div>
        <div className="text-[7px] text-slate-500 mt-0.5">No network request · No file write · No dispatch · Preview only</div>
      </div>

      <div className="p-4 space-y-3">
        {/* Event type selector */}
        <div className="space-y-1">
          <div className="text-[7px] uppercase text-slate-500 font-bold">Event Type</div>
          <select
            value={selectedType}
            onChange={e => { setSelectedType(e.target.value); setPreview(null); setError(null); }}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[10px] font-mono text-slate-200 focus:outline-none focus:border-primary/40"
          >
            <option value="">— Select event type —</option>
            {CONTRACT_REGISTRY.map(c => (
              <option key={c.eventType} value={c.eventType}>{c.eventType}</option>
            ))}
          </select>
        </div>

        {/* Contract summary */}
        {contract && (
          <div className={`border rounded-sm px-3 py-2 text-[8px] space-y-0.5 ${risk.border} ${risk.bg}`}>
            <div className={`font-bold ${risk.text}`}>{contract.riskLevel} RISK — {contract.destinationSystem}</div>
            <div className="text-slate-400">{contract.description}</div>
            <div className="text-slate-500">Route: <span className="text-primary/80">{contract.allowedRoute}</span></div>
          </div>
        )}

        {/* Optional extra fields */}
        <div className="space-y-1">
          <div className="text-[7px] uppercase text-slate-500 font-bold">Additional Sample Fields (JSON, optional)</div>
          <textarea
            value={sampleFields}
            onChange={e => setSampleFields(e.target.value)}
            placeholder={'{ "sampleField": "value" }'}
            rows={3}
            className="w-full bg-secondary/30 border border-border/40 rounded-sm px-3 py-2 text-[9px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-primary/40 resize-y"
          />
          <div className="text-[7px] text-slate-600">Safe metadata only · No tokens, passwords, or secrets</div>
        </div>

        {error && <div className="text-[8px] text-destructive font-mono">{error}</div>}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!selectedType}
          className="w-full py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold uppercase tracking-widest rounded-sm hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Generate Preview Packet (No Dispatch)
        </button>

        {/* Preview output */}
        {preview && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[7px] uppercase text-slate-500 font-bold">Generated Preview Packet</div>
              <button type="button" onClick={handleCopy} className="flex items-center gap-1 text-[7px] text-slate-400 hover:text-slate-200">
                <Copy className="w-3 h-3" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="flex gap-3 text-[8px] font-mono">
              <div><span className="text-slate-500">previewHash: </span><span className="text-amber-400">{preview.previewHash}</span></div>
              <div><span className="text-slate-500">auditHash: </span><span className="text-amber-400">{preview.auditHash}</span></div>
            </div>
            <pre className="bg-secondary/30 border border-border/40 rounded-sm p-3 text-[8px] font-mono text-slate-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
              {JSON.stringify(preview.payload, null, 2)}
            </pre>
            <div className="text-[7px] text-slate-600 font-mono">
              networkRequest: NOT_SENT · filesystemWrite: DISABLED · openClawDispatch: DISABLED · externalWebhookExposure: DISABLED
            </div>
          </div>
        )}
      </div>
    </div>
  );
}