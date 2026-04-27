import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Server, Plus, RefreshCw, Trash2, Loader2, Activity, Wifi, WifiOff, AlertTriangle, X } from 'lucide-react';
import { CAPABILITY_REGISTRY } from '@/lib/capabilityRegistry';

const HEALTH_CONFIG = {
  healthy:  { color: 'text-primary',          bg: 'bg-primary/10 border-primary/30',            dot: 'bg-primary',      label: 'HEALTHY'  },
  degraded: { color: 'text-amber-500',         bg: 'bg-amber-500/10 border-amber-500/30',         dot: 'bg-amber-500',    label: 'DEGRADED' },
  offline:  { color: 'text-destructive',       bg: 'bg-destructive/10 border-destructive/30',     dot: 'bg-destructive',  label: 'OFFLINE'  },
  unknown:  { color: 'text-muted-foreground',  bg: 'bg-secondary/50 border-border',               dot: 'bg-muted-foreground/40', label: 'UNKNOWN'  },
};

const SCOPE_OPTIONS = ['vcm', 'gfm_admin', 'genesis_trust'];
const CAP_IDS = (CAPABILITY_REGISTRY || []).map(c => c.id);

const inputCls = "w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

// ── Add Node Form ─────────────────────────────────────────────────────────
function AddNodeForm({ onAdded, onCancel }) {
  const [form, setForm] = useState({ nodeId: '', url: '', capabilities: [], scopes: [], notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleCap = (c) => set('capabilities', form.capabilities.includes(c) ? form.capabilities.filter(x => x !== c) : [...form.capabilities, c]);
  const toggleScope = (s) => set('scopes', form.scopes.includes(s) ? form.scopes.filter(x => x !== s) : [...form.scopes, s]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nodeId.trim() || !form.url.trim()) { setError('Node ID and URL are required.'); return; }
    setSubmitting(true);
    setError(null);
    const res = await base44.functions.invoke('openclawNodeRegistry', { action: 'add', ...form });
    setSubmitting(false);
    if (res.data?.success) onAdded();
    else setError(res.data?.error || 'Failed to add node');
  };

  return (
    <div className="bg-card border border-border p-4 space-y-3 font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">Add Node</span>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Node ID<span className="text-destructive">*</span></label>
          <input className={inputCls} value={form.nodeId} onChange={e => set('nodeId', e.target.value)} placeholder="node-us-east-1" />
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">URL<span className="text-destructive">*</span></label>
          <input className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://node.example.com" />
        </div>
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Capabilities</label>
        <div className="flex flex-wrap gap-1.5">
          {CAP_IDS.map(c => (
            <button key={c} type="button" onClick={() => toggleCap(c)}
              className={`px-2 py-0.5 border text-[9px] font-mono transition-colors ${form.capabilities.includes(c) ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground/50 hover:text-foreground'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Scopes</label>
        <div className="flex gap-2">
          {SCOPE_OPTIONS.map(s => (
            <button key={s} type="button" onClick={() => toggleScope(s)}
              className={`px-2 py-0.5 border text-[9px] font-mono transition-colors ${form.scopes.includes(s) ? 'border-accent text-accent bg-accent/10' : 'border-border text-muted-foreground/50 hover:text-foreground'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Notes</label>
        <input className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional description" />
      </div>
      {error && <div className="text-[11px] text-destructive flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />{error}</div>}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
        <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50">
          {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Add Node
        </button>
      </div>
    </div>
  );
}

// ── Node Card ──────────────────────────────────────────────────────────────
function NodeCard({ node, onHealthCheck, onRemove, checking }) {
  const cfg = HEALTH_CONFIG[node.health] || HEALTH_CONFIG.unknown;

  return (
    <div className="bg-card border border-border font-mono">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot} ${node.health === 'healthy' ? 'animate-pulse' : ''}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-foreground">{node.nodeId}</span>
            <span className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
          </div>
          <div className="text-[10px] text-muted-foreground/50 truncate mt-0.5">{node.url}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => onHealthCheck(node)} disabled={checking}
            className="flex items-center gap-1 px-2 py-1 border border-border text-[9px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-40">
            {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />} Ping
          </button>
          <button onClick={() => onRemove(node)} className="p-1 border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-4 divide-x divide-border/50 border-b border-border/50">
        {[
          { label: 'Latency', value: node.latencyMs != null ? `${node.latencyMs}ms` : '—', alert: (node.latencyMs ?? 0) > 400 },
          { label: 'Error Rate', value: node.errorRate != null ? `${(node.errorRate * 100).toFixed(1)}%` : '—', alert: (node.errorRate ?? 0) > 0.1 },
          { label: 'Requests', value: node.requestCount ?? 0, alert: false },
          { label: 'Last Check', value: node.lastHealthCheck ? new Date(node.lastHealthCheck).toLocaleTimeString() : '—', alert: false },
        ].map(({ label, value, alert }) => (
          <div key={label} className="px-3 py-2">
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">{label}</div>
            <div className={`text-[11px] font-semibold ${alert ? 'text-amber-500' : 'text-foreground'}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Capabilities + Scopes */}
      <div className="px-4 py-2.5 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Caps:</span>
          {(node.capabilities || []).length === 0
            ? <span className="text-[9px] text-muted-foreground/30">none</span>
            : (node.capabilities || []).map(c => (
                <code key={c} className="text-[9px] px-1.5 py-0.5 bg-secondary/50 border border-border text-muted-foreground">{c}</code>
              ))
          }
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/40">Scopes:</span>
          {(node.scopes || []).length === 0
            ? <span className="text-[9px] text-muted-foreground/30">none</span>
            : (node.scopes || []).map(s => (
                <span key={s} className="text-[9px] px-1.5 py-0.5 border border-border text-accent">{s}</span>
              ))
          }
        </div>
        {node.notes && <span className="text-[9px] text-muted-foreground/40 italic">{node.notes}</span>}
      </div>
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────
export default function NodeRegistryPanel() {
  const [nodes, setNodes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [checking, setChecking]   = useState({});
  const [showForm, setShowForm]   = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    const res = await base44.functions.invoke('openclawNodeRegistry', { action: 'list' });
    setNodes(res.data?.nodes || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const handleHealthCheck = async (node) => {
    setChecking(p => ({ ...p, [node.id]: true }));
    await base44.functions.invoke('openclawNodeRegistry', { action: 'health_check', id: node.id });
    setChecking(p => ({ ...p, [node.id]: false }));
    fetchNodes();
  };

  const handleCheckAll = async () => {
    setCheckingAll(true);
    await base44.functions.invoke('openclawNodeRegistry', { action: 'health_check' });
    setCheckingAll(false);
    fetchNodes();
  };

  const handleRemove = async (node) => {
    await base44.functions.invoke('openclawNodeRegistry', { action: 'remove', id: node.id });
    fetchNodes();
  };

  const healthCounts = {
    healthy:  nodes.filter(n => n.health === 'healthy').length,
    degraded: nodes.filter(n => n.health === 'degraded').length,
    offline:  nodes.filter(n => n.health === 'offline').length,
    unknown:  nodes.filter(n => n.health === 'unknown').length,
  };

  return (
    <div className="p-5 space-y-4 font-mono max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">OpenClaw Node Registry</div>
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-primary" />
            <span className="text-[12px] font-semibold text-foreground">{nodes.length} node{nodes.length !== 1 ? 's' : ''} registered</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheckAll} disabled={checkingAll || nodes.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-40">
            {checkingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Ping All
          </button>
          <button onClick={fetchNodes} className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors">
            <Plus className="w-3 h-3" /> Add Node
          </button>
        </div>
      </div>

      {/* Health summary strip */}
      {nodes.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(healthCounts).map(([k, count]) => {
            const cfg = HEALTH_CONFIG[k];
            return (
              <div key={k} className={`flex items-center gap-2 px-3 py-2 border ${cfg.bg}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className={`text-[10px] font-semibold ${cfg.color}`}>{count}</span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">{k}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Form */}
      {showForm && <AddNodeForm onAdded={() => { setShowForm(false); fetchNodes(); }} onCancel={() => setShowForm(false)} />}

      {/* Node list */}
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
      ) : nodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-3 border border-border bg-card">
          <Server className="w-8 h-8 text-muted-foreground/20" />
          <div className="text-[11px] text-muted-foreground/40">No nodes registered. Add a node to begin routing.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {nodes.map(node => (
            <NodeCard
              key={node.id}
              node={node}
              onHealthCheck={handleHealthCheck}
              onRemove={handleRemove}
              checking={!!checking[node.id]}
            />
          ))}
        </div>
      )}

      <div className="text-[9px] text-muted-foreground/30 text-center uppercase tracking-widest">
        Routing: capability match → node health → latency · Events: OPENCLAW_NODE_ADDED · OPENCLAW_NODE_HEALTH_CHANGED
      </div>
    </div>
  );
}