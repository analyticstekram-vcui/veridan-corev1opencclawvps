import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function Phase1DryRunAuditLog() {
  const [auditRecords, setAuditRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAuditLog = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await base44.entities.OpenClawBridgeDryRunAudit.list('-created_date', 25);
      setAuditRecords(records || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLog();
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Phase 1 Audit</div>
          <div className="text-[13px] font-semibold text-foreground">Dry-Run Bridge Validation Log</div>
        </div>
        <button
          onClick={fetchAuditLog}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-[10px] text-slate-400 hover:text-foreground hover:bg-secondary/50 disabled:opacity-50 transition-colors font-semibold"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
        <div className="text-[9px] text-primary/80">
          <div className="font-semibold mb-0.5">Latest 25 dry-run validation requests</div>
          <div className="text-[8px] text-primary/70">Backend audit trail for POST /api/openclaw/bridge/preview. No OpenClaw calls. Read-only validation only.</div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
          <div className="text-[10px] font-semibold text-destructive mb-1">Error Loading Audit Log</div>
          <div className="text-[9px] text-destructive/80">{error}</div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
          <span className="text-[10px] text-slate-400 ml-2">Loading audit records...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && auditRecords.length === 0 && (
        <div className="border border-border/50 rounded-lg bg-card/30 px-6 py-8 text-center">
          <div className="text-[10px] text-slate-400 font-semibold">No audit records yet.</div>
          <div className="text-[9px] text-slate-400 mt-2">Audit records are created when requests are submitted to the dry-run bridge.</div>
        </div>
      )}

      {/* Audit Records */}
      {!loading && !error && auditRecords.length > 0 && (
        <div className="border border-border/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead className="border-b border-border/30 bg-secondary/10">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Status</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Request ID</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Operator</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Command Type</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Risk Tier</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Execution Status</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Received At</th>
                  <th className="text-left px-3 py-2 font-semibold text-foreground">Reason / Note</th>
                </tr>
              </thead>
              <tbody>
                {auditRecords.map((record, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    {/* Status Badge */}
                    <td className="px-3 py-2">
                      {record.accepted ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          <span className="text-primary font-semibold">ACCEPTED</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-destructive" />
                          <span className="text-destructive font-semibold">REJECTED</span>
                        </div>
                      )}
                    </td>

                    {/* Request ID */}
                    <td className="px-3 py-2 font-mono text-foreground/70 truncate max-w-xs" title={record.requestId}>
                      {record.requestId ? record.requestId.substring(0, 12) + '...' : '—'}
                    </td>

                    {/* Operator */}
                    <td className="px-3 py-2 text-foreground/70 truncate max-w-xs" title={record.operatorId}>
                      {record.operatorId || '—'}
                    </td>

                    {/* Command Type */}
                    <td className="px-3 py-2 text-foreground">
                      {record.commandType ? (
                        <span className="bg-secondary/30 border border-border/30 px-1.5 py-0.5 rounded text-[8px] font-semibold">
                          {record.commandType}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Risk Tier */}
                    <td className="px-3 py-2">
                      {record.riskTier ? (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold ${
                          record.riskTier === 'LOW' ? 'bg-primary/10 text-primary' :
                          record.riskTier === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-destructive/10 text-destructive'
                        }`}>
                          {record.riskTier}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    {/* Execution Status */}
                    <td className="px-3 py-2 text-foreground/70">
                      {record.executionStatus || '—'}
                    </td>

                    {/* Received At */}
                    <td className="px-3 py-2 font-mono text-foreground/70">
                      {record.receivedAt ? new Date(record.receivedAt).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      }) : '—'}
                    </td>

                    {/* Reason / Note */}
                    <td className="px-3 py-2 text-foreground/70 truncate max-w-xs" title={record.rejectedReason || record.note}>
                      {record.rejectedReason || record.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {!loading && !error && auditRecords.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-[9px]">
          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
            <div className="text-slate-400 font-semibold mb-0.5">Total Records</div>
            <div className="text-[13px] text-foreground font-semibold">{auditRecords.length}</div>
          </div>
          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
            <div className="text-slate-400 font-semibold mb-0.5">Accepted</div>
            <div className="text-[13px] text-primary font-semibold">{auditRecords.filter(r => r.accepted).length}</div>
          </div>
          <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
            <div className="text-slate-400 font-semibold mb-0.5">Rejected</div>
            <div className="text-[13px] text-destructive font-semibold">{auditRecords.filter(r => !r.accepted).length}</div>
          </div>
        </div>
      )}
    </div>
  );
}