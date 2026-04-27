import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Plus } from 'lucide-react';
import CommandPreviewCard from './CommandPreviewCard';
import CapabilityCommandBuilder from './CapabilityCommandBuilder';
import { ENTITY_SCOPES } from './ScopeBadge';

const TABS = ['pending', 'approved', 'denied', 'executed', 'failed', 'cancelled'];

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
  const [scopeFilter, setScopeFilter] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const fetchCommands = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.OpenClawCommand.list('-created_date', 100);
    setCommands(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommands(); }, [fetchCommands]);

  const visible = commands.filter(c => c.status === activeTab && (scopeFilter === 'all' || c.entityScope === scopeFilter));
  const countByStatus = (s) => commands.filter(c => c.status === s).length;

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    await base44.entities.OpenClawCommand.create(payload);
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
        <div className="ml-auto pr-2 flex items-center gap-2">
          <select
            className="px-2 py-1 bg-secondary/50 border border-border text-[10px] font-mono text-muted-foreground outline-none focus:border-primary/50"
            value={scopeFilter}
            onChange={e => setScopeFilter(e.target.value)}
          >
            <option value="all">All Scopes</option>
            {ENTITY_SCOPES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[10px] hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Request Command
          </button>
        </div>
      </div>

      {/* Capability Command Builder */}
      {showForm && (
        <div className="shrink-0 border-b border-border bg-card/80 p-4 overflow-auto max-h-[70vh]">
          <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50 mb-3">New Command · Capability Registry</div>
          <CapabilityCommandBuilder
            currentUser={currentUser}
            onSubmit={handleSubmit}
            onCancel={() => setShowForm(false)}
            submitting={submitting}
          />
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