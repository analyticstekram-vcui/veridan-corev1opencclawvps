import React from 'react';
import { Trash2, GripVertical, ChevronDown } from 'lucide-react';
import { CAPABILITY_REGISTRY, CAPABILITY_MAP } from '@/lib/capabilityRegistry';
import { ENTITY_SCOPES } from '../ScopeBadge';

const inputCls = "w-full px-2 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

const RISK_COLORS = {
  low: 'text-primary', medium: 'text-amber-500', high: 'text-orange-500', critical: 'text-destructive',
};

export default function WorkflowStepBuilder({ step, index, allSteps, onChange, onRemove }) {
  const cap = step.capabilityId ? CAPABILITY_MAP[step.capabilityId] : null;
  const validScopes = cap ? ENTITY_SCOPES.filter(s => cap.requiredScopes.includes(s)) : ENTITY_SCOPES;
  const prevStepIds = allSteps.slice(0, index).map(s => s.stepId).filter(Boolean);

  const set = (key, val) => onChange({ ...step, [key]: val });
  const setParam = (key, val) => onChange({ ...step, params: { ...step.params, [key]: val } });

  const handleCapChange = (capId) => {
    const newCap = CAPABILITY_MAP[capId];
    const firstScope = newCap ? (ENTITY_SCOPES.find(s => newCap.requiredScopes.includes(s)) || '') : '';
    onChange({ ...step, capabilityId: capId, riskLevel: newCap?.riskLevel || 'medium', entityScope: firstScope, params: {} });
  };

  return (
    <div className="bg-card border border-border font-mono">
      {/* Step Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-secondary/20">
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 shrink-0" />
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Step {index + 1}</span>
        {cap && <span className={`ml-auto text-[9px] font-semibold uppercase ${RISK_COLORS[cap.riskLevel]}`}>{cap.riskLevel} risk</span>}
        <button onClick={onRemove} className="text-muted-foreground/40 hover:text-destructive transition-colors">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Step ID */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Step ID<span className="text-destructive">*</span></label>
            <input className={inputCls} value={step.stepId || ''} onChange={e => set('stepId', e.target.value)} placeholder="e.g. open_browser" />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">On Failure</label>
            <div className="relative">
              <select className={`${inputCls} appearance-none pr-6`} value={step.onFailure || 'STOP'} onChange={e => set('onFailure', e.target.value)}>
                <option value="STOP">STOP</option>
                <option value="CONTINUE">CONTINUE</option>
                <option value="ROLLBACK">ROLLBACK</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Capability */}
        <div>
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Capability<span className="text-destructive">*</span></label>
          <div className="relative">
            <select className={`${inputCls} appearance-none pr-6`} value={step.capabilityId || ''} onChange={e => handleCapChange(e.target.value)} required>
              <option value="">— Select capability —</option>
              {CAPABILITY_REGISTRY.map(c => (
                <option key={c.id} value={c.id} disabled={c.riskLevel === 'high'}>
                  {c.name} ({c.id}){c.riskLevel === 'high' ? ' · BLOCKED' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
          {cap && <div className="mt-0.5 text-[9px] text-muted-foreground/40">{cap.description}</div>}
        </div>

        {/* Scope + Timeout */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Entity Scope<span className="text-destructive">*</span></label>
            <select className={inputCls} value={step.entityScope || ''} onChange={e => set('entityScope', e.target.value)}>
              {validScopes.length === 0
                ? <option value="">No scopes available</option>
                : validScopes.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)
              }
            </select>
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Timeout (ms)</label>
            <input type="number" className={inputCls} value={step.timeoutMs || 5000} onChange={e => set('timeoutMs', Number(e.target.value))} min={500} max={30000} />
          </div>
        </div>

        {/* dependsOn */}
        {prevStepIds.length > 0 && (
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Depends On</label>
            <div className="flex flex-wrap gap-1.5">
              {prevStepIds.map(sid => {
                const checked = (step.dependsOn || []).includes(sid);
                return (
                  <label key={sid} className="flex items-center gap-1 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground">
                    <input type="checkbox" checked={checked} className="w-3 h-3 accent-green-500"
                      onChange={e => {
                        const deps = step.dependsOn || [];
                        set('dependsOn', e.target.checked ? [...deps, sid] : deps.filter(d => d !== sid));
                      }}
                    />
                    {sid}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Params */}
        {cap && cap.parameters.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Parameters</div>
            {cap.parameters.map(p => (
              <div key={p.key}>
                <label className="text-[9px] text-muted-foreground/50 block mb-0.5">{p.label}{p.required && <span className="text-destructive">*</span>}</label>
                {p.type === 'select'
                  ? <select className={inputCls} value={step.params?.[p.key] ?? (p.default || '')} onChange={e => setParam(p.key, e.target.value)}>
                      {p.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  : p.type === 'boolean'
                  ? <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={step.params?.[p.key] ?? (p.default ?? false)} onChange={e => setParam(p.key, e.target.checked)} className="w-3.5 h-3.5 accent-green-500" />
                      <span className="text-[11px] text-muted-foreground">{step.params?.[p.key] ? 'true' : 'false'}</span>
                    </label>
                  : p.type === 'json'
                  ? <textarea className={`${inputCls} h-16 resize-none`} value={step.params?.[p.key] || ''} onChange={e => setParam(p.key, e.target.value)} placeholder='{"key":"value"}' />
                  : <input type={p.type === 'number' ? 'number' : 'text'} className={inputCls} value={step.params?.[p.key] ?? ''} onChange={e => setParam(p.key, e.target.value)} placeholder={p.description} />
                }
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}