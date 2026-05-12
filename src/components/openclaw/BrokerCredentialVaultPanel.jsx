import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, Filter, Lock, TrendingUp, ChevronDown, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, isPast } from 'date-fns';

const STATUS_CONFIG = {
  NOT_CONNECTED: { label: 'NOT CONNECTED', color: 'text-slate-400 border-slate-400/30 bg-slate-400/5' },
  METADATA_ONLY: { label: 'METADATA ONLY', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  VAULT_PENDING: { label: 'VAULT PENDING', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  VAULTED: { label: 'VAULTED', color: 'text-primary border-primary/30 bg-primary/5' },
  DISABLED: { label: 'DISABLED', color: 'text-destructive border-destructive/30 bg-destructive/5' },
};

const RISK_CONFIG = {
  low: { color: 'text-blue-400', label: 'LOW' },
  medium: { color: 'text-amber-500', label: 'MEDIUM' },
  high: { color: 'text-orange-500', label: 'HIGH' },
  critical: { color: 'text-destructive', label: 'CRITICAL' },
};

const TRADING_MODE_CONFIG = {
  NONE: { label: 'NONE', color: 'text-slate-400' },
  READ_ONLY: { label: 'READ_ONLY', color: 'text-blue-400' },
  PAPER_ONLY: { label: 'PAPER_ONLY', color: 'text-primary' },
  LIVE_BLOCKED: { label: 'LIVE_BLOCKED', color: 'text-destructive' },
};

// Determine readiness badge based on credential data
const getReadinessBadge = (credential) => {
  if (credential.credentialStatus === 'DISABLED') {
    return { label: 'DISABLED', color: 'text-destructive border-destructive/30 bg-destructive/5' };
  }
  
  if (credential.environment === 'live') {
    return { label: 'LIVE_BLOCKED', color: 'text-destructive border-destructive/30 bg-destructive/5' };
  }

  if (credential.credentialStatus === 'NOT_CONNECTED' || credential.credentialStatus === 'METADATA_ONLY') {
    if (credential.environment === 'paper') {
      return { label: 'PAPER_PENDING', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' };
    }
    return { label: 'NOT_READY', color: 'text-slate-400 border-slate-400/30 bg-slate-400/5' };
  }

  if (credential.credentialStatus === 'VAULT_PENDING') {
    return { label: 'VAULT_REQUIRED', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' };
  }

  if (credential.credentialStatus === 'VAULTED') {
    if (credential.tradingModeAllowed === 'READ_ONLY') {
      return { label: 'READ_ONLY_READY', color: 'text-primary border-primary/30 bg-primary/5' };
    }
    if (credential.tradingModeAllowed === 'PAPER_ONLY') {
      return { label: 'PAPER_READY', color: 'text-primary border-primary/30 bg-primary/5' };
    }
  }

  return { label: 'UNKNOWN', color: 'text-slate-400 border-slate-400/30 bg-slate-400/5' };
};

function BrokerRow({ credential, expanded, onToggle }) {
  const statusCfg = STATUS_CONFIG[credential.credentialStatus] || STATUS_CONFIG.NOT_CONNECTED;
  const riskCfg = RISK_CONFIG[credential.riskTier] || RISK_CONFIG.medium;
  const readinessBadge = getReadinessBadge(credential);
  const rotationDue = (() => {
    try {
      if (!credential?.nextRotationDue) return false;
      const dueDate = typeof credential.nextRotationDue === 'string' ? new Date(credential.nextRotationDue) : credential.nextRotationDue;
      return !isNaN(dueDate.getTime()) && isPast(dueDate);
    } catch {
      return false;
    }
  })();

  return (
    <div className="border border-border/50 rounded bg-card/30 overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => onToggle(credential.id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <TrendingUp className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[10px] font-semibold text-slate-300 truncate">{credential.brokerName}</span>
              <span className="text-[8px] px-1.5 py-0.5 border border-border bg-secondary/30 rounded">{credential.accountLabel}</span>
              {rotationDue && <span className="text-[8px] px-1.5 py-0.5 border border-amber-500/30 bg-amber-500/5 text-amber-500 rounded">ROTATION DUE</span>}
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-3">
              <span>{credential.environment?.toUpperCase() ?? '—'}</span>
              {credential.allowedScopes?.length > 0 && <span>{credential.allowedScopes.length} scopes</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${riskCfg.color}`}>{riskCfg.label}</span>
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${readinessBadge.color}`}>{readinessBadge.label}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 bg-secondary/10 px-4 py-3 space-y-3 text-[9px]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Broker</div>
              <div className="text-slate-300 font-semibold">{credential.brokerName}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Account Label</div>
              <div className="text-slate-300">{credential.accountLabel}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Environment</div>
              <div className="text-slate-300 uppercase font-semibold">{credential.environment ?? '—'}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Credential Status</div>
              <div className={`font-semibold ${STATUS_CONFIG[credential.credentialStatus]?.color}`}>
                {STATUS_CONFIG[credential.credentialStatus]?.label}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Vault Provider</div>
              <div className="text-slate-300">{credential.vaultProvider || '—'}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Trading Mode Allowed</div>
              <div className={`font-semibold ${TRADING_MODE_CONFIG[credential.tradingModeAllowed]?.color}`}>
                {TRADING_MODE_CONFIG[credential.tradingModeAllowed]?.label}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Risk Tier</div>
              <div className={`font-semibold ${RISK_CONFIG[credential.riskTier]?.color}`}>
                {RISK_CONFIG[credential.riskTier]?.label}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Owner</div>
              <div className="text-slate-300 truncate">{credential.owner || '—'}</div>
            </div>
            {credential.secretReferenceId && (
              <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Vault Reference</div>
                <div className="text-slate-300 font-mono text-[8px] truncate">{credential.secretReferenceId}</div>
              </div>
            )}
            {credential.lastVerifiedAt && (() => {
              try {
                const date = typeof credential.lastVerifiedAt === 'string' ? new Date(credential.lastVerifiedAt) : credential.lastVerifiedAt;
                return !isNaN(date.getTime()) ? (
                  <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Last Verified</div>
                    <div className="text-slate-300 font-mono">{format(date, 'MMM dd, yyyy')}</div>
                  </div>
                ) : null;
              } catch {
                return null;
              }
            })()}
            {credential.nextRotationDue && (() => {
              try {
                const date = typeof credential.nextRotationDue === 'string' ? new Date(credential.nextRotationDue) : credential.nextRotationDue;
                return !isNaN(date.getTime()) ? (
                  <div className={`bg-card/50 border px-2 py-1.5 rounded ${rotationDue ? 'border-amber-500/30' : 'border-border/30'}`}>
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Next Rotation Due</div>
                    <div className={`font-mono ${rotationDue ? 'text-amber-500 font-semibold' : 'text-slate-300'}`}>
                      {format(date, 'MMM dd, yyyy')}
                      {rotationDue && ' (OVERDUE)'}
                    </div>
                  </div>
                ) : null;
              } catch {
                return null;
              }
            })()}
          </div>

          {credential.allowedScopes && credential.allowedScopes.length > 0 && (
            <div className="bg-card/50 border border-border/30 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Allowed Scopes</div>
              <div className="flex flex-wrap gap-1">
                {credential.allowedScopes.map((scope, i) => (
                  <span key={i} className="text-[8px] px-2 py-0.5 border border-primary/30 bg-primary/5 text-primary rounded">
                    {scope}
                  </span>
                ))}
              </div>
            </div>
          )}

          {credential.notes && (
            <div className="bg-card/50 border border-border/30 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Notes</div>
              <div className="text-slate-300 text-[9px]">{credential.notes}</div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
            <div className="text-[8px] font-semibold text-primary mb-1">🔐 Metadata Only</div>
            <div className="text-[8px] text-primary/70">This record stores credential metadata only. No username, password, API key, token, account number, or private credential values are stored or displayed here. Real credentials must remain in backend vault/KMS.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BrokerCredentialVaultPanel() {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState({});
  const [filters, setFilters] = useState({
    broker: 'all',
    environment: 'all',
    credentialStatus: 'all',
    riskTier: 'all',
  });

  const fetchCredentials = async () => {
    setLoading(true);
    try {
      const records = await base44.entities.OpenClawBrokerCredentialReference.list('-created_date', 500);

      // Add seed records if empty
      if (!records || records.length === 0) {
        const seedRecords = [
          {
            brokerName: 'Tradovate',
            accountLabel: 'Paper Trading Account',
            environment: 'paper',
            credentialStatus: 'VAULTED',
            vaultProvider: 'aws_secrets_manager',
            secretReferenceId: 'broker/tradovate/paper/credentials',
            allowedScopes: ['read_positions', 'read_orders', 'place_orders', 'cancel_orders'],
            tradingModeAllowed: 'PAPER_ONLY',
            owner: 'trading@veridancore.com',
            riskTier: 'high',
            lastVerifiedAt: new Date('2026-05-10').toISOString(),
            nextRotationDue: new Date('2026-08-10').toISOString(),
            notes: 'Paper trading account for testing and validation. PAPER_ONLY mode enforced. Scopes limited to paper trading operations.',
          },
          {
            brokerName: 'TradingView',
            accountLabel: 'Read-Only Monitor',
            environment: 'demo',
            credentialStatus: 'VAULTED',
            vaultProvider: 'aws_secrets_manager',
            secretReferenceId: 'broker/tradingview/demo/readonly',
            allowedScopes: ['read_charts', 'read_market_data', 'view_symbols'],
            tradingModeAllowed: 'READ_ONLY',
            owner: 'monitoring@veridancore.com',
            riskTier: 'low',
            lastVerifiedAt: new Date('2026-05-11').toISOString(),
            nextRotationDue: new Date('2026-11-11').toISOString(),
            notes: 'Read-only credentials for market data and chart monitoring. No trading capabilities. Safe for monitoring workflows.',
          },
          {
            brokerName: 'BloFin',
            accountLabel: 'API Placeholder',
            environment: 'demo',
            credentialStatus: 'VAULT_PENDING',
            vaultProvider: 'hashicorp_vault',
            secretReferenceId: 'broker/blofin/demo/pending',
            allowedScopes: ['read_positions', 'read_market_data'],
            tradingModeAllowed: 'READ_ONLY',
            owner: 'trading@veridancore.com',
            riskTier: 'medium',
            lastVerifiedAt: new Date('2026-04-15').toISOString(),
            nextRotationDue: new Date('2026-10-15').toISOString(),
            notes: 'Credential vault setup pending. Awaiting HashiCorp Vault configuration. Read-only access planned.',
          },
          {
            brokerName: 'Alpaca',
            accountLabel: 'Paper Trading Placeholder',
            environment: 'paper',
            credentialStatus: 'METADATA_ONLY',
            vaultProvider: 'pending',
            secretReferenceId: null,
            allowedScopes: ['read_positions', 'place_orders'],
            tradingModeAllowed: 'PAPER_ONLY',
            owner: 'trading@veridancore.com',
            riskTier: 'high',
            lastVerifiedAt: null,
            nextRotationDue: null,
            notes: 'Alpaca integration planned. Metadata-only. Credential integration pending governance approval and vault setup.',
          },
        ];

        // Create seed records
        try {
          await base44.entities.OpenClawBrokerCredentialReference.bulkCreate(seedRecords);
          setCredentials(seedRecords);
        } catch (err) {
          console.error('Failed to seed records:', err);
          setCredentials(seedRecords); // Still show in UI
        }
      } else {
        setCredentials(records);
      }
    } catch (err) {
      console.error('Error fetching credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCredentials = credentials.filter(c => {
    if (filters.broker !== 'all' && c.brokerName !== filters.broker) return false;
    if (filters.environment !== 'all' && c.environment !== filters.environment) return false;
    if (filters.credentialStatus !== 'all' && c.credentialStatus !== filters.credentialStatus) return false;
    if (filters.riskTier !== 'all' && c.riskTier !== filters.riskTier) return false;
    return true;
  }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

  const stats = {
    total: credentials.length,
    vaulted: credentials.filter(c => c.credentialStatus === 'VAULTED').length,
    vaultPending: credentials.filter(c => c.credentialStatus === 'VAULT_PENDING').length,
    disabled: credentials.filter(c => c.credentialStatus === 'DISABLED').length,
    liveBlocked: credentials.filter(c => c.environment === 'live').length,
  };

  const brokers = [...new Set(credentials.map(c => c.brokerName))];
  const environments = [...new Set(credentials.map(c => c.environment))];
  const statuses = [...new Set(credentials.map(c => c.credentialStatus))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Broker Credential Management</div>
          <div className="text-[13px] font-semibold text-foreground">Broker Vault Registry</div>
        </div>
        <Lock className="w-5 h-5 text-primary" />
      </div>

      {/* System Verify Authority Banner */}
      <div className="flex items-start gap-2 px-4 py-3 bg-blue-400/5 border border-blue-400/20 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-[10px] text-blue-400/80">
          <div className="font-semibold mb-0.5">⚠️ Final production readiness determined by System Verify.</div>
          <div className="text-[9px] text-blue-400/70">Broker vault shows local credential status only. For production readiness decision, see System Verify tab. Backend enforcement must pass.</div>
        </div>
      </div>

      {/* Critical Safety Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-0.5">⚠️ This vault stores credential metadata only. Real broker credentials never stored or displayed here.</div>
          <div className="text-[9px] text-destructive/70">Broker API keys, account numbers, usernames, passwords, and tokens must remain in backend vault/KMS (AWS Secrets Manager, HashiCorp Vault, Azure Key Vault, HSM). This panel tracks connectivity status, scope allowances, and trading mode restrictions only. Live trading is permanently blocked across all environments.</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Total Brokers</div>
          <div className="text-[14px] font-semibold text-foreground">{stats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Vaulted</div>
          <div className="text-[14px] font-semibold text-primary">{stats.vaulted}</div>
        </div>
        <div className={`px-3 py-2 rounded border ${stats.vaultPending > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-secondary/10 border-border/50'}`}>
          <div className={`uppercase tracking-wider mb-1 text-[8px] font-semibold ${stats.vaultPending > 0 ? 'text-amber-500/70' : 'text-slate-400'}`}>Vault Pending</div>
          <div className={`text-[14px] font-semibold ${stats.vaultPending > 0 ? 'text-amber-500' : 'text-foreground'}`}>{stats.vaultPending}</div>
        </div>
        <div className="bg-secondary/10 border border-border/50 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Disabled</div>
          <div className="text-[14px] font-semibold text-foreground">{stats.disabled}</div>
        </div>
        <div className={`px-3 py-2 rounded border bg-destructive/5 border-destructive/20`}>
          <div className="text-destructive/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Live Blocked</div>
          <div className="text-[14px] font-semibold text-destructive">{stats.liveBlocked}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-border/50 rounded-lg bg-secondary/5 p-3 space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <Filter className="w-3 h-3" /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={filters.broker}
            onChange={(e) => setFilters({ ...filters, broker: e.target.value })}
            className="px-2 py-1 text-[9px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="all">All Brokers</option>
            {brokers.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select
            value={filters.environment}
            onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
            className="px-2 py-1 text-[9px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="all">All Environments</option>
            {environments.map(e => <option key={e} value={e}>{e.toUpperCase()}</option>)}
          </select>

          <select
            value={filters.credentialStatus}
            onChange={(e) => setFilters({ ...filters, credentialStatus: e.target.value })}
            className="px-2 py-1 text-[9px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="all">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select
            value={filters.riskTier}
            onChange={(e) => setFilters({ ...filters, riskTier: e.target.value })}
            className="px-2 py-1 text-[9px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="all">All Risk Tiers</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Credential List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-[10px] text-slate-400 font-semibold">Loading broker vault registry...</div>
        </div>
      ) : filteredCredentials.length === 0 ? (
        <div className="border border-border/50 rounded-lg bg-card/30 px-6 py-12 text-center space-y-2">
          <div className="text-[11px] text-slate-400 font-semibold">No broker credentials in registry.</div>
          <div className="text-[9px] text-slate-400 max-w-sm mx-auto">
            Seed records for Tradovate (paper), TradingView (read-only), BloFin (pending), and Alpaca (placeholder) are loaded automatically.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCredentials.map(credential => (
            <BrokerRow
              key={credential.id}
              credential={credential}
              expanded={expandedIds[credential.id]}
              onToggle={toggleExpanded}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/50 rounded-lg text-[9px] text-slate-400">
        <Lock className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">Broker Vault is metadata registry. Live trading permanently blocked.</div>
          <div className="text-[8px] text-slate-400">This registry does NOT store, encrypt, transmit, or log broker credentials, API keys, tokens, account numbers, or passwords. Scope allowances, trading mode restrictions, and vault provider references are metadata only. Real credentials remain in backend vault/KMS systems. Live trading (environment=live) is globally blocked to prevent unintended execution.</div>
        </div>
      </div>
    </div>
  );
}