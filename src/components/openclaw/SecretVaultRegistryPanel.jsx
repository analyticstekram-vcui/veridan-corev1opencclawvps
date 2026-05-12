import React, { useState, useEffect } from 'react';
import { useState as React_useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Shield, AlertTriangle, Filter, Lock, RotateCw, ChevronDown, ChevronRight } from 'lucide-react';
import { format, isPast } from 'date-fns';

const STATUS_CONFIG = {
  NOT_CONFIGURED: { label: 'NOT CONFIGURED', color: 'text-slate-400 border-slate-400/30 bg-slate-400/5' },
  CONFIGURED: { label: 'CONFIGURED', color: 'text-primary border-primary/30 bg-primary/5' },
  ROTATION_DUE: { label: 'ROTATION DUE', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5' },
  DISABLED: { label: 'DISABLED', color: 'text-destructive border-destructive/30 bg-destructive/5' },
};

const RISK_CONFIG = {
  low: { color: 'text-blue-400', label: 'LOW' },
  medium: { color: 'text-amber-500', label: 'MEDIUM' },
  high: { color: 'text-orange-500', label: 'HIGH' },
  critical: { color: 'text-destructive', label: 'CRITICAL' },
};

function SecretRow({ secret, expanded, onToggle }) {
  const statusCfg = STATUS_CONFIG[secret.status] || STATUS_CONFIG.NOT_CONFIGURED;
  const riskCfg = RISK_CONFIG[secret.riskTier] || RISK_CONFIG.medium;
  const rotationDue = (() => {
    try {
      if (!secret?.nextRotationDue) return false;
      const dueDate = typeof secret.nextRotationDue === 'string' ? new Date(secret.nextRotationDue) : secret.nextRotationDue;
      return !isNaN(dueDate.getTime()) && isPast(dueDate);
    } catch {
      return false;
    }
  })();

  return (
    <div className="border border-border/50 rounded bg-card/30 overflow-hidden">
      <div
        className="flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer hover:bg-secondary/20 transition-colors"
        onClick={() => onToggle(secret.id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Lock className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-[10px] font-mono text-slate-300 truncate font-semibold">{secret.secretName}</span>
              {rotationDue && <span className="text-[8px] px-1.5 py-0.5 border border-amber-500/30 bg-amber-500/5 text-amber-500 rounded">ROTATION DUE</span>}
            </div>
            <div className="text-[9px] text-slate-400 flex items-center gap-3">
              <span>{secret.provider}</span>
              <span className="text-[8px] px-1.5 py-0.5 border border-border bg-secondary/30 rounded">{secret.environment}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${riskCfg.color}`}>{riskCfg.label}</span>
          <span className={`text-[8px] px-1.5 py-0.5 border rounded font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 bg-secondary/10 px-4 py-3 space-y-3 text-[9px]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Secret Name</div>
              <div className="text-slate-300 font-mono text-[10px] truncate">{secret.secretName}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Provider</div>
              <div className="text-slate-300">{secret.provider}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Purpose</div>
              <div className="text-slate-300">{secret.purpose}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Environment</div>
              <div className="text-slate-300">{secret.environment}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Storage Location</div>
              <div className="text-slate-300">{secret.storageLocation}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Status</div>
              <div className={`font-semibold ${STATUS_CONFIG[secret.status]?.color}`}>
                {STATUS_CONFIG[secret.status]?.label}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Risk Tier</div>
              <div className={`font-semibold ${RISK_CONFIG[secret.riskTier]?.color}`}>
                {RISK_CONFIG[secret.riskTier]?.label}
              </div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Access Scope</div>
              <div className="text-slate-300">{secret.accessScope}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Owner</div>
              <div className="text-slate-300 truncate">{secret.owner || '—'}</div>
            </div>
            {secret.lastRotatedAt && (() => {
              try {
                const date = typeof secret.lastRotatedAt === 'string' ? new Date(secret.lastRotatedAt) : secret.lastRotatedAt;
                return !isNaN(date.getTime()) ? (
                  <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
                    <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Last Rotated</div>
                    <div className="text-slate-300 font-mono">{format(date, 'MMM dd, yyyy')}</div>
                  </div>
                ) : null;
              } catch {
                return null;
              }
            })()}
            {secret.nextRotationDue && (() => {
              try {
                const date = typeof secret.nextRotationDue === 'string' ? new Date(secret.nextRotationDue) : secret.nextRotationDue;
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

          {secret.notes && (
            <div className="bg-card/50 border border-border/30 px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 font-semibold mb-1">Notes</div>
              <div className="text-slate-300 text-[9px]">{secret.notes}</div>
            </div>
          )}

          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
            <div className="text-[8px] font-semibold text-primary mb-1">⚠️ Metadata Only</div>
            <div className="text-[8px] text-primary/70">This record stores metadata only. Actual secret value is never displayed, stored, or logged here. Access the real secret from your backend vault, environment variables, or key management system.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SecretVaultRegistryPanel() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState({});
  const [filters, setFilters] = useState({
    provider: 'all',
    environment: 'all',
    status: 'all',
    riskTier: 'all',
  });

  const fetchSecrets = async () => {
    setLoading(true);
    try {
      const records = await base44.entities.OpenClawSecretReference.list('-created_date', 500);
      
      // Add seed records if empty
      if (!records || records.length === 0) {
        const seedRecords = [
          {
            secretName: 'OPENAI_API_KEY',
            provider: 'OpenAI',
            purpose: 'LLM inference and natural language processing',
            storageLocation: 'environment_variable',
            environment: 'production',
            status: 'CONFIGURED',
            riskTier: 'critical',
            owner: 'system@veridancore.com',
            accessScope: 'read_only',
            lastRotatedAt: new Date('2026-04-12').toISOString(),
            nextRotationDue: new Date('2026-07-12').toISOString(),
            notes: 'Critical for system LLM operations. Rotated quarterly. Key used for proposal engine and safety assessments.',
          },
          {
            secretName: 'OPENCLAW_SERVICE_TOKEN',
            provider: 'OpenClaw',
            purpose: 'Internal service-to-service authentication',
            storageLocation: 'environment_variable',
            environment: 'production',
            status: 'CONFIGURED',
            riskTier: 'critical',
            owner: 'infrastructure@veridancore.com',
            accessScope: 'service_account',
            lastRotatedAt: new Date('2026-05-01').toISOString(),
            nextRotationDue: new Date('2026-08-01').toISOString(),
            notes: 'Service account token for OpenClaw gateway authentication. Rotated monthly. Used in execution bridge and proposal engine.',
          },
          {
            secretName: 'BROKER_API_KEY',
            provider: 'Broker',
            purpose: 'Trading broker authentication and order execution',
            storageLocation: 'managed_vault',
            environment: 'production',
            status: 'CONFIGURED',
            riskTier: 'critical',
            owner: 'trading@veridancore.com',
            accessScope: 'read_write',
            lastRotatedAt: new Date('2026-03-01').toISOString(),
            nextRotationDue: new Date('2026-06-01').toISOString(),
            notes: 'Critical for trading operations. Stored in encrypted vault with HSM. Paper trading adapter uses separate sandbox credentials.',
          },
          {
            secretName: 'HMAC_SIGNING_SECRET',
            provider: 'Custom',
            purpose: 'Request signature verification for broker API calls',
            storageLocation: 'environment_variable',
            environment: 'production',
            status: 'CONFIGURED',
            riskTier: 'high',
            owner: 'infrastructure@veridancore.com',
            accessScope: 'service_account',
            lastRotatedAt: new Date('2026-02-15').toISOString(),
            nextRotationDue: new Date('2026-08-15').toISOString(),
            notes: 'HMAC signing secret for broker request authentication. Rotated semi-annually. Never exposed in logs or error messages.',
          },
          {
            secretName: 'CLOUDFLARE_ACCESS_POLICY',
            provider: 'Cloudflare',
            purpose: 'Cloudflare Access authentication for gateway protection',
            storageLocation: 'environment_variable',
            environment: 'production',
            status: 'CONFIGURED',
            riskTier: 'high',
            owner: 'security@veridancore.com',
            accessScope: 'admin',
            lastRotatedAt: new Date('2026-01-10').toISOString(),
            nextRotationDue: new Date('2026-07-10').toISOString(),
            notes: 'CF Access client credentials for gateway authentication. Used at Cloudflare layer. X-Frame-Options enforcement enabled.',
          },
        ];

        // Create seed records
        try {
          await base44.entities.OpenClawSecretReference.bulkCreate(seedRecords);
          setSecrets(seedRecords);
        } catch (err) {
          console.error('Failed to seed records:', err);
          setSecrets(seedRecords); // Still show in UI
        }
      } else {
        setSecrets(records);
      }
    } catch (err) {
      console.error('Error fetching secrets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecrets();
  }, []);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredSecrets = secrets.filter(s => {
    if (filters.provider !== 'all' && s.provider !== filters.provider) return false;
    if (filters.environment !== 'all' && s.environment !== filters.environment) return false;
    if (filters.status !== 'all' && s.status !== filters.status) return false;
    if (filters.riskTier !== 'all' && s.riskTier !== filters.riskTier) return false;
    return true;
  }).sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

  const stats = {
    total: secrets.length,
    configured: secrets.filter(s => s.status === 'CONFIGURED').length,
    rotationDue: secrets.filter(s => { try { return s.nextRotationDue && isPast(new Date(s.nextRotationDue)); } catch { return false; } }).length,
    disabled: secrets.filter(s => s.status === 'DISABLED').length,
    highRisk: secrets.filter(s => s.riskTier === 'high' || s.riskTier === 'critical').length,
  };

  const providers = [...new Set(secrets.map(s => s.provider))];
  const environments = [...new Set(secrets.map(s => s.environment))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Secret Management</div>
          <div className="text-[13px] font-semibold text-foreground">Secret Vault Registry</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Critical Safety Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <div className="text-[10px] text-destructive/80">
          <div className="font-semibold mb-0.5">⚠️ This registry is metadata-only. Actual secrets never displayed or stored here.</div>
          <div className="text-[9px] text-destructive/70">Secret values must remain in backend environment variables, managed secret vaults (AWS Secrets Manager, HashiCorp Vault), key management services (KMS), or hardware security modules (HSM). This panel provides rotation tracking and ownership metadata only. Never store, log, or transmit actual secret values. For production readiness verification, see System Verify tab.</div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Total Secrets</div>
          <div className="text-[14px] font-semibold text-foreground">{stats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">Configured</div>
          <div className="text-[14px] font-semibold text-primary">{stats.configured}</div>
        </div>
        <div className={`px-3 py-2 rounded border ${stats.rotationDue > 0 ? 'bg-amber-500/5 border-amber-500/20' : 'bg-secondary/10 border-border/50'}`}>
          <div className={`uppercase tracking-wider mb-1 text-[8px] font-semibold ${stats.rotationDue > 0 ? 'text-amber-500/70' : 'text-slate-400'}`}>Rotation Due</div>
          <div className={`text-[14px] font-semibold ${stats.rotationDue > 0 ? 'text-amber-500' : 'text-foreground'}`}>{stats.rotationDue}</div>
        </div>
        <div className="bg-secondary/10 border border-border/50 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Disabled</div>
          <div className="text-[14px] font-semibold text-foreground">{stats.disabled}</div>
        </div>
        <div className={`px-3 py-2 rounded border bg-orange-500/5 border-orange-500/20`}>
          <div className="text-orange-500/70 uppercase tracking-wider mb-1 text-[8px] font-semibold">High Risk</div>
          <div className="text-[14px] font-semibold text-orange-500">{stats.highRisk}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-border/50 rounded-lg bg-secondary/5 p-3 space-y-3">
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          <Filter className="w-3 h-3" /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={filters.provider}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
            className="px-2 py-1 text-[9px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="all">All Providers</option>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select
            value={filters.environment}
            onChange={(e) => setFilters({ ...filters, environment: e.target.value })}
            className="px-2 py-1 text-[9px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="all">All Environments</option>
            {environments.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-2 py-1 text-[9px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded"
          >
            <option value="all">All Status</option>
            <option value="NOT_CONFIGURED">Not Configured</option>
            <option value="CONFIGURED">Configured</option>
            <option value="ROTATION_DUE">Rotation Due</option>
            <option value="DISABLED">Disabled</option>
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

      {/* Secret List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-[10px] text-slate-400 font-semibold">Loading vault registry...</div>
        </div>
      ) : filteredSecrets.length === 0 ? (
        <div className="border border-border/50 rounded-lg bg-card/30 px-6 py-12 text-center space-y-2">
          <div className="text-[11px] text-slate-400 font-semibold">No secrets in vault registry.</div>
          <div className="text-[9px] text-slate-400 max-w-sm mx-auto">
            Seed records for common secrets (OpenAI API key, OpenClaw tokens, broker credentials, HMAC signing, Cloudflare Access) are loaded automatically.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSecrets.map(secret => (
            <SecretRow
              key={secret.id}
              secret={secret}
              expanded={expandedIds[secret.id]}
              onToggle={toggleExpanded}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/50 rounded-lg text-[9px] text-slate-400">
        <Lock className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">Metadata registry for compliance and rotation tracking only.</div>
          <div className="text-[8px] text-slate-400">This registry does NOT store, encrypt, transmit, or log actual secret values. Secret rotation schedules, ownership, risk tiers, and storage location references are metadata only. Real secrets must be managed by backend vault systems, environment variable providers, or key management services.</div>
        </div>
      </div>
    </div>
  );
}