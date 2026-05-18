/**
 * TradingBrokerSandboxRequirements — Planning-only broker sandbox readiness tracker.
 * localStorage only. No API. No broker calls. No credentials. No execution.
 */

import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'veridanTradingBrokerSandboxRequirements';
const MAX_RECORDS  = 100;

const BROKER_TARGETS    = ['Tradovate', 'TradingView Paper', 'Alpaca Paper', 'BloFin Demo', 'Custom'];
const MARKET_TYPES      = ['Futures', 'Crypto', 'Stocks', 'Forex'];
const ENVIRONMENT_TYPES = ['Paper', 'Demo', 'Sandbox'];
const ACCOUNT_STATUSES  = ['NOT_STARTED', 'ACCOUNT_CREATED', 'API_DOCS_REVIEWED', 'SANDBOX_READY', 'DISABLED'];

const STATUS_COLORS = {
  NOT_STARTED:       'text-slate-400 border-slate-500/30 bg-slate-500/5',
  ACCOUNT_CREATED:   'text-blue-400 border-blue-500/30 bg-blue-500/5',
  API_DOCS_REVIEWED: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
  SANDBOX_READY:     'text-primary border-primary/30 bg-primary/5',
  DISABLED:          'text-destructive border-destructive/30 bg-destructive/5',
};

const SAFETY_CLAIMS = [
  'Broker sandbox requirements only',
  'No live trading',
  'No broker API calls',
  'No order placement',
  'No credential storage in frontend',
  'No execution',
  'Browser-only export',
];

const SANDBOX_READY_WARNING =
  'SANDBOX_READY requires docs reviewed, sandbox account, API key storage plan, credentials outside frontend, order placement disabled, live trading disabled, max loss limit, and paper mode confirmed.';

const BOOL_CHECKS = [
  { field: 'apiDocsReviewed',                  label: 'API Docs Reviewed' },
  { field: 'sandboxAccountCreated',             label: 'Sandbox Account Created' },
  { field: 'apiKeyStoragePlanDefined',          label: 'API Key Storage Plan Defined' },
  { field: 'credentialsStoredOutsideFrontend',  label: 'Credentials Stored Outside Frontend' },
  { field: 'orderPlacementDisabled',            label: 'Order Placement Disabled' },
  { field: 'liveTradingDisabled',               label: 'Live Trading Disabled' },
  { field: 'maxLossLimitDefined',               label: 'Max Loss Limit Defined' },
  { field: 'paperModeConfirmed',                label: 'Paper Mode Confirmed' },
];

const BLANK = {
  requirementName: '',
  brokerTarget: 'Tradovate',
  marketType: 'Futures',
  environmentType: 'Paper',
  accountStatus: 'NOT_STARTED',
  apiDocsReviewed: false,
  sandboxAccountCreated: false,
  apiKeyStoragePlanDefined: false,
  credentialsStoredOutsideFrontend: false,
  orderPlacementDisabled: false,
  liveTradingDisabled: false,
  maxLossLimitDefined: false,
  paperModeConfirmed: false,
  brokerNotes: '',
};

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function checkSandboxReady(f) {
  return (
    f.apiDocsReviewed &&
    f.sandboxAccountCreated &&
    f.apiKeyStoragePlanDefined &&
    f.credentialsStoredOutsideFrontend &&
    f.orderPlacementDisabled &&
    f.liveTradingDisabled &&
    f.maxLossLimitDefined &&
    f.paperModeConfirmed
  );
}

export default function TradingBrokerSandboxRequirements() {
  const [requirements, setRequirements] = useState([]);
  const [form, setForm]   = useState(BLANK);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { setRequirements(load()); }, []);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.requirementName.trim()) return;

    let finalStatus = form.accountStatus;
    let sandboxWarning = null;

    if (finalStatus === 'SANDBOX_READY' && !checkSandboxReady(form)) {
      finalStatus = 'API_DOCS_REVIEWED';
      sandboxWarning = SANDBOX_READY_WARNING;
    }

    const record = {
      ...form,
      accountStatus: finalStatus,
      sandboxWarning,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [record, ...requirements].slice(0, MAX_RECORDS);
    setRequirements(updated);
    save(updated);
    setForm(BLANK);
    setShowForm(false);
  };

  const handleRemove = (id) => {
    const updated = requirements.filter(r => r.id !== id);
    setRequirements(updated);
    save(updated);
  };

  const handleExport = () => {
    const exportPackage = {
      generatedAt: new Date().toISOString(),
      snapshotType: 'VERIDAN_TRADING_BROKER_SANDBOX_REQUIREMENTS',
      brokerSandboxRequirements: requirements,
      safetyClaims: SAFETY_CLAIMS,
    };
    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veridan-broker-sandbox-requirements-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary counts
  const counts = {
    total:          requirements.length,
    notStarted:     requirements.filter(r => r.accountStatus === 'NOT_STARTED').length,
    accountCreated: requirements.filter(r => r.accountStatus === 'ACCOUNT_CREATED').length,
    docsReviewed:   requirements.filter(r => r.accountStatus === 'API_DOCS_REVIEWED').length,
    sandboxReady:   requirements.filter(r => r.accountStatus === 'SANDBOX_READY').length,
    disabled:       requirements.filter(r => r.accountStatus === 'DISABLED').length,
  };

  const formReady = checkSandboxReady(form);

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase text-primary">Broker Sandbox Requirements</div>
          <div className="text-[8px] text-slate-500 mt-0.5">
            Document sandbox readiness requirements · No credentials · No broker calls · No execution
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/30 border border-border text-slate-300 text-[9px] font-bold hover:bg-secondary/50 transition-colors rounded-sm">
            <Download className="w-3 h-3" />
            Export Broker Sandbox Requirements
          </button>
          <button type="button" onClick={() => setShowForm(v => !v)}
            className="px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-[9px] font-bold hover:bg-primary/20 transition-colors rounded-sm">
            {showForm ? 'Cancel' : '+ New Requirement'}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-card border border-border/50 rounded-sm p-3">
        <div className="text-[9px] font-bold uppercase text-slate-300 mb-2">Sandbox Requirements Summary</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          {[
            { label: 'Total',          value: counts.total,          color: 'text-slate-200' },
            { label: 'Not Started',    value: counts.notStarted,     color: 'text-slate-400' },
            { label: 'Acct Created',   value: counts.accountCreated, color: 'text-blue-400' },
            { label: 'Docs Reviewed',  value: counts.docsReviewed,   color: 'text-amber-400' },
            { label: 'Sandbox Ready',  value: counts.sandboxReady,   color: 'text-primary' },
            { label: 'Disabled',       value: counts.disabled,       color: 'text-destructive' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center px-2 py-2 bg-secondary/20 border border-border/30 rounded-sm">
              <span className={`text-[15px] font-bold font-mono ${item.color}`}>{item.value}</span>
              <span className="text-[7px] text-slate-500 mt-0.5 text-center leading-tight">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
          {[
            { label: 'Live Trading',              value: 'DISABLED' },
            { label: 'Broker API Calls',          value: 'DISABLED' },
            { label: 'Credential Storage',        value: 'DISABLED IN FRONTEND' },
            { label: 'Order Placement',           value: 'DISABLED' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between px-3 py-1.5 bg-secondary/20 border border-border/30 rounded-sm">
              <span className="text-[8px] text-slate-400">{item.label}:</span>
              <span className="text-[7px] font-bold text-destructive font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-sm text-[8px] text-destructive/80">
        <strong>No broker API calls are made here.</strong> No credentials, API keys, or passwords may be entered in this form.
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3">
          <div className="text-[9px] font-bold uppercase text-slate-300 mb-1">New Broker Sandbox Requirement</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-[8px] text-slate-400 block mb-1">Requirement Name *</label>
              <input
                className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
                value={form.requirementName}
                onChange={e => set('requirementName', e.target.value)}
                placeholder="e.g. Tradovate Paper Sandbox Setup Plan"
              />
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Broker Target</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.brokerTarget} onChange={e => set('brokerTarget', e.target.value)}>
                {BROKER_TARGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Market Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.marketType} onChange={e => set('marketType', e.target.value)}>
                {MARKET_TYPES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Environment Type</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.environmentType} onChange={e => set('environmentType', e.target.value)}>
                {ENVIRONMENT_TYPES.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] text-slate-400 block mb-1">Account Status</label>
              <select className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none"
                value={form.accountStatus} onChange={e => set('accountStatus', e.target.value)}>
                {ACCOUNT_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Boolean Checklist */}
          <div className="bg-secondary/10 border border-border/40 rounded-sm p-3">
            <div className="text-[8px] font-bold uppercase text-slate-400 mb-2">Sandbox Readiness Checklist</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {BOOL_CHECKS.map(({ field, label }) => (
                <label key={field} className="flex items-center gap-2.5 cursor-pointer hover:bg-secondary/20 px-2 py-1 rounded-sm transition-colors">
                  <input
                    type="checkbox"
                    className="accent-primary w-3 h-3 shrink-0"
                    checked={!!form[field]}
                    onChange={e => set(field, e.target.checked)}
                  />
                  <span className={`text-[8px] ${form[field] ? 'text-primary' : 'text-slate-400'}`}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Live readiness preview */}
          <div className={`px-3 py-2 border rounded-sm text-[8px] font-bold ${
            formReady && form.accountStatus === 'SANDBOX_READY'
              ? 'border-primary/40 bg-primary/5 text-primary'
              : form.accountStatus === 'SANDBOX_READY' && !formReady
              ? 'border-amber-500/40 bg-amber-500/5 text-amber-400'
              : 'border-border/40 bg-secondary/10 text-slate-400'
          }`}>
            {form.accountStatus === 'SANDBOX_READY' && !formReady
              ? '⚠ SANDBOX_READY selected but requirements not met — will be saved as API_DOCS_REVIEWED'
              : formReady
              ? '✓ All SANDBOX_READY requirements met'
              : 'Complete checklist to qualify for SANDBOX_READY'
            }
          </div>

          {/* Broker Notes */}
          <div>
            <label className="text-[8px] text-slate-400 block mb-1">Broker Notes</label>
            <input
              className="w-full bg-secondary/30 border border-border text-[9px] text-foreground px-2 py-1.5 rounded-sm outline-none focus:border-primary/50"
              value={form.brokerNotes}
              onChange={e => set('brokerNotes', e.target.value)}
              placeholder="Operator notes — no credentials or API keys here"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!form.requirementName.trim()}
            className="px-5 py-2 bg-primary/15 border border-primary/40 text-primary text-[9px] font-bold hover:bg-primary/25 transition-colors rounded-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Broker Sandbox Requirement
          </button>
        </div>
      )}

      {/* Requirements Table */}
      {requirements.length === 0 ? (
        <div className="text-center py-10 text-[9px] text-slate-500 border border-border/40 rounded-sm bg-card">
          No broker sandbox requirements saved yet. Click "+ New Requirement" to add one.
        </div>
      ) : (
        <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/40 flex items-center justify-between">
            <div className="text-[9px] font-bold uppercase text-slate-300">Saved Broker Sandbox Requirements</div>
            <div className="text-[8px] text-slate-500">{requirements.length} / {MAX_RECORDS} records</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/10">
                  {['Created', 'Name', 'Broker', 'Market', 'Environment', 'Status', 'Warning', ''].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {requirements.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 whitespace-nowrap font-mono">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-bold whitespace-nowrap max-w-[140px] truncate">{r.requirementName}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.brokerTarget}</td>
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.marketType}</td>
                    <td className="px-3 py-2 text-primary/80 font-mono whitespace-nowrap">{r.environmentType}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 border rounded text-[7px] font-bold ${STATUS_COLORS[r.accountStatus] || ''}`}>
                        {r.accountStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {r.sandboxWarning
                        ? <span title={r.sandboxWarning} className="flex items-center gap-1 text-amber-400 cursor-help">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[7px]">Auto-downgraded</span>
                          </span>
                        : <span className="text-[7px] text-slate-600">—</span>
                      }
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => handleRemove(r.id)}
                        className="text-[7px] text-destructive/50 hover:text-destructive transition-colors">
                        Remove
                      </button>
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
          {SAFETY_CLAIMS.map(claim => (
            <span key={claim} className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono">
              {claim}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
}