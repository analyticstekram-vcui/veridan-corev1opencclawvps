import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, AlertTriangle, Eye, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Phase5BObservationDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all', // all, accepted, rejected
    commandType: 'all',
    riskTier: 'all',
    domain: 'all',
    rejectedReason: 'all',
  });
  const [metrics, setMetrics] = useState({
    total: 0,
    accepted: 0,
    rejected: 0,
    acceptanceRate: 0,
    rejectionRate: 0,
    byCommandType: {},
    byRiskTier: {},
    byDomain: {},
    byRejectedReason: {},
    byPolicyGateResult: {},
    byReplayCheckResult: {},
    bySignatureCheckResult: {},
    latestAcceptedTime: null,
    latestRejectedTime: null,
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.OpenClawBridgeDryRunAudit.list('-created_date', 100);
      setRecords(data || []);
      calculateMetrics(data || []);
    } catch (err) {
      console.error('Failed to fetch dry-run audit records:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (data) => {
    const total = data.length;
    const accepted = data.filter(r => r.acceptedForDryRun).length;
    const rejected = total - accepted;

    const metrics = {
      total,
      accepted,
      rejected,
      acceptanceRate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0,
      rejectionRate: total > 0 ? ((rejected / total) * 100).toFixed(1) : 0,
      byCommandType: {},
      byRiskTier: {},
      byDomain: {},
      byRejectedReason: {},
      byPolicyGateResult: {},
      byReplayCheckResult: {},
      bySignatureCheckResult: {},
      latestAcceptedTime: null,
      latestRejectedTime: null,
    };

    data.forEach(record => {
      // By command type
      if (record.commandType) {
        metrics.byCommandType[record.commandType] = (metrics.byCommandType[record.commandType] || 0) + 1;
      }

      // By risk tier
      if (record.riskTier) {
        metrics.byRiskTier[record.riskTier] = (metrics.byRiskTier[record.riskTier] || 0) + 1;
      }

      // By domain
      if (record.targetUrl) {
        try {
          const url = new URL(record.targetUrl);
          const domain = url.hostname;
          metrics.byDomain[domain] = (metrics.byDomain[domain] || 0) + 1;
        } catch {}
      }

      // By rejected reason
      if (record.rejectedReason) {
        metrics.byRejectedReason[record.rejectedReason] = (metrics.byRejectedReason[record.rejectedReason] || 0) + 1;
      }

      // By policy gate result
      if (record.policyGateResult) {
        metrics.byPolicyGateResult[record.policyGateResult] = (metrics.byPolicyGateResult[record.policyGateResult] || 0) + 1;
      }

      // By replay check result
      if (record.replayCheckResult) {
        metrics.byReplayCheckResult[record.replayCheckResult] = (metrics.byReplayCheckResult[record.replayCheckResult] || 0) + 1;
      }

      // By signature check result
      if (record.signatureCheckResult) {
        metrics.bySignatureCheckResult[record.signatureCheckResult] = (metrics.bySignatureCheckResult[record.signatureCheckResult] || 0) + 1;
      }

      // Latest timestamps
      if (record.acceptedForDryRun && !metrics.latestAcceptedTime) {
        metrics.latestAcceptedTime = record.createdAt;
      }
      if (!record.acceptedForDryRun && !metrics.latestRejectedTime) {
        metrics.latestRejectedTime = record.createdAt;
      }
    });

    setMetrics(metrics);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(record => {
    if (filters.status !== 'all') {
      const isAccepted = record.acceptedForDryRun;
      if (filters.status === 'accepted' && !isAccepted) return false;
      if (filters.status === 'rejected' && isAccepted) return false;
    }

    if (filters.commandType !== 'all' && record.commandType !== filters.commandType) return false;
    if (filters.riskTier !== 'all' && record.riskTier !== filters.riskTier) return false;

    if (filters.domain !== 'all' && record.targetUrl) {
      try {
        const url = new URL(record.targetUrl);
        if (url.hostname !== filters.domain) return false;
      } catch {
        return false;
      }
    }

    if (filters.rejectedReason !== 'all' && record.rejectedReason !== filters.rejectedReason) return false;

    return true;
  });

  const commandTypes = Object.keys(metrics.byCommandType).sort();
  const riskTiers = Object.keys(metrics.byRiskTier).sort();
  const domains = Object.keys(metrics.byDomain).sort();
  const rejectedReasons = Object.keys(metrics.byRejectedReason).sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-slate-500/20 bg-slate-500/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phase 5B: Observation Dashboard</div>
            <div className="text-[8px] text-slate-500 mt-1">Read-only monitoring of dry-run bridge activity before OpenClaw connection.</div>
          </div>
          <Button
            onClick={fetchRecords}
            disabled={loading}
            variant="outline"
            size="sm"
            className="text-[8px] h-7"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          </Button>
        </div>

        {/* Warning Banner */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[8px] text-amber-600">Observation dashboard only. No OpenClaw action is executed.</span>
        </div>

        {/* Status Badges */}
        <div className="px-4 py-2 border-b border-slate-500/20 flex items-center gap-1.5">
          <span className="text-[7px] font-semibold text-slate-500 px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded">OBSERVATION_ONLY</span>
          <span className="text-[7px] font-semibold text-slate-500 px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded">OPENCLAW_NOT_CONNECTED</span>
          <span className="text-[7px] font-semibold text-slate-500 px-1.5 py-0.5 bg-slate-500/20 border border-slate-500/30 rounded">EXECUTION_DISABLED</span>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
          <div className="text-[8px] text-slate-400 mb-1">Total Attempts</div>
          <div className="text-[16px] font-bold text-foreground">{metrics.total}</div>
        </div>
        <div className="border border-green-500/20 bg-green-500/5 rounded p-3">
          <div className="text-[8px] text-green-600 mb-1">Accepted</div>
          <div className="text-[16px] font-bold text-green-600">{metrics.accepted}</div>
          <div className="text-[7px] text-green-600/70">{metrics.acceptanceRate}%</div>
        </div>
        <div className="border border-red-500/20 bg-red-500/5 rounded p-3">
          <div className="text-[8px] text-red-600 mb-1">Rejected</div>
          <div className="text-[16px] font-bold text-red-600">{metrics.rejected}</div>
          <div className="text-[7px] text-red-600/70">{metrics.rejectionRate}%</div>
        </div>
        <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
          <div className="text-[8px] text-slate-400 mb-1">Mode</div>
          <div className="text-[11px] font-semibold text-slate-400">DRY-RUN</div>
        </div>
      </div>

      {/* Breakdown Metrics */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Command Types */}
        {commandTypes.length > 0 && (
          <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
            <div className="text-[8px] font-semibold text-slate-400 mb-2 uppercase">By Command Type</div>
            <div className="space-y-1">
              {commandTypes.map(ct => (
                <div key={ct} className="flex items-center justify-between text-[8px]">
                  <span className="text-slate-400">{ct}</span>
                  <span className="font-mono text-foreground">{metrics.byCommandType[ct]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risk Tiers */}
        {riskTiers.length > 0 && (
          <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
            <div className="text-[8px] font-semibold text-slate-400 mb-2 uppercase">By Risk Tier</div>
            <div className="space-y-1">
              {riskTiers.map(rt => (
                <div key={rt} className="flex items-center justify-between text-[8px]">
                  <span className="text-slate-400">{rt}</span>
                  <span className="font-mono text-foreground">{metrics.byRiskTier[rt]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Results */}
        <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
          <div className="text-[8px] font-semibold text-slate-400 mb-2 uppercase">Signature Check</div>
          <div className="space-y-1">
            {['PASS', 'FAIL'].map(result => (
              metrics.bySignatureCheckResult[result] && (
                <div key={result} className="flex items-center justify-between text-[8px]">
                  <span className={result === 'PASS' ? 'text-green-600' : 'text-red-600'}>{result}</span>
                  <span className="font-mono text-foreground">{metrics.bySignatureCheckResult[result]}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Policy Gate */}
        <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
          <div className="text-[8px] font-semibold text-slate-400 mb-2 uppercase">Policy Gate</div>
          <div className="space-y-1">
            {['PASS', 'FAIL'].map(result => (
              metrics.byPolicyGateResult[result] && (
                <div key={result} className="flex items-center justify-between text-[8px]">
                  <span className={result === 'PASS' ? 'text-green-600' : 'text-red-600'}>{result}</span>
                  <span className="font-mono text-foreground">{metrics.byPolicyGateResult[result]}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Replay Check */}
        <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
          <div className="text-[8px] font-semibold text-slate-400 mb-2 uppercase">Replay Check</div>
          <div className="space-y-1">
            {['PASS', 'FAIL'].map(result => (
              metrics.byReplayCheckResult[result] && (
                <div key={result} className="flex items-center justify-between text-[8px]">
                  <span className={result === 'PASS' ? 'text-green-600' : 'text-red-600'}>{result}</span>
                  <span className="font-mono text-foreground">{metrics.byReplayCheckResult[result]}</span>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Domains */}
        {domains.length > 0 && (
          <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3">
            <div className="text-[8px] font-semibold text-slate-400 mb-2 uppercase">By Domain</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {domains.map(d => (
                <div key={d} className="flex items-center justify-between text-[8px]">
                  <span className="text-slate-400 truncate">{d}</span>
                  <span className="font-mono text-foreground">{metrics.byDomain[d]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rejection Reasons */}
      {rejectedReasons.length > 0 && (
        <div className="border border-red-500/20 bg-red-500/5 rounded p-3">
          <div className="text-[8px] font-semibold text-red-600 mb-2 uppercase">Rejection Reasons</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {rejectedReasons.map(reason => (
              <div key={reason} className="border border-red-500/20 bg-red-500/10 rounded p-2">
                <div className="text-[7px] text-red-600 truncate">{reason}</div>
                <div className="text-[9px] font-bold text-red-600">{metrics.byRejectedReason[reason]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="border border-slate-500/20 bg-slate-500/5 rounded p-3 space-y-2">
        <div className="text-[8px] font-semibold text-slate-400 uppercase">Filters</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {/* Status */}
          <div>
            <label className="text-[7px] text-slate-400 block mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-2 py-1 text-[8px] bg-secondary border border-border rounded"
            >
              <option value="all">All</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Command Type */}
          {commandTypes.length > 0 && (
            <div>
              <label className="text-[7px] text-slate-400 block mb-1">Command Type</label>
              <select
                value={filters.commandType}
                onChange={(e) => setFilters({ ...filters, commandType: e.target.value })}
                className="w-full px-2 py-1 text-[8px] bg-secondary border border-border rounded"
              >
                <option value="all">All</option>
                {commandTypes.map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
          )}

          {/* Risk Tier */}
          {riskTiers.length > 0 && (
            <div>
              <label className="text-[7px] text-slate-400 block mb-1">Risk Tier</label>
              <select
                value={filters.riskTier}
                onChange={(e) => setFilters({ ...filters, riskTier: e.target.value })}
                className="w-full px-2 py-1 text-[8px] bg-secondary border border-border rounded"
              >
                <option value="all">All</option>
                {riskTiers.map(rt => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>
          )}

          {/* Domain */}
          {domains.length > 0 && (
            <div>
              <label className="text-[7px] text-slate-400 block mb-1">Domain</label>
              <select
                value={filters.domain}
                onChange={(e) => setFilters({ ...filters, domain: e.target.value })}
                className="w-full px-2 py-1 text-[8px] bg-secondary border border-border rounded"
              >
                <option value="all">All</option>
                {domains.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}

          {/* Rejected Reason */}
          {rejectedReasons.length > 0 && (
            <div>
              <label className="text-[7px] text-slate-400 block mb-1">Rejection Reason</label>
              <select
                value={filters.rejectedReason}
                onChange={(e) => setFilters({ ...filters, rejectedReason: e.target.value })}
                className="w-full px-2 py-1 text-[8px] bg-secondary border border-border rounded"
              >
                <option value="all">All</option>
                {rejectedReasons.map(reason => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Latest Records Table */}
      <div className="border border-slate-500/20 bg-slate-500/5 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10">
          <div className="text-[8px] font-semibold text-slate-400 uppercase">Latest 25 Records ({filteredRecords.length})</div>
        </div>

        <div className="px-4 py-3 overflow-x-auto">
          {filteredRecords.length === 0 ? (
            <div className="text-[8px] text-slate-400">No records match the selected filters.</div>
          ) : (
            <table className="w-full text-[7px]">
              <thead>
                <tr className="border-b border-slate-500/20">
                  <th className="text-left py-1.5 px-2 text-slate-400">Status</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Request ID</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Operator</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Command</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Risk</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Domain</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Reason</th>
                  <th className="text-left py-1.5 px-2 text-slate-400">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.slice(0, 25).map((record, idx) => (
                  <tr key={idx} className="border-b border-slate-500/10 hover:bg-secondary/10">
                    <td className="py-1 px-2">
                      {record.acceptedForDryRun ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-green-500" /> OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5 text-red-500" /> REJECT
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 font-mono truncate max-w-24">{record.requestId}</td>
                    <td className="py-1 px-2 truncate max-w-20">{record.operatorId}</td>
                    <td className="py-1 px-2">{record.commandType}</td>
                    <td className="py-1 px-2">{record.riskTier}</td>
                    <td className="py-1 px-2 font-mono text-[6px] truncate max-w-32">
                      {record.targetUrl ? (() => {
                        try {
                          return new URL(record.targetUrl).hostname;
                        } catch {
                          return record.targetUrl;
                        }
                      })() : '-'}
                    </td>
                    <td className="py-1 px-2 text-slate-400 truncate max-w-32">{record.rejectedReason || '-'}</td>
                    <td className="py-1 px-2 text-slate-400 text-[6px]">{new Date(record.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}