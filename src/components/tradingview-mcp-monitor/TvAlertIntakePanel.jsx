/**
 * TvAlertIntakePanel
 * PHASE_2_ALERT_INTAKE_PREVIEW
 *
 * Receives, parses, validates, and stores TradingView alert payloads locally.
 * NO broker connection. NO order placement. NO trade execution.
 * NO credential access. NO money movement. LOCAL PREVIEW ONLY.
 *
 * executionStatus: NOT_EXECUTED
 * riskClass: SIGNAL_INTAKE_ONLY
 */
import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, ClipboardPaste, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const ACCEPTED_KEY = 'veridanTradingViewAlertIntakeRecords';
const REJECTED_KEY = 'veridanTradingViewAlertRejectedRecords';

const PHASE = 'PHASE_2_ALERT_INTAKE_PREVIEW';
const EXECUTION_STATUS = 'NOT_EXECUTED';
const RISK_CLASS = 'SIGNAL_INTAKE_ONLY';

const BLOCKED_TERMS = [
  'trade', 'order', 'buy market', 'sell market', 'broker', 'login',
  'password', 'credential', 'withdraw', 'deposit', 'transfer',
  'flatten', 'close position',
];

const ALERT_FIELDS = ['symbol', 'timeframe', 'strategyName', 'signalType', 'side', 'price', 'timestamp', 'alertMessage', 'riskProfile'];

const SAFETY_ASSERTIONS = [
  { key: 'no_broker_connection',  label: 'No broker connection' },
  { key: 'no_order_placement',    label: 'No order placement' },
  { key: 'no_trade_execution',    label: 'No trade execution' },
  { key: 'no_credential_access',  label: 'No credential access' },
  { key: 'no_money_movement',     label: 'No money movement' },
  { key: 'local_preview_only',    label: 'Local preview only' },
];

function readStorage(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function writeStorage(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data.slice(0, 200))); } catch {}
}

function makeId() {
  return 'alert-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5);
}

function containsBlockedTerm(text) {
  const lower = text.toLowerCase();
  return BLOCKED_TERMS.find(t => lower.includes(t)) || null;
}

function validatePayload(raw) {
  // Check for blocked terms in the raw string
  const blockedHit = containsBlockedTerm(raw);
  if (blockedHit) {
    return { valid: false, reason: `Blocked term detected: "${blockedHit}"` };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, reason: 'Invalid JSON — could not parse payload.' };
  }

  if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
    return { valid: false, reason: 'Payload must be a JSON object.' };
  }

  // Check each string value for blocked terms
  for (const [k, v] of Object.entries(parsed)) {
    if (typeof v === 'string') {
      const hit = containsBlockedTerm(v);
      if (hit) return { valid: false, reason: `Blocked term in field "${k}": "${hit}"` };
    }
  }

  return { valid: true, reason: null, parsed };
}

function extractFields(parsed) {
  const out = {};
  for (const f of ALERT_FIELDS) {
    out[f] = parsed[f] ?? null;
  }
  return out;
}

const SAMPLE_PAYLOAD = JSON.stringify({
  symbol: 'CME_MINI_DL:MNQH2026',
  timeframe: '240',
  strategyName: 'Veridan-EMA-Cross-v1',
  signalType: 'ENTRY_SIGNAL',
  side: 'LONG',
  price: '21450.25',
  timestamp: new Date().toISOString(),
  alertMessage: 'EMA 9/21 bullish crossover on 4H',
  riskProfile: 'conservative',
}, null, 2);

export default function TvAlertIntakePanel() {
  const [raw,           setRaw]           = useState('');
  const [accepted,      setAccepted]      = useState([]);
  const [rejected,      setRejected]      = useState([]);
  const [lastResult,    setLastResult]    = useState(null);
  const [expanded,      setExpanded]      = useState(false);

  useEffect(() => {
    setAccepted(readStorage(ACCEPTED_KEY));
    setRejected(readStorage(REJECTED_KEY));
  }, []);

  const handleSubmit = () => {
    if (!raw.trim()) return;
    const { valid, reason, parsed } = validatePayload(raw.trim());
    const now = new Date().toISOString();
    const alertId = makeId();

    // Build the extracted fields object (or null if rejected)
    const extractedFields = valid ? extractFields(parsed) : null;

    // Base record — both old shape (validationStatus/alertId) and new shape (id/status)
    // plus ALL signal fields promoted to top level so Phase 3 can read either path.
    const record = {
      // Identity — both conventions so any reader can find them
      id:               alertId,
      alertId,
      receivedAt:       now,
      sourceTimestamp:  extractedFields?.timestamp ?? now,
      // Status — both conventions
      status:           valid ? 'ACCEPTED' : 'REJECTED',
      validationStatus: valid ? 'ACCEPTED' : 'REJECTED',
      // Governance metadata
      phase:            PHASE,
      executionStatus:  EXECUTION_STATUS,
      riskClass:        RISK_CLASS,
      rejectionReason:  reason ?? null,
      rawLength:        raw.trim().length,
      // Nested fields object (original shape)
      fields:           extractedFields,
      // Top-level signal fields promoted for Phase 3 direct access
      symbol:           extractedFields?.symbol      ?? null,
      timeframe:        extractedFields?.timeframe   ?? null,
      signalType:       extractedFields?.signalType  ?? null,
      side:             extractedFields?.side        ?? null,
      price:            extractedFields?.price       ?? null,
      strategyName:     extractedFields?.strategyName  ?? null,
      alertMessage:     extractedFields?.alertMessage  ?? null,
      riskProfile:      extractedFields?.riskProfile   ?? null,
      timestamp:        extractedFields?.timestamp     ?? now,
    };

    if (valid) {
      const updated = [record, ...accepted];
      // Write localStorage FIRST, then update state, then dispatch event
      writeStorage(ACCEPTED_KEY, updated);
      setAccepted(updated);
      try {
        window.dispatchEvent(new CustomEvent('veridanTradingViewAlertRecordsUpdated', {
          detail: {
            sourceKey: ACCEPTED_KEY,
            recordId:  alertId,
            status:    'ACCEPTED',
          },
        }));
      } catch {}
    } else {
      const updated = [record, ...rejected];
      setRejected(updated);
      writeStorage(REJECTED_KEY, updated);
    }

    setLastResult(record);
    setRaw('');
  };

  const clearAll = () => {
    if (!window.confirm('Clear all alert intake records?')) return;
    localStorage.removeItem(ACCEPTED_KEY);
    localStorage.removeItem(REJECTED_KEY);
    setAccepted([]);
    setRejected([]);
    setLastResult(null);
  };

  const latest = accepted[0]?.fields ?? null;
  const total  = accepted.length + rejected.length;

  const inputCls = 'w-full px-3 py-2 bg-secondary/20 border border-border/40 text-foreground text-[9px] font-mono rounded-sm focus:outline-none focus:border-primary/50';
  const labelCls = 'text-[7px] uppercase tracking-widest text-slate-500 font-bold mb-1 block';

  return (
    <div className="bg-card border border-primary/20 rounded-sm overflow-hidden">

      {/* Header */}
      <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/20 flex items-center gap-2">
        <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-[9px] font-bold uppercase text-primary">Phase 2 — TradingView Alert Intake</span>
        <span className="ml-auto text-[7px] font-mono text-destructive font-bold">SIGNAL_INTAKE_ONLY · NOT_EXECUTED</span>
      </div>

      {/* Safety notice */}
      <div className="px-4 py-2 border-b border-border/20 text-[8px] text-slate-500 leading-relaxed">
        <span className="text-amber-400 font-bold">NOT executing trades. NOT connecting to broker. NOT placing orders. NOT accessing credentials. NOT moving money.</span>
        {' '}Receive, parse, validate, and store TradingView alert payloads locally for future governance.
      </div>

      {/* Safety assertions */}
      <div className="px-4 py-2.5 border-b border-border/20 flex flex-wrap gap-3">
        {SAFETY_ASSERTIONS.map(a => (
          <span key={a.key} className="flex items-center gap-1 text-[7px] font-mono text-primary">
            <CheckCircle2 className="w-2.5 h-2.5" /> {a.label}
          </span>
        ))}
      </div>

      {/* Stats strip */}
      <div className="px-4 py-3 border-b border-border/20 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Total Received',   value: total,            cls: 'text-foreground' },
          { label: 'Accepted',         value: accepted.length,  cls: 'text-primary font-bold' },
          { label: 'Rejected',         value: rejected.length,  cls: rejected.length > 0 ? 'text-destructive font-bold' : 'text-slate-400' },
          { label: 'Latest Symbol',    value: latest?.symbol ?? 'N/A', cls: 'text-slate-300 font-mono' },
          { label: 'Latest Timeframe', value: latest?.timeframe ?? 'N/A', cls: 'text-slate-300' },
          { label: 'Latest Signal',    value: latest?.signalType ?? 'N/A', cls: 'text-slate-300' },
          { label: 'Latest Side',      value: latest?.side ?? 'N/A', cls: 'text-slate-300' },
          { label: 'Latest Status',    value: accepted[0]?.validationStatus ?? 'N/A',
            cls: accepted[0]?.validationStatus === 'ACCEPTED' ? 'text-primary font-bold' : 'text-slate-400' },
        ].map(c => (
          <div key={c.label} className="bg-secondary/20 border border-border/20 rounded-sm px-2.5 py-2">
            <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{c.label}</div>
            <div className={`text-[9px] font-mono ${c.cls}`}>{String(c.value)}</div>
          </div>
        ))}
      </div>

      {/* Paste input */}
      <div className="p-4 space-y-3">
        <div>
          <label className={labelCls}>Paste TradingView Alert JSON Payload *</label>
          <textarea
            value={raw}
            onChange={e => setRaw(e.target.value)}
            rows={8}
            placeholder={'{\n  "symbol": "...",\n  "signalType": "ENTRY_SIGNAL",\n  ...\n}'}
            className={inputCls + ' resize-y'}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSubmit} disabled={!raw.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold rounded-sm hover:bg-primary/20 disabled:opacity-40 transition-colors">
            <ClipboardPaste className="w-3 h-3" /> Validate &amp; Intake Alert
          </button>
          <button type="button" onClick={() => setRaw(SAMPLE_PAYLOAD)}
            className="flex items-center gap-1.5 px-3 py-2 border border-border/40 text-slate-400 text-[9px] font-bold rounded-sm hover:bg-secondary/50 transition-colors">
            Load Sample
          </button>
          <button type="button" onClick={() => setRaw('')} disabled={!raw.trim()}
            className="flex items-center gap-1.5 px-3 py-2 border border-border/40 text-slate-400 text-[9px] font-bold rounded-sm hover:bg-secondary/50 disabled:opacity-40 transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* Last validation result */}
      {lastResult && (
        <div className={`mx-4 mb-4 border rounded-sm p-3 space-y-2 ${lastResult.validationStatus === 'ACCEPTED' ? 'border-primary/30 bg-primary/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="flex items-center gap-2">
            {lastResult.validationStatus === 'ACCEPTED'
              ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              : <XCircle className="w-4 h-4 text-destructive shrink-0" />}
            <span className={`text-[10px] font-bold font-mono ${lastResult.validationStatus === 'ACCEPTED' ? 'text-primary' : 'text-destructive'}`}>
              {lastResult.validationStatus}
            </span>
            <span className="ml-auto text-[7px] font-mono text-slate-500">{lastResult.alertId}</span>
          </div>
          {lastResult.rejectionReason && (
            <div className="text-[8px] text-destructive font-mono px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded-sm">
              {lastResult.rejectionReason}
            </div>
          )}
          {lastResult.fields && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ALERT_FIELDS.map(f => (
                <div key={f} className="bg-secondary/20 border border-border/20 rounded-sm px-2 py-1.5">
                  <div className="text-[7px] uppercase text-slate-500 font-bold mb-0.5">{f}</div>
                  <div className="text-[8px] font-mono text-slate-300 break-all">{lastResult.fields[f] ?? 'N/A'}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-[7px] font-mono text-slate-600">
            <span>phase: {lastResult.phase}</span>
            <span>executionStatus: {lastResult.executionStatus}</span>
            <span>riskClass: {lastResult.riskClass}</span>
          </div>
        </div>
      )}

      {/* Phase 2 localStorage debug line */}
      <div className="px-4 py-1.5 border-t border-border/20 bg-secondary/5">
        <div className="text-[6.5px] font-mono text-slate-700">
          debug localStorage key: {ACCEPTED_KEY} ·
          raw: {(() => { try { return (localStorage.getItem(ACCEPTED_KEY) ?? '').length; } catch { return 0; } })()}b ·
          stored: {accepted.length} ·
          latest id: {accepted[0]?.alertId ?? 'none'} ·
          latest symbol: {accepted[0]?.symbol ?? accepted[0]?.fields?.symbol ?? 'none'} ·
          latest side: {accepted[0]?.side ?? accepted[0]?.fields?.side ?? 'none'}
        </div>
      </div>

      {/* Alert history (collapsible) */}
      {(accepted.length > 0 || rejected.length > 0) && (
        <div className="border-t border-border/20">
          <button type="button" onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-[8px] font-bold uppercase text-slate-400 hover:text-slate-200 hover:bg-secondary/20 transition-colors">
            <span>Alert History ({total} records)</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-1.5 max-h-72 overflow-y-auto">
              {[...accepted, ...rejected]
                .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
                .map(r => (
                  <div key={r.alertId} className={`flex items-start gap-2 px-3 py-2 border rounded-sm text-[8px] font-mono ${r.validationStatus === 'ACCEPTED' ? 'border-primary/20 bg-primary/5' : 'border-destructive/20 bg-destructive/5'}`}>
                    {r.validationStatus === 'ACCEPTED'
                      ? <CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                      : <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <span className={`font-bold ${r.validationStatus === 'ACCEPTED' ? 'text-primary' : 'text-destructive'}`}>{r.validationStatus}</span>
                      {r.fields?.symbol && <span className="ml-2 text-slate-300">{r.fields.symbol}</span>}
                      {r.fields?.signalType && <span className="ml-2 text-slate-400">{r.fields.signalType}</span>}
                      {r.rejectionReason && <span className="ml-2 text-destructive/80">{r.rejectionReason}</span>}
                    </div>
                    <span className="text-slate-600 shrink-0">{new Date(r.receivedAt).toLocaleTimeString()}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {(accepted.length > 0 || rejected.length > 0) && (
        <div className="px-4 py-2.5 border-t border-border/20">
          <button type="button" onClick={clearAll}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border/40 text-slate-400 text-[9px] font-bold rounded-sm hover:bg-secondary/50 transition-colors">
            <Trash2 className="w-3 h-3" /> Clear All Alert Records
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border/20 flex items-center gap-2 text-[7px] text-slate-600 font-mono">
        <Shield className="w-2.5 h-2.5 text-primary/40 shrink-0" />
        {PHASE} · {RISK_CLASS} · {EXECUTION_STATUS} · accepted_key: {ACCEPTED_KEY} · rejected_key: {REJECTED_KEY}
      </div>
    </div>
  );
}