/**
 * TradingViewMcpReadinessPanel — Planning-only TradingView MCP readiness tracker.
 * localStorage only. No TradingView calls. No MCP calls. No broker calls. No execution. No credential storage.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'veridanTradingViewMcpReadinessPlans';
const MAX_RECORDS = 100;

const MCP_TARGETS      = ['TradingView Desktop MCP', 'TradingView Data MCP', 'Custom MCP'];
const INTENDED_USES    = ['Chart Analysis', 'Pine Script Review', 'Strategy Review', 'Market Context Brief', 'Paper Trade Planning', 'Custom'];
const CONNECTION_MODES = ['Local Desktop', 'VPS', 'Cloud', 'Not Decided'];
const MCP_STATUSES     = ['NOT_STARTED', 'RESEARCHING', 'INSTALL_PLANNED', 'CONFIG_PLANNED', 'READY_FOR_LOCAL_TEST', 'DISABLED'];

const STATUS_COLORS = {
  NOT_STARTED:          'text-slate-400 border-slate-500/30 bg-slate-500/5',
  RESEARCHING:          'text-amber-400 border-amber-500/30 bg-amber-500/5',
  INSTALL_PLANNED:      'text-blue-400 border-blue-500/30 bg-blue-500/5',
  CONFIG_PLANNED:       'text-primary border-primary/30 bg-primary/5',
  READY_FOR_LOCAL_TEST: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
  DISABLED:             'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'TradingView MCP readiness only',
  'No TradingView MCP calls',
  'No broker API calls',
  'No order placement',
  'No credential storage',
  'No live trading',
  'No execution',
  'Browser-only export',
];

const BLANK = {
  mcpPlanName: '',
  mcpTarget: 'TradingView Desktop MCP',
  intendedUse: 'Chart Analysis',
  connectionMode: 'Not Decided',
  mcpStatus: 'NOT_STARTED',
  analysisOnlyConfirmed: false,
  noBrokerExecutionConfirmed: false,
  noOrderPlacementConfirmed: false,
  noCredentialStorageConfirmed: false,
  operatorApprovalRequired: false,
  notes: '',
};

function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
function save(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }

function evaluateReadiness(form) {
  const allConfirmed =
    form.analysisOnlyConfirmed &&
    form.noBrokerExecutionConfirmed &&
    form.noOrderPlacementConfirmed &&
    form.noCredentialStorageConfirmed &&
    form.operatorApprovalRequired;

  if (form.mcpStatus === 'READY_FOR_LOCAL_TEST' && !allConfirmed) {
    return {
      mcpStatus: 'CONFIG_PLANNED',
      mcpWarning: 'READY_FOR_LOCAL_TEST requires analysis-only use, no broker execution, no order placement, no credential storage, and operator approval required.',
    };
  }
  return { mcpStatus: form.mcpStatus, mcpWarning: null };
}

export default function TradingViewMcpReadinessPanel() {
  const [records, setRecords] = useState([]);
  const [form, setForm]       = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRecords(load()); }, []);

  const set    = (f, v) => setForm(prev => ({ ...prev, [f]: v }));
  const toggle = (f)    => setForm(prev => ({ ...prev, [f]: !prev[f] }));

  const handleSave = () => {
    if (!form.mcpPlanName.trim()) return;
    const { mcpStatus, mcpWarning } = evaluateReadiness(form);
    const record = {
      ...form,
      mcpStatus,
      mcpWarning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [record, ...records].slice(0, MAX_RECORDS);
    setRecords(updated);
    save(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    save(updated);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_TRADINGVIEW_MCP_READINESS',
      tradingViewMcpReadinessPlans: records,
      safetyClaims: SAFETY_CLAIMS,
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-tradingview-mcp-readiness-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total:             records.length,
    researching:       records.filter(r => r.mcpStatus === 'RESEARCHING').length,
    installPlanned:    records.filter(r => r.mcpStatus === 'INSTALL_PLANNED').length,
    configPlanned:     records.filter(r => r.mcpStatus === 'CONFIG_PLANNED').length,
    readyForLocalTest: records.filter(r => r.mcpStatus === 'READY_FOR_LOCAL_TEST').length,
    disabled:          records.filter(r => r.mcpStatus === 'DISABLED').length,
  };

  const BOOL_FIELDS = [
    { key: 'analysisOnlyConfirmed',       label: 'Analysis Only Confirmed' },
    { key: 'noBrokerExecutionConfirmed',  label: 'No Broker Execution Confirmed' },
    { key: 'noOrderPlacementConfirmed',   label: 'No Order Placement Confirmed' },
    { key: 'noCredentialStorageConfirmed',label: 'No Credential Storage Confirmed' },
    { key: 'operatorApprovalRequired',    label: 'Operator Approval Required' },
  ];

  return (
    <div className="space-y-4 font-mono">

      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">TradingView MCP Readiness</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            Planning only · No MCP calls · No TradingView calls · No broker calls · No execution
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" /> Export TradingView MCP Readiness
          </button>
          <button onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New MCP Plan'}
          </button>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-start gap-2 px-4 py-3 bg-destructive/5 border border-destructive/30 rounded-sm">
        <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
        <div>
          <div className="text-[9px] font-bold text-destructive mb-0.5">
            Planning only. No TradingView MCP calls, broker calls, order placement, or credential storage.
          </div>
          <div className="text-[8px] text-destructive/70">
            No MCP connections · No broker API calls · No live trading · No order execution · No credentials
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-4">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-3">MCP Readiness Summary</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          {[
            { label: 'Total Plans',          value: counts.total,             color: 'text-slate-200' },
            { label: 'Researching',          value: counts.researching,       color: 'text-amber-400' },
            { label: 'Install Planned',      value: counts.installPlanned,    color: 'text-blue-400' },
            { label: 'Config Planned',       value: counts.configPlanned,     color: 'text-primary' },
            { label: 'Ready Local Test',     value: counts.readyForLocalTest, color: 'text-emerald-400' },
            { label: 'Disabled',             value: counts.disabled,          color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[16px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {[
            { label: 'TradingView MCP Calls', value: 'DISABLED' },
            { label: 'Broker Execution',      value: 'DISABLED' },
            { label: 'Order Placement',       value: 'DISABLED' },
            { label: 'Credential Storage',    value: 'DISABLED' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className="text-[8px] font-bold font-mono text-destructive">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-4">
          <div className="text-[9px] font-bold uppercase text-slate-300">New TradingView MCP Readiness Plan</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* Plan Name */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">MCP Plan Name * (no credentials, no API keys)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.mcpPlanName}
                onChange={e => set('mcpPlanName', e.target.value)}
                placeholder="e.g. TradingView Desktop MCP - Chart Analysis Planning" />
            </div>

            {/* MCP Target */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">MCP Target</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.mcpTarget} onChange={e => set('mcpTarget', e.target.value)}>
                {MCP_TARGETS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Intended Use */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Intended Use</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.intendedUse} onChange={e => set('intendedUse', e.target.value)}>
                {INTENDED_USES.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            {/* Connection Mode */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Connection Mode</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.connectionMode} onChange={e => set('connectionMode', e.target.value)}>
                {CONNECTION_MODES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* MCP Status */}
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">MCP Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.mcpStatus} onChange={e => set('mcpStatus', e.target.value)}>
                {MCP_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              {form.mcpStatus === 'READY_FOR_LOCAL_TEST' && (
                <div className="mt-1 text-[7px] text-amber-400">
                  All 5 safety confirmations below must be checked or status will be downgraded to CONFIG_PLANNED.
                </div>
              )}
            </div>

            {/* Boolean Confirmations */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-2">Safety Confirmations</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {BOOL_FIELDS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-secondary/20 border border-border/30 rounded-sm hover:bg-secondary/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={() => toggle(key)}
                      className="accent-primary w-3 h-3"
                    />
                    <span className="text-[8px] text-slate-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Notes (no credentials, no API keys, no passwords)</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="High-level planning notes only" />
            </div>
          </div>

          <button onClick={handleSave} disabled={!form.mcpPlanName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed">
            Save TradingView MCP Readiness Plan
          </button>
        </div>
      )}

      {/* Records Table */}
      {records.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No MCP readiness plans yet. Click "+ New MCP Plan" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved MCP Readiness Plans</div>
            <div className="text-[8px] text-slate-500">{records.length} / {MAX_RECORDS}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Plan Name', 'MCP Target', 'Intended Use', 'Connection', 'Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[130px] truncate">{r.mcpPlanName}</td>
                    <td className="px-3 py-2 text-primary/80 whitespace-nowrap max-w-[120px] truncate">{r.mcpTarget}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.intendedUse}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.connectionMode}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${STATUS_COLORS[r.mcpStatus] || ''}`}>
                        {r.mcpStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.mcpWarning
                        ? <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[7px] font-bold text-amber-400" title={r.mcpWarning}>⚠ DOWNGRADED</span>
                        : <span className="text-[7px] text-slate-600">—</span>
                      }
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => handleRemove(r.id)} className="text-[7px] text-destructive/50 hover:text-destructive transition-colors">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Claims Footer */}
      <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
        <div className="text-[8px] font-bold uppercase text-primary/70 mb-1.5">Safety Claims</div>
        <div className="flex flex-wrap gap-1">
          {SAFETY_CLAIMS.map(c => (
            <span key={c} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">{c}</span>
          ))}
        </div>
      </div>

    </div>
  );
}