import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, Plus, RefreshCw } from 'lucide-react';
import { TABS, STATUS_CONFIG, validateUrl, appendAudit } from '@/lib/commandQueue';
import CreateCommandModal from '@/components/commandqueue/CreateCommandModal';
import CommandDetailDrawer from '@/components/commandqueue/CommandDetailDrawer';
import CommandQueueTable from '@/components/commandqueue/CommandQueueTable';

export default function CommandQueue() {
  const [commands,      setCommands]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState('pending');
  const [showCreate,    setShowCreate]    = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [currentUser,   setCurrentUser]   = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const fetchCommands = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.OpenClawCommand.list('-created_date', 200);
    setCommands(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommands(); }, [fetchCommands]);

  const visible = activeTab === 'all'
    ? commands
    : commands.filter(c => c.status === activeTab);

  const countFor = (tab) => tab === 'all' ? commands.length : commands.filter(c => c.status === tab).length;

  // ── Transition helpers ──────────────────────────────────────────────────────
  const setAction = (id, action) => setActionLoading(p => ({ ...p, [id]: action }));
  const clearAction = (id) => setActionLoading(p => { const n = { ...p }; delete n[id]; return n; });

  const transition = async (cmd, newStatus, extra = {}) => {
    setAction(cmd.id, newStatus);
    const auditLog = appendAudit(cmd.auditLog, `STATUS_${newStatus.toUpperCase()}`, currentUser?.email);
    await base44.entities.OpenClawCommand.update(cmd.id, { status: newStatus, auditLog, ...extra });
    clearAction(cmd.id);
    fetchCommands();
    // Refresh drawer
    if (selected?.id === cmd.id) {
      setSelected(prev => ({ ...prev, status: newStatus, auditLog, ...extra }));
    }
  };

  const handleApprove = async (cmd) => {
    const now = new Date().toISOString();
    await transition(cmd, 'approved', {
      approvedBy: currentUser?.email || 'unknown',
      approvedAt: now,
    });
  };

  const handleDeny = async (cmd) => {
    await transition(cmd, 'denied');
  };

  const handleExecute = async (cmd) => {
    // Re-validate URL before execution
    const urlErr = validateUrl(cmd.targetUrl);
    if (urlErr) {
      const auditLog = appendAudit(cmd.auditLog, `BLOCKED_PRE_EXECUTION: ${urlErr}`, 'system');
      await base44.entities.OpenClawCommand.update(cmd.id, { status: 'blocked', auditLog, error: urlErr });
      fetchCommands();
      if (selected?.id === cmd.id) setSelected(prev => ({ ...prev, status: 'blocked', error: urlErr }));
      return;
    }

    setAction(cmd.id, 'execute');
    // Mark as executing
    const auditLog1 = appendAudit(cmd.auditLog, 'EXECUTION_STARTED', currentUser?.email);
    await base44.entities.OpenClawCommand.update(cmd.id, { status: 'executing', auditLog: auditLog1 });
    fetchCommands();

    let res;
    try {
      const response = await base44.functions.invoke('openclawSafeBridge', {
        commandType: cmd.commandType,
        targetUrl:   cmd.targetUrl,
        operator:    currentUser?.email || 'VeridanCore',
        governanceLevel: 'SAFE_READ_ONLY',
      });
      res = response.data;
    } catch (err) {
      const errMsg = err?.response?.data?.error || err.message || 'Request failed';
      const auditLog = appendAudit(auditLog1, `EXECUTION_FAILED: ${errMsg}`, 'system');
      await base44.entities.OpenClawCommand.update(cmd.id, {
        status: 'failed',
        error: errMsg,
        auditLog,
        executedAt: new Date().toISOString(),
      });
      clearAction(cmd.id);
      fetchCommands();
      if (selected?.id === cmd.id) setSelected(prev => ({ ...prev, status: 'failed', error: errMsg }));
      return;
    }

    const finalStatus = res.status === 'success' ? 'executed' : 'failed';
    const now = new Date().toISOString();
    const auditLog2 = appendAudit(auditLog1, `EXECUTION_${finalStatus.toUpperCase()}_MODE_${res.executionMode || 'SIMULATED'}`, 'system');

    const update = {
      status:        finalStatus,
      executionMode: res.executionMode || 'SIMULATED',
      executedAt:    now,
      auditLog:      auditLog2,
      diagnostics:   res.diagnostics || [],
      error:         res.error || null,
      isMockTitle:   res.isMockTitle  || false,
      result: {
        pageTitle:          res.pageTitle    || null,
        screenshotCaptured: res.screenshotCaptured || false,
        screenshotUrl:      res.screenshotUrl || null,
        commandId:          res.commandId,
        rawStatus:          res.status,
      },
    };

    await base44.entities.OpenClawCommand.update(cmd.id, update);
    clearAction(cmd.id);
    fetchCommands();
    if (selected?.id === cmd.id) setSelected(prev => ({ ...prev, ...update }));
  };

  const handleRetry = async (cmd) => {
    // Reset to pending for re-approval
    await transition(cmd, 'pending', { error: null, result: null, diagnostics: [] });
  };

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-foreground">OPENCLAW COMMAND QUEUE</h1>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
              Governed execution · Approval required · Safe-read-only
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCommands} className="p-2 border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Command
          </button>
        </div>
      </div>

      {/* Status Tab Bar */}
      <div className="border-b border-border bg-card flex items-center px-2 overflow-x-auto">
        {TABS.map(tab => {
          const count = countFor(tab);
          const isPending = tab === 'pending';
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2.5 text-[11px] transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}>
              {tab === 'all' ? 'All' : STATUS_CONFIG[tab]?.label || tab}
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] border rounded-full ${
                  isPending ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-secondary border-border text-muted-foreground'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="p-4">
        <CommandQueueTable
          commands={visible}
          loading={loading}
          onSelect={setSelected}
          onApprove={handleApprove}
          onDeny={handleDeny}
          onExecute={handleExecute}
          onRetry={handleRetry}
          actionLoading={actionLoading}
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateCommandModal
          currentUser={currentUser}
          onCreated={() => { setShowCreate(false); fetchCommands(); setActiveTab('pending'); }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Detail Drawer */}
      {selected && (
        <CommandDetailDrawer
          command={selected}
          currentUser={currentUser}
          onClose={() => setSelected(null)}
          onApprove={(cmd) => { handleApprove(cmd); }}
          onDeny={(cmd)    => { handleDeny(cmd); }}
          onExecute={(cmd) => { handleExecute(cmd); }}
          onRetry={(cmd)   => { handleRetry(cmd); }}
        />
      )}
    </div>
  );
}