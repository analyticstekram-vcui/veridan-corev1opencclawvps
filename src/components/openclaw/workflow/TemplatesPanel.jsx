import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { BookMarked, Plus, ShieldCheck, Loader2, RefreshCw, Tag, ChevronDown, ChevronRight, Copy } from 'lucide-react';

const ALL_TAGS = ['monitoring', 'data', 'browser', 'security', 'ops'];

const TAG_COLORS = {
  monitoring: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  data:       'text-purple-400 border-purple-400/30 bg-purple-400/5',
  browser:    'text-amber-500 border-amber-500/30 bg-amber-500/5',
  security:   'text-destructive border-destructive/30 bg-destructive/5',
  ops:        'text-primary border-primary/30 bg-primary/5',
};

const STATUS_COLORS = {
  draft:             'text-muted-foreground border-border',
  pending_promotion: 'text-amber-500 border-amber-500/40 bg-amber-500/5',
  production:        'text-primary border-primary/40 bg-primary/5',
};

async function sha256(obj) {
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function appendAudit(template, eventType, extra = {}) {
  const log = Array.isArray(template.auditLog) ? [...template.auditLog] : [];
  const prevHash = log.length > 0 ? (log[log.length - 1].hash || 'genesis') : 'genesis';
  const entry = { eventType, ...extra, prevHash, timestamp: new Date().toISOString() };
  entry.hash = await sha256(entry);
  return [...log, entry];
}

// ── Save-as-Template modal ─────────────────────────────────────────────────
function SaveTemplateModal({ workflow, currentUser, onSaved, onClose }) {
  const [name, setName]         = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [tags, setTags]         = useState([]);
  const [saving, setSaving]     = useState(false);

  const toggleTag = t => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const auditLog = await appendAudit({ auditLog: [] }, 'OPENCLAW_TEMPLATE_CREATED', {
      createdBy: currentUser?.email,
      sourceWorkflowId: workflow?.id,
      tags,
    });
    await base44.entities.OpenClawWorkflowTemplate.create({
      name: name.trim(),
      description: description.trim(),
      tags,
      steps: workflow?.steps || [],
      version: 1,
      status: 'draft',
      createdBy: currentUser?.email || 'unknown',
      sourceWorkflowId: workflow?.id || null,
      auditLog,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border w-full max-w-sm font-mono">
        <div className="px-5 py-3 border-b border-border flex items-center gap-2">
          <BookMarked className="w-3.5 h-3.5 text-primary" />
          <span className="text-[12px] font-semibold">Save as Template</span>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Template Name<span className="text-destructive">*</span></label>
            <input className="w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Description</label>
            <input className="w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground outline-none focus:border-primary/50 transition-colors" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_TAGS.map(t => (
                <button key={t} type="button" onClick={() => toggleTag(t)}
                  className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider transition-colors ${tags.includes(t) ? TAG_COLORS[t] : 'border-border text-muted-foreground/40 hover:text-foreground hover:border-border/80'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground/50">
            Steps: <span className="text-foreground">{workflow?.steps?.length || 0}</span> · Version: <span className="text-foreground">1</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button onClick={onClose} className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Template Card ──────────────────────────────────────────────────────────
function TemplateCard({ template, currentUser, onRefresh, onInstantiate }) {
  const [expanded, setExpanded]   = useState(false);
  const [promoting, setPromoting] = useState(false);

  const handlePromote = async () => {
    setPromoting(true);
    const auditLog = await appendAudit(template, 'OPENCLAW_TEMPLATE_PROMOTED', {
      promotedBy: currentUser?.email,
      fromStatus: template.status,
    });
    await base44.entities.OpenClawWorkflowTemplate.update(template.id, {
      status: 'production',
      promotedBy: currentUser?.email,
      auditLog,
    });
    setPromoting(false);
    onRefresh();
  };

  const handleRequestPromotion = async () => {
    setPromoting(true);
    const auditLog = await appendAudit(template, 'OPENCLAW_TEMPLATE_PROMOTION_REQUESTED', {
      requestedBy: currentUser?.email,
    });
    await base44.entities.OpenClawWorkflowTemplate.update(template.id, {
      status: 'pending_promotion',
      auditLog,
    });
    setPromoting(false);
    onRefresh();
  };

  return (
    <div className="bg-card border border-border font-mono">
      <div className="flex items-center gap-3 px-4 py-3">
        <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-semibold text-foreground truncate">{template.name}</span>
            <span className="text-[9px] text-muted-foreground/40">v{template.version}</span>
            {(template.tags || []).map(t => (
              <span key={t} className={`px-1.5 py-0.5 border text-[9px] uppercase tracking-wider ${TAG_COLORS[t] || 'text-muted-foreground border-border'}`}>{t}</span>
            ))}
          </div>
          {template.description && <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{template.description}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground/50">{template.steps?.length || 0} steps</span>
          <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${STATUS_COLORS[template.status] || ''}`}>
            {template.status?.replace('_', ' ')}
          </span>
          {/* Instantiate from template */}
          <button onClick={() => onInstantiate(template)} className="flex items-center gap-1 px-2.5 py-1 border border-border text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary/50 transition-colors" title="Use template">
            <Copy className="w-3 h-3" /> Use
          </button>
          {/* Promote actions */}
          {template.status === 'draft' && (
            <button onClick={handleRequestPromotion} disabled={promoting} className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] hover:bg-amber-500/20 transition-colors disabled:opacity-50">
              {promoting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />} Promote
            </button>
          )}
          {template.status === 'pending_promotion' && (
            <button onClick={handlePromote} disabled={promoting} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] hover:bg-primary/20 transition-colors disabled:opacity-50">
              {promoting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />} Approve Promotion
            </button>
          )}
        </div>
      </div>

      {/* Expanded: step list + audit */}
      {expanded && (
        <div className="border-t border-border/50 px-4 py-3 space-y-2">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">Steps</div>
          {(template.steps || []).map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-[10px] text-muted-foreground/70 px-2 py-1 bg-secondary/20 border border-border/40">
              <span className="text-muted-foreground/30">#{i + 1}</span>
              <code className="text-foreground">{step.capabilityId}</code>
              <span className="text-muted-foreground/40">·</span>
              <span>{step.stepId}</span>
              <span className="ml-auto text-muted-foreground/30">{step.entityScope}</span>
            </div>
          ))}
          {template.auditLog?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-1">Audit Log</div>
              {template.auditLog.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[9px] text-muted-foreground/50 py-0.5">
                  <span className="text-muted-foreground/30">{e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</span>
                  <span className="text-foreground/70">{e.eventType}</span>
                  {e.promotedBy && <span>· {e.promotedBy}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main TemplatesPanel ────────────────────────────────────────────────────
export default function TemplatesPanel({ currentUser, onInstantiate }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tagFilter, setTagFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.OpenClawWorkflowTemplate.list('-created_date', 100);
    setTemplates(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const visible = templates.filter(t => {
    const tagOk    = tagFilter === 'all' || (t.tags || []).includes(tagFilter);
    const statusOk = statusFilter === 'all' || t.status === statusFilter;
    return tagOk && statusOk;
  });

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-2 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <BookMarked className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] text-foreground font-semibold">Workflow Templates</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {/* Tag filter */}
          <select className="px-2 py-1 bg-secondary/50 border border-border text-[10px] font-mono text-muted-foreground outline-none focus:border-primary/50"
            value={tagFilter} onChange={e => setTagFilter(e.target.value)}>
            <option value="all">All Tags</option>
            {ALL_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {/* Status filter */}
          <select className="px-2 py-1 bg-secondary/50 border border-border text-[10px] font-mono text-muted-foreground outline-none focus:border-primary/50"
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_promotion">Pending Promotion</option>
            <option value="production">Production</option>
          </select>
          <button onClick={fetchTemplates} className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
            <BookMarked className="w-6 h-6 text-muted-foreground/20" />
            <div className="text-[11px] text-muted-foreground/40">No templates yet. Save a completed workflow as a template.</div>
          </div>
        ) : (
          visible.map(t => (
            <TemplateCard key={t.id} template={t} currentUser={currentUser} onRefresh={fetchTemplates} onInstantiate={onInstantiate} />
          ))
        )}
      </div>
    </div>
  );
}

export { SaveTemplateModal };