import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Terminal, AlertCircle, Shield, Lock } from 'lucide-react';

const COMMAND_TYPES = ['READ_ONLY', 'INSPECT', 'SUMMARIZE'];

const RISK_TIERS = {
  READ_ONLY: { tier: 'LOW', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  INSPECT:   { tier: 'LOW', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
  SUMMARIZE: { tier: 'LOW', color: 'text-primary', bg: 'bg-primary/10 border-primary/30' },
};

export default function CRSafeCommandTab() {
  const [url, setUrl] = useState('');
  const [commandType, setCommandType] = useState('READ_ONLY');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [auditPreview, setAuditPreview] = useState(null);

  const risk = RISK_TIERS[commandType];

  const handleTest = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setAuditPreview(null);

    const auditEvent = {
      commandType,
      targetUrl: url,
      riskTier: risk.tier,
      requestedAt: new Date().toISOString(),
      approvalRequired: true,
      status: 'PREVIEW_ONLY',
      note: 'No live execution. Dry-run preview only.',
    };
    setAuditPreview(auditEvent);

    try {
      const res = await base44.functions.invoke('openclawBridgePreview', {
        commandType,
        targetUrl: url,
        riskTier: risk.tier,
      });
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.message, status: 'failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-2">
        <Terminal className="w-4 h-4 text-primary" />
        <h2 className="text-[13px] font-semibold text-foreground">Safe Command Test</h2>
      </div>

      {/* Approval Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/30 rounded-lg">
        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-[9px] text-amber-500/90">
          <div className="font-bold mb-0.5">APPROVAL REQUIRED</div>
          Commands are preview-only. No real execution occurs. All requests are logged to the audit trail. Approval does not trigger execution.
        </div>
      </div>

      <form onSubmit={handleTest} className="space-y-4 bg-card border border-border rounded-lg p-5">
        {/* URL Input */}
        <div>
          <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Target URL</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-background border border-border px-3 py-2 text-[11px] font-mono text-foreground placeholder:text-slate-500 outline-none focus:border-primary/50 rounded"
          />
        </div>

        {/* Command Type */}
        <div>
          <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">Command Type</label>
          <div className="flex gap-2 flex-wrap">
            {COMMAND_TYPES.map(ct => (
              <button
                key={ct}
                type="button"
                onClick={() => setCommandType(ct)}
                className={`px-3 py-1.5 text-[10px] border rounded font-semibold transition-colors ${
                  commandType === ct
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-slate-400 hover:bg-secondary/50'
                }`}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        {/* Risk Tier Display */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded text-[9px] font-bold ${risk.color} ${risk.bg}`}>
            <Shield className="w-3 h-3" />
            Risk Tier: {risk.tier}
          </div>
          <span className="text-[9px] text-slate-400">Read-only commands only. Mutations are blocked.</span>
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-5 py-2 bg-primary text-primary-foreground text-[10px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 rounded"
        >
          {loading ? 'Requesting Preview…' : 'Request Preview (No Execution)'}
        </button>
      </form>

      {/* Audit Event Preview */}
      {auditPreview && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Audit Event Preview</div>
          <pre className="text-[9px] font-mono text-slate-300 bg-background border border-border/50 rounded p-3 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(auditPreview, null, 2)}
          </pre>
        </div>
      )}

      {/* Result Panel */}
      {result && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold mb-2">Preview Result</div>
          {result.error ? (
            <div className="flex items-start gap-2 text-destructive text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {result.error}
            </div>
          ) : (
            <pre className="text-[9px] font-mono text-slate-300 bg-background border border-border/50 rounded p-3 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}