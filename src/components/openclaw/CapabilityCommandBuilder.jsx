import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, AlertTriangle, Eye } from 'lucide-react';
import { CAPABILITY_REGISTRY, CAPABILITY_MAP, validateParams, sanitizeParams } from '@/lib/capabilityRegistry';
import { ENTITY_SCOPES } from './ScopeBadge';

const inputCls = "w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

const RISK_COLORS = {
  low:      'text-primary border-primary/40 bg-primary/5',
  medium:   'text-amber-500 border-amber-500/40 bg-amber-500/5',
  high:     'text-orange-500 border-orange-500/40 bg-orange-500/5',
  critical: 'text-destructive border-destructive/40 bg-destructive/5',
};

function ParamInput({ param, value, onChange }) {
  if (param.type === 'select') {
    return (
      <select className={inputCls} value={value ?? param.default ?? ''} onChange={e => onChange(e.target.value)}>
        {param.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (param.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value !== undefined ? value : (param.default ?? false)}
          onChange={e => onChange(e.target.checked)}
          className="w-3.5 h-3.5 accent-green-500"
        />
        <span className="text-[11px] text-muted-foreground font-mono">{value ? 'true' : 'false'}</span>
      </label>
    );
  }
  if (param.type === 'json') {
    return (
      <textarea
        className={`${inputCls} h-20 resize-none`}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder='{"key": "value"}'
      />
    );
  }
  return (
    <input
      type={param.type === 'number' ? 'number' : 'text'}
      className={inputCls}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={param.description}
    />
  );
}

export default function CapabilityCommandBuilder({ currentUser, onSubmit, onCancel, submitting }) {
  const [capabilityId, setCapabilityId]   = useState('');
  const [entityScope, setEntityScope]     = useState('');
  const [params, setParams]               = useState({});
  const [notes, setNotes]                 = useState('');
  const [showPreview, setShowPreview]     = useState(false);
  const [errors, setErrors]               = useState([]);

  const capability = capabilityId ? CAPABILITY_MAP[capabilityId] : null;

  // When capability changes, reset params and auto-select first valid scope
  useEffect(() => {
    setParams({});
    setErrors([]);
    if (capability) {
      const validScopes = ENTITY_SCOPES.filter(s => capability.requiredScopes.includes(s));
      setEntityScope(validScopes[0] || '');
    } else {
      setEntityScope('');
    }
  }, [capabilityId]);

  const setParam = (key, val) => setParams(p => ({ ...p, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!capability) return;
    const errs = validateParams(capability, params);
    if (!entityScope) errs.push('Entity scope is required.');
    if (capability.requiredScopes.length > 0 && !capability.requiredScopes.includes(entityScope)) {
      errs.push(`Scope '${entityScope}' is not permitted for this capability.`);
    }
    if (capability.riskLevel === 'high') {
      errs.push('HIGH risk capabilities are blocked pending policy review.');
    }
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    // Build command payload
    const sanitized = sanitizeParams(params);
    const commandText = capability.id;
    const payload = {
      commandText,
      capabilityId: capability.id,
      capabilityName: capability.name,
      riskLevel: capability.riskLevel,
      entityScope,
      notes,
      requestedBy: currentUser?.email || 'unknown',
      target: 'OpenClaw Gateway',
      status: 'pending',
      parameters: sanitized,
      auditLog: [{
        eventType: 'OPENCLAW_COMMAND_REQUESTED',
        capabilityId: capability.id,
        parameters: sanitized,
        timestamp: new Date().toISOString(),
        requestedBy: currentUser?.email,
      }],
    };
    onSubmit(payload);
  };

  const previewPayload = capability ? {
    capabilityId: capability.id,
    commandText: capability.id,
    entityScope,
    riskLevel: capability.riskLevel,
    parameters: sanitizeParams(params),
  } : null;

  const validScopes = capability
    ? ENTITY_SCOPES.filter(s => capability.requiredScopes.includes(s))
    : ENTITY_SCOPES;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Capability Selector */}
      <div>
        <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">
          Capability<span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <select
            className={`${inputCls} pr-8 appearance-none`}
            value={capabilityId}
            onChange={e => setCapabilityId(e.target.value)}
            required
          >
            <option value="">— Select a capability —</option>
            {CAPABILITY_REGISTRY.map(c => (
              <option key={c.id} value={c.id} disabled={c.riskLevel === 'high'}>
                {c.name} ({c.id}) {c.riskLevel === 'high' ? '· BLOCKED' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Capability Info + Risk Badge */}
      {capability && (
        <div className="bg-secondary/30 border border-border px-3 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] text-foreground">{capability.description}</div>
            <span className={`shrink-0 px-2 py-0.5 border text-[9px] uppercase tracking-wider font-semibold ${RISK_COLORS[capability.riskLevel]}`}>
              {capability.riskLevel} risk
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
            <span>Type: <span className="text-foreground">{capability.commandType}</span></span>
            <span>·</span>
            <span>Scopes: <span className="text-foreground">{capability.requiredScopes.join(', ') || 'none'}</span></span>
          </div>
        </div>
      )}

      {/* Entity Scope */}
      {capability && (
        <div>
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">
            Entity Scope<span className="text-destructive">*</span>
          </label>
          {validScopes.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/30 text-[11px] text-destructive">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              No scopes authorized for this capability.
            </div>
          ) : (
            <select
              className={inputCls}
              value={entityScope}
              onChange={e => setEntityScope(e.target.value)}
              required
            >
              {validScopes.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Dynamic Parameter Inputs */}
      {capability && capability.parameters.length > 0 && (
        <div className="space-y-3">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Parameters</div>
          {capability.parameters.map(p => (
            <div key={p.key}>
              <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">
                {p.label}{p.required && <span className="text-destructive">*</span>}
              </label>
              <ParamInput param={p} value={params[p.key]} onChange={val => setParam(p.key, val)} />
              <div className="mt-0.5 text-[9px] text-muted-foreground/40">{p.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {capability && (
        <div>
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Notes</label>
          <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional governance context..." />
        </div>
      )}

      {/* Payload Preview */}
      {capability && (
        <div>
          <button
            type="button"
            onClick={() => setShowPreview(v => !v)}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
          >
            <Eye className="w-3 h-3" /> {showPreview ? 'Hide' : 'Show'} payload preview
          </button>
          {showPreview && previewPayload && (
            <pre className="mt-2 px-3 py-2 bg-background border border-border text-[10px] text-muted-foreground overflow-auto max-h-40">
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-destructive">
              <AlertTriangle className="w-3 h-3 shrink-0" /> {e}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !capability || validScopes.length === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
          Submit for Governance Review
        </button>
      </div>
    </form>
  );
}