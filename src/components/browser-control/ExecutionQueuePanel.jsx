import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronUp, AlertTriangle, Lock, Zap } from 'lucide-react';
import { format } from 'date-fns';

function QueueEntryRow({ entry, expanded, onToggle }) {
  const statusColors = {
    QUEUED: 'border-accent/30 bg-accent/5 text-accent',
    READY: 'border-primary/30 bg-primary/5 text-primary',
    BLOCKED: 'border-amber-500/30 bg-amber-500/5 text-amber-500',
    EXECUTED: 'border-primary/30 bg-primary/5 text-primary',
    FAILED: 'border-destructive/30 bg-destructive/5 text-destructive',
  };

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border hover:bg-secondary/20 cursor-pointer transition-colors"
      >
        <td className="px-3 py-2 text-[9px]">
          <button className="flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {expanded ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-muted-foreground/40" />}
            {entry.proposalId?.slice(0, 12)}...
          </button>
        </td>
        <td className="px-3 py-2 text-[9px] uppercase tracking-wider text-muted-foreground/60">{entry.commandType}</td>
        <td className="px-3 py-2 text-[9px] font-mono text-blue-400 truncate max-w-xs">{entry.url}</td>
        <td className="px-3 py-2">
          <span className={`text-[8px] px-1.5 py-0.5 border uppercase tracking-wider font-semibold ${statusColors[entry.status] || statusColors.QUEUED}`}>
            {entry.status}
          </span>
        </td>
        <td className="px-3 py-2 text-[9px] font-mono text-muted-foreground/60">
          {entry.queuedAt ? format(new Date(entry.queuedAt), 'HH:mm:ss') : '—'}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-primary/20 bg-primary/5">
          <td colSpan="5" className="px-6 py-4">
            <div className="space-y-4">
              {/* Metadata grid */}
              <div>
                <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Queue Entry Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    ['Proposal ID', entry.proposalId],
                    ['Command Type', entry.commandType],
                    ['Risk Tier', entry.riskTier],
                    ['Governance', entry.governanceMode],
                    ['Status', entry.status],
                    ['Approved By', entry.approvedBy],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-secondary/30 border border-border px-2 py-1.5">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">{label}</div>
                      <div className="text-[9px] font-mono text-foreground break-all">{val || '—'}</div>
                    </div>
                  ))}
                  {entry.selector && (
                    <div className="col-span-2 md:col-span-3 bg-secondary/30 border border-border px-2 py-1.5">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Selector</div>
                      <div className="text-[9px] font-mono text-foreground break-all">{entry.selector}</div>
                    </div>
                  )}
                  <div className="col-span-2 md:col-span-3 bg-secondary/30 border border-border px-2 py-1.5">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">URL</div>
                    <div className="text-[9px] font-mono text-blue-400 break-all">{entry.url}</div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              {(entry.approvedAt || entry.queuedAt || entry.executedAt) && (
                <div>
                  <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-2">Timeline</h4>
                  <div className="space-y-1 text-[9px] font-mono text-muted-foreground/70">
                    {entry.approvedAt && <div>Approved: {format(new Date(entry.approvedAt), 'PPP HH:mm:ss')}</div>}
                    {entry.queuedAt && <div>Queued: {format(new Date(entry.queuedAt), 'PPP HH:mm:ss')}</div>}
                    {entry.executedAt && <div>Executed: {format(new Date(entry.executedAt), 'PPP HH:mm:ss')}</div>}
                  </div>
                </div>
              )}

              {/* Result or Error */}
              {entry.resultSummary && (
                <div className="bg-secondary/20 border border-border px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Result Summary</div>
                  <div className="text-[9px] text-foreground/70 font-mono">{entry.resultSummary}</div>
                </div>
              )}

              {entry.error && (
                <div className="bg-destructive/5 border border-destructive/20 px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-destructive/70 mb-1">Error</div>
                  <div className="text-[9px] text-destructive font-mono break-all">{entry.error}</div>
                </div>
              )}

              {/* Diagnostics */}
              {Array.isArray(entry.diagnosticsSummary) && entry.diagnosticsSummary.length > 0 && (
                <div className="bg-secondary/20 border border-border px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Diagnostics ({entry.diagnosticsSummary.length})</div>
                  <div className="text-[9px] text-muted-foreground/70 font-mono space-y-0.5">
                    {entry.diagnosticsSummary.map((diag, idx) => (
                      <div key={idx}>› {diag}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {entry.notes && (
                <div className="bg-secondary/20 border border-border px-3 py-2">
                  <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-1">Notes</div>
                  <div className="text-[9px] text-foreground/70">{entry.notes}</div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function ExecutionQueuePanel() {
  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const loadQueue = async () => {
      try {
        setLoading(true);
        const entries = await base44.entities.ExecutionQueue.list();
        setQueueEntries(entries || []);
      } catch (err) {
        console.warn('Failed to load execution queue:', err.message);
        setQueueEntries([]);
      } finally {
        setLoading(false);
      }
    };

    loadQueue();
  }, []);

  if (queueEntries.length === 0 && !loading) {
    return (
      <div className="bg-card border border-border">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
          <Zap className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Execution Queue</span>
        </div>
        <div className="p-4">
          <p className="text-[10px] text-muted-foreground/40 italic">No queued executions yet. Approve a proposal and queue it for execution.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Execution Queue</span>
          {queueEntries.length > 0 && <span className="text-[9px] text-muted-foreground/50 ml-2">({queueEntries.length})</span>}
        </div>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 px-4 py-2.5 border-b border-amber-500/20 bg-amber-500/5">
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
        <span className="text-[9px] uppercase tracking-wider text-amber-500/80 font-semibold">
          Execution bridge is not enabled yet. Queueing only.
        </span>
      </div>

      {/* Queue table */}
      {queueEntries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead className="bg-secondary/10 border-b border-border/30">
              <tr>
                <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Proposal ID</th>
                <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Command</th>
                <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">URL</th>
                <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Status</th>
                <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Queued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {queueEntries.map(entry => (
                <QueueEntryRow
                  key={entry.id}
                  entry={entry}
                  expanded={expandedId === entry.id}
                  onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}