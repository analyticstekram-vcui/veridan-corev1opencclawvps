import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function Phase4CSignerAuditLog() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      const data = await base44.asServiceRole.entities.OpenClawSignerAudit.filter(
        {},
        '-created_date',
        25
      );
      setRecords(data || []);
    } catch (err) {
      console.error('Failed to load signer audit log:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLog();
  }, []);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-widest">Signer Audit Log (Latest 25)</div>
        <button
          onClick={loadAuditLog}
          disabled={loading}
          className="px-2 py-1 text-[8px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/30 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          Refresh
        </button>
      </div>

      {/* Table */}
      {records.length === 0 ? (
        <div className="bg-card/50 border border-border/30 rounded px-4 py-6 text-center">
          <div className="text-[9px] text-slate-400">No signer audit records yet.</div>
        </div>
      ) : (
        <div className="border border-border/50 rounded overflow-x-auto">
          <table className="w-full text-[8px]">
            <thead className="border-b border-border/30 bg-secondary/10">
              <tr>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Status</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Operator ID</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Command</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Risk</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Target URL</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Signed At</th>
                <th className="text-left px-3 py-2 font-semibold text-foreground">Reason</th>
              </tr>
            </thead>
            <tbody className="space-y-0">
              {records.map((record) => (
                <tr key={record.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {record.data.signingAllowed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-primary font-semibold">SIGNED</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-destructive shrink-0" />
                          <span className="text-destructive font-semibold">REJECTED</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-400 truncate">{record.data.operatorId}</td>
                  <td className="px-3 py-2 text-foreground">{record.data.commandType || '—'}</td>
                  <td className="px-3 py-2 text-foreground">{record.data.riskTier || '—'}</td>
                  <td className="px-3 py-2 font-mono text-blue-400 text-[7px] truncate">{record.data.targetUrl || '—'}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {record.data.signedAt ? new Date(record.data.signedAt).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-400 text-[7px] truncate">{record.data.rejectedReason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Info */}
      <div className="text-[8px] text-slate-500 border-t border-border/30 pt-2">
        Signer audit records all signing attempts (allowed and rejected). No HMAC secrets or raw inputText stored. Latest 25 records shown. Refresh to update.
      </div>
    </div>
  );
}