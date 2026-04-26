import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus } from 'lucide-react';
import CommandPreviewCard from './CommandPreviewCard';

const TABS = ['pending', 'approved', 'denied', 'executed', 'failed', 'cancelled'];

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

const inputCls = "w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

async function logAudit(command, eventType) {
  const entry = { eventType, timestamp: new Date().toISOString(), commandId: command.id };
  // Append to the command's auditLog array
  const existing = Array.isArray(command.auditLog) ? command.auditLog : [];
  return base44.entities.OpenClawCommand.update(command.id, {
    auditLog: [...existing, entry],
  });
}

export default function CommandQueuePanel({ currentUser }) {
  const [activeTab, setActiveTab] = useState('pending');
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ commandText: '', riskLevel: 'medium', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchCommands = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.OpenClawCommand.list('-created_date', 100);
    setCommands(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommands(); }, [fetchCommands]);

  const visible = commands.filter(c => c.status === activeTab);
  const countByStatus = (s) => commands.filter(c => c.status === s).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.commandText.trim()) return;
    setSubmitting(true);
    const cmd = await base44.entities.OpenClawCommand.create({
      commandText: form.commandText.trim(),
      riskLevel: form.riskLevel,
      notes: form.notes,
      requestedBy: currentUser?.email || 'unknown',
      target: 'OpenClaw Gateway',
      status: 'pending',
      auditLog: [{ eventType: 'OPENCLAW_COMMAND_REQUESTED', timestamp: new Date().toISOString() }],
    });
    setForm({ commandText: '', riskLevel: 'medium', notes: '' });
    setShowForm(false);
    setActiveTab('pending');
    setSubmitting(false);
    fetchCommands();
  };

  const transition = async (command, newStatus, eventType) => {
    const existing = Array.isArray(command.auditLog) ? command.auditLog : [];
    const update = { status: newStatus, auditLog: [...existing, { eventType, timestamp: new Date().toISOString(), commandId: command.id }] };
    // Seed approvers array on first approval
    if (newStatus === 'approved' && currentUser?.email) {
      update.approvers = [currentUser.email];
    }
    await base44.entities.OpenClawCommand.update(command.id, update);
    fetchCommands();
  };

  const onApprove  = (cmd) => transition(cmd, 'approved',  'OPENCLAW_COMMAND_APPROVED');
  const onDeny     = (cmd) => transition(cmd, 'denied',    'OPENCLAW_COMMAND_DENIED');
  const onCancel   = (cmd) => transition(cmd, 'cancelled', 'OPENCLAW_COMMAND_CANCELLED');
  const onExecuted = ()    => fetchCommands();

  return (
    <div className="flex flex-col h-full font-mono">
      {/* Tab Bar */}
      <div className="shrink-0 border-b border-border bg-card flex items-center px-2 gap-0 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-4 py-2.5 text-[11px] transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {countByStatus(tab) > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 text-[9px] border rounded-full ${
                tab === 'pending' ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' : 'bg-secondary border-border text-muted-foreground'
              }`}>
                {countByStatus(tab)}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto pr-2">
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Request Command
          </button>
        </div>
      </div>

      {/* Request Form */}
      {showForm && (
        <div className="shrink-0 border-b border-border bg-card/80 p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Command Text<span className="text-destructive">*</span></label>
              <input
                className={inputCls}
                value={form.commandText}
                onChange={e => setForm(p => ({ ...p, commandText: e.target.value }))}
                placeholder="e.g. GET /api/status"
                required autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Risk Level</label>
                <select className={inputCls} value={form.riskLevel} onChange={e => setForm(p => ({ ...p, riskLevel: e.target.value }))}>
                  {RISK_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-muted-foreground/50 block mb-1">Notes</label>
                <input className={inputCls} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional context..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-border text-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors disabled:opacity-50">
                {submitting && <Loader2 className="w-3 h-3 animate-spin" />} Submit for Governance Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Command List */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[11px] text-muted-foreground/40">
            No {activeTab} commands
          </div>
        ) : (
          visible.map(cmd => (
            <CommandPreviewCard
              key={cmd.id}
              command={cmd}
              onApprove={onApprove}
              onDeny={onDeny}
              onCancel={onCancel}
              onExecuted={onExecuted}
              currentUser={currentUser}
            />
          ))
        )}
      </div>
    </div>
  );
}