import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Play, ThumbsUp, Loader2, RefreshCw, ChevronDown, ChevronRight, BookMarked } from 'lucide-react';
import WorkflowBuilder from './workflow/WorkflowBuilder';
import WorkflowExecutionView from './workflow/WorkflowExecutionView';
import TemplatesPanel, { SaveTemplateModal } from './workflow/TemplatesPanel';
import ProposalsPanel from './ProposalsPanel';

const STATUS_COLORS = {
  draft:            'text-muted-foreground border-border',
  pending_approval: 'text-amber-500 border-amber-500/40 bg-amber-500/5',
  approved:         'text-primary border-primary/40 bg-primary/5',
  running:          'text-blue-400 border-blue-400/40 bg-blue-400/5',
  completed:        'text-primary border-primary/40 bg-primary/5',
  failed:           'text-destructive border-destructive/40 bg-destructive/5',
  cancelled:        'text-muted-foreground border-border',
};

const WORKFLOW_TABS = ['pending_approval', 'approved', 'running', 'completed', 'failed', 'draft'];
const TOP_TABS = ['workflows', 'templates', 'ai_proposals'];

export default function WorkflowPanel({ currentUser, executionMode = 'SIMULATED', executionPaused = false }) {
  const [workflows, setWorkflows]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [topTab, setTopTab]             = useState('workflows');
  const [activeTab, setActiveTab]       = useState('pending_approval');
  const [showBuilder, setShowBuilder]   = useState(false);
  const [expanded, setExpanded]         = useState({});
  const [executing, setExecuting]       = useState({});
  const [approving, setApproving]       = useState({});
  const [execResults, setExecResults]   = useState({});
  const [saveTemplateFor, setSaveTemplateFor] = useState(null); // workflow to save as template

  const fetch = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.OpenClawWorkflow.list('-created_date', 100);
    setWorkflows(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const visible = workflows.filter(w => w.status === activeTab);
  const countByStatus = s => workflows.filter(w => w.status === s).length;
  const toggleExpand = id => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const handleApprove = async (wf) => {
    setApproving(p => ({ ...p, [wf.id]: true }));
    await base44.functions.invoke('openclawWorkflowEngine', { action: 'approve', workflowId: wf.id });
    setApproving(p => ({ ...p, [wf.id]: false }));
    fetch();
  };

  const handleExecute = async (wf) => {
    if (executionPaused) return;
    setExecuting(p => ({ ...p, [wf.id]: true }));
    const res = await base44.functions.invoke('openclawWorkflowEngine', {
      action: 'execute',
      workflowId: wf.id,
      executionMode,
    });
    setExecuting(p => ({ ...p, [wf.id]: false }));
    if (res.data?.results) {
      setExecResults(p => ({ ...p, [wf.id]: res.data.results }));
    }
    setExpanded(p => ({ ...p, [wf.id]: true }));
    fetch();
  };

  // Instantiate from template: open builder pre-seeded (handled by passing steps to builder via key)
  const handleInstantiate = (template) => {
    setTopTab('workflows');
    setShowBuilder(true);
  };

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Top-level tab: Workflows / Templates */}
      <div className="shrink-0 border-b border-border bg-card/60 flex items-center px-4 gap-1 py-1.5">
        {TOP_TABS.map(t => (
          <button key={t} onClick={() => setTopTab(t)}
            className={`px-3 py-1 text-[10px] uppercase tracking-wider border transition-colors ${topTab === t ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'}`}>
            {t === 'templates'    ? <span className="flex items-center gap-1"><BookMarked className="w-3 h-3" />Templates</span>
           : t === 'ai_proposals' ? <span className="flex items-center gap-1">✦ AI Proposals</span>
           : 'Workflows'}
          </button>
        ))}
      </div>

      {/* Templates view */}
      {topTab === 'templates' && (
        <div className="flex-1 overflow-hidden">
          <TemplatesPanel currentUser={currentUser} onInstantiate={handleInstantiate} />
        </div>
      )}

      {/* AI Proposals view */}
      {topTab === 'ai_proposals' && (
        <div className="flex-1 overflow-hidden">
          <ProposalsPanel
            currentUser={currentUser}
            onWorkflowCreated={() => { setTopTab('workflows'); setActiveTab('pending_approval'); fetch(); }}
          />
        </div>
      )}

      {/* Save Template Modal */}
      {saveTemplateFor && (
        <SaveTemplateModal
          workflow={saveTemplateFor}
          currentUser={currentUser}
          onSaved={() => { setSaveTemplateFor(null); }}
          onClose={() => setSaveTemplateFor(null)}
        />
      )}

      {/* Workflows view */}
      {topTab === 'workflows' && <><div className="shrink-0 border-b border-border bg-card flex items-center px-2 gap-0 overflow-x-auto">
        {WORKFLOW_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2.5 text-[11px] transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab ? 'text-primary border-primary' : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.replace('_', ' ')}
            {countByStatus(tab) > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] border rounded-full ${tab === 'pending_approval' ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-secondary border-border text-muted-foreground'}`}>
                {countByStatus(tab)}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto pr-2 flex items-center gap-2">
          <button onClick={fetch} className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowBuilder(v => !v)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors">
            <Plus className="w-3 h-3" /> New Workflow
          </button>
        </div>
      </div>

      {/* Builder */}
      {showBuilder && (
        <div className="shrink-0 border-b border-border bg-card/80 p-5 overflow-auto max-h-[75vh]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-4">Workflow Builder · Capability Registry</div>
          <WorkflowBuilder
            currentUser={currentUser}
            onCreated={() => { setShowBuilder(false); setActiveTab('pending_approval'); fetch(); }}
            onCancel={() => setShowBuilder(false)}
          />
        </div>
      )}

      {/* Workflow List */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="w-4 h-4 text-primary animate-spin" /></div>
        ) : visible.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[11px] text-muted-foreground/40">No {activeTab.replace('_', ' ')} workflows</div>
        ) : (
          visible.map(wf => (
            <div key={wf.id} className="bg-card border border-border">
              {/* Workflow Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
                <button onClick={() => toggleExpand(wf.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {expanded[wf.id] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-foreground font-semibold truncate">{wf.name}</div>
                  {wf.description && <div className="text-[10px] text-muted-foreground/60 truncate">{wf.description}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground/50">{wf.steps?.length || 0} steps</span>
                  <span className={`px-2 py-0.5 border text-[9px] uppercase tracking-wider ${STATUS_COLORS[wf.status] || ''}`}>
                    {wf.status?.replace('_', ' ')}
                  </span>
                  {/* Approve button */}
                  {wf.status === 'pending_approval' && (
                    <button onClick={() => handleApprove(wf)} disabled={approving[wf.id]} className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 border border-primary/30 text-primary text-[10px] hover:bg-primary/20 transition-colors disabled:opacity-50">
                      {approving[wf.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />} Approve
                    </button>
                  )}
                  {/* Execute button */}
                  {wf.status === 'approved' && (
                    <button onClick={() => handleExecute(wf)} disabled={executing[wf.id] || executionPaused} className={`flex items-center gap-1 px-2.5 py-1 border text-[10px] transition-colors disabled:opacity-50 ${executionMode === 'LIVE' ? 'border-destructive/40 text-destructive bg-destructive/10 hover:bg-destructive/20' : 'border-blue-400/40 text-blue-400 bg-blue-400/10 hover:bg-blue-400/20'}`}>
                      {executing[wf.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      {executionMode === 'LIVE' ? 'Execute (LIVE)' : 'Execute (Simulated)'}
                    </button>
                  )}
                  {/* Save as template (completed workflows) */}
                  {(wf.status === 'completed' || wf.status === 'approved') && (
                    <button onClick={() => setSaveTemplateFor(wf)} className="flex items-center gap-1 px-2.5 py-1 border border-border text-muted-foreground text-[10px] hover:text-foreground hover:bg-secondary/50 transition-colors" title="Save as template">
                      <BookMarked className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Timeline */}
              {expanded[wf.id] && (
                <div className="p-4">
                  <WorkflowExecutionView workflow={wf} execResults={execResults[wf.id]} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </>}
    </div>
  );
}