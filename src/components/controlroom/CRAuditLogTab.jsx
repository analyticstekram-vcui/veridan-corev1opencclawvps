import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

function formatDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

const STATUS_CONFIG = {
  PREVIEW_ONLY:        { icon: Clock,        color: 'text-slate-400',  label: 'PREVIEW' },
  REJECTED_NOT_EXECUTED: { icon: XCircle,    color: 'text-destructive', label: 'REJECTED' },
  APPROVED:            { icon: CheckCircle2, color: 'text-primary',    label: 'APPROVED' },
  DENIED:              { icon: XCircle,      color: 'text-destructive', label: 'DENIED' },
  PASS:                { icon: CheckCircle2, color: 'text-primary',    label: 'PASS' },
  FAIL:                { icon: XCircle,      color: 'text-destructive', label: 'FAIL' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { icon: AlertCircle, color: 'text-slate-400', label: status || '—' };
  const Icon = cfg.icon;
  return (
    <div className={`flex items-center gap-1 ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      <span className="text-[8px] font-bold">{cfg.label}</span>
    </div>
  );
}

export default function CRAuditLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.OpenClawBridgeDryRunAudit.list('-createdAt', 30);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-foreground">Audit Log</h2>
        <button onClick={fetchLogs} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-border text-slate-400 hover:bg-secondary/50 transition-colors rounded disabled:opacity-50">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead className="border-b border-border bg-secondary/20">
              <tr>
                {['Command', 'Actor', 'Approval Status', 'Policy Gate', 'Blocked Reason', 'Result', 'Timestamp'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[8px] uppercase tracking-wider font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    {loading ? 'Loading…' : 'No audit records found'}
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-300 whitespace-nowrap">{log.commandType || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[120px] truncate">{log.operatorId || '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={log.acceptedForDryRun ? 'APPROVED' : 'DENIED'} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={log.policyGateResult || '—'} />
                    </td>
                    <td className="px-3 py-2.5 text-destructive/80 max-w-[160px] truncate">{log.rejectedReason || '—'}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={log.executionStatus || '—'} />
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-[8px] text-slate-400 text-center">
        Showing latest 30 dry-run audit records · All records are read-only · No live execution logged here
      </div>
    </div>
  );
}