import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Phase5ADryRunAuditLog() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.OpenClawBridgeDryRunAudit.list('-created_date', 25);
      setRecords(data || []);
    } catch (err) {
      console.error('Failed to fetch dry-run audit records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return (
    <div className="border border-amber-500/20 bg-amber-500/5 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-amber-500/20 bg-amber-500/10 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Phase 5A: Dry-Run Audit Log</div>
          <div className="text-[8px] text-amber-500/70 mt-1">Latest 25 dry-run attempts (accepted & rejected).</div>
        </div>
        <Button
          onClick={fetchRecords}
          disabled={loading}
          variant="outline"
          size="sm"
          className="text-[8px] h-6"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
        </Button>
      </div>

      <div className="px-4 py-3">
        {records.length === 0 ? (
          <div className="text-[8px] text-slate-400">No dry-run records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-2 text-slate-400">Status</th>
                  <th className="text-left py-2 px-2 text-slate-400">Request ID</th>
                  <th className="text-left py-2 px-2 text-slate-400">Operator</th>
                  <th className="text-left py-2 px-2 text-slate-400">Command</th>
                  <th className="text-left py-2 px-2 text-slate-400">Risk</th>
                  <th className="text-left py-2 px-2 text-slate-400">URL</th>
                  <th className="text-left py-2 px-2 text-slate-400">Execution</th>
                  <th className="text-left py-2 px-2 text-slate-400">Reason</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, idx) => (
                  <tr key={idx} className="border-b border-border/20 hover:bg-secondary/20">
                    <td className="py-1.5 px-2">
                      {rec.acceptedForDryRun ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-500" /> OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-500" /> REJECTED
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 px-2 font-mono truncate max-w-32">{rec.requestId}</td>
                    <td className="py-1.5 px-2 truncate max-w-24">{rec.operatorId}</td>
                    <td className="py-1.5 px-2">{rec.commandType}</td>
                    <td className="py-1.5 px-2">{rec.riskTier}</td>
                    <td className="py-1.5 px-2 font-mono text-[7px] truncate max-w-40">{rec.targetUrl}</td>
                    <td className="py-1.5 px-2">{rec.executionStatus}</td>
                    <td className="py-1.5 px-2 truncate max-w-32 text-slate-400">{rec.rejectedReason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}