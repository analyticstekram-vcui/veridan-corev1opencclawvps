/**
 * VeridanKnowledgeVaultDashboard
 * Read-only internal knowledge map for Veridan Core.
 * Organizes SOPs, rules, entities, and operator instructions.
 * Future: Will connect to Obsidian.
 *
 * Does NOT:
 *   - Call Obsidian
 *   - Call backends
 *   - Call brokers
 *   - Call credit APIs
 *   - Collect credentials
 *   - Write localStorage
 *   - Use timers
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, Info, Home, AlertCircle } from 'lucide-react';
import ModuleNav from '@/components/navigation/ModuleNav';
import { SafetyStatusCard, OperatorNextActionCard, BaselineCard, SnapshotExportButton } from '@/components/ui/planning-cards';

function KnowledgeSection({ title, description, items }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h3 className="text-[11px] font-mono font-bold uppercase text-slate-100">{title}</h3>
        <p className="text-[9px] font-mono text-slate-400 mt-1">{description}</p>
      </div>
      <div className="p-4 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 text-[9px] font-mono text-muted-foreground/80">
            <span className="text-primary/60 shrink-0 mt-0.5">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VeridanKnowledgeVaultDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <ModuleNav />
      <div className="p-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-mono font-bold text-slate-100">Veridan Knowledge Vault</h1>
            </div>
            <p className="text-[13px] font-mono text-slate-300">
              Internal system brain for SOPs, rules, entities, and operator instructions
            </p>
            <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-slate-400">
              <Lock className="w-3 h-3" />
              Read-only reference · No edits yet · Future Obsidian sync
            </div>
          </div>
          <Link to="/" className="px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors rounded font-semibold whitespace-nowrap flex items-center gap-1.5 h-fit">
            <Home className="w-3 h-3" />
            Home
          </Link>
        </div>

        <SafetyStatusCard
          title="Knowledge Vault Safety Summary"
          statuses={[
            { label: 'Mode', value: 'PLANNING_ONLY', type: 'planning' },
            { label: 'Document Upload', value: 'DISABLED', type: 'disabled' },
            { label: 'AI Indexing', value: 'DISABLED', type: 'disabled' },
            { label: 'Vault Sync', value: 'DISABLED', type: 'disabled' },
            { label: 'Credential Storage', value: 'DISABLED', type: 'disabled' },
            { label: 'Private Documents', value: 'NOT_COLLECTED', type: 'neutral' },
            { label: 'External Connectors', value: 'DISABLED', type: 'disabled' },
          ]}
          disclaimer="This module is for planning and structure only. It does not upload documents, index private files, sync to external vaults, store credentials, collect private records, or connect to external services."
        />

        <OperatorNextActionCard
          title="Operator Next Action"
          summaryTitle="Review Knowledge Vault structure before enabling document workflows."
          summaryText="Verify that vault categories, governance structure, and safety constraints are properly documented before any document or AI features are enabled."
          checklist={[
            'Review vault categories',
            'Review document governance structure',
            'Confirm no document upload exists',
            'Confirm no AI indexing exists',
            'Confirm no credential storage exists',
          ]}
          note="Checklist is local and resets on page refresh."
        />

        <BaselineCard
          title="Knowledge Vault Baseline"
          rows={[
            { label: 'Baseline Name', value: 'Knowledge Vault Planning Baseline' },
            { label: 'Baseline Status', value: 'APPROVED', valueClassName: 'text-primary' },
            { label: 'Mode', value: 'PLANNING_ONLY', valueClassName: 'text-amber-500' },
            { label: 'Document Upload', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'AI Indexing', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Vault Sync', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Credential Storage', value: 'DISABLED', valueClassName: 'text-destructive' },
            { label: 'Private Documents', value: 'NOT_COLLECTED', valueClassName: 'text-destructive' },
            { label: 'External Connectors', value: 'DISABLED', valueClassName: 'text-destructive' },
          ]}
          disclaimer="This baseline confirms the Knowledge Vault module is approved for planning and structure review only."
        >
          <SnapshotExportButton
            snapshot={{
              snapshotType: 'KNOWLEDGE_VAULT_PLANNING_BASELINE',
              baselineName: 'Knowledge Vault Planning Baseline',
              baselineStatus: 'APPROVED',
              mode: 'PLANNING_ONLY',
              documentUpload: 'DISABLED',
              aiIndexing: 'DISABLED',
              vaultSync: 'DISABLED',
              credentialStorage: 'DISABLED',
              privateDocuments: 'NOT_COLLECTED',
              externalConnectors: 'DISABLED',
              generatedAt: new Date().toISOString(),
              safetyClaims: [
                'No document upload',
                'No AI indexing',
                'No vault sync',
                'No credential storage',
                'No private document collection',
                'No external connectors',
                'Planning-only baseline mode',
              ],
            }}
            filenamePrefix="knowledge-vault-baseline-snapshot"
            label="Export Knowledge Vault Snapshot"
          />
        </BaselineCard>

        {/* Grid of sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 1. SOP Library */}
          <KnowledgeSection
            title="1. SOP Library"
            description="Standard operating procedures for critical systems and workflows"
            items={[
              'OpenClaw gateway check SOP',
              'Trading paper setup SOP',
              'Credit monitoring SOP',
              'Business operations SOP',
              'Entity maintenance SOP',
              'Emergency disable SOP',
            ]}
          />

          {/* 2. Entity Structure */}
          <KnowledgeSection
            title="2. Entity Structure"
            description="Organizational entities and their governance relationships"
            items={[
              'Genesis Family Trust (primary trust)',
              'GFM Administrative Services LLC',
              'Veridian Capital Management LLC',
              'Tekram Analytics',
              'MetaEdge Capital',
              'Future operating entities',
            ]}
          />

          {/* 3. Trading Rules */}
          <KnowledgeSection
            title="3. Trading Rules"
            description="Strategy, risk limits, and session governance for paper trading"
            items={[
              'Market: MNQ (Micro Nasdaq Futures)',
              'Strategy: 2 / 25 / 200 + MACD zero-line',
              'Risk limits: $500 max daily loss, $1000 max gain',
              'Session: New York RTH only',
              'No live trading without authorization',
              'No broker order routing until approved',
            ]}
          />

          {/* 4. Credit Rules */}
          <KnowledgeSection
            title="4. Credit Rules"
            description="Credit monitoring and dispute management policies"
            items={[
              'Personal credit monitoring',
              'Business credit readiness',
              'Dispute management procedures',
              'Tradeline tracking',
              'Funding readiness assessment',
              'No automatic dispute submission yet',
            ]}
          />

          {/* 5. Trust / LLC Notes */}
          <KnowledgeSection
            title="5. Trust / LLC Governance"
            description="Trust governance, trustee responsibilities, and operating agreements"
            items={[
              'Trust governance framework',
              'Trustee/manager responsibilities',
              'Operating agreement references',
              'Asset routing and allocation notes',
              'Lending policy and constraints',
              'Audit record requirements',
            ]}
          />

          {/* 6. API / Key Storage Policy */}
          <KnowledgeSection
            title="6. API & Key Storage Policy"
            description="Security rules for credentials, keys, and secrets"
            items={[
              'No API keys in frontend',
              'No API keys in localStorage',
              'No API keys in Obsidian vault',
              'Backend env variables or managed vault only',
              'Presence checks only (no value exposure)',
              'Secret values never returned to UI',
            ]}
          />

          {/* 7. Build Map */}
          <KnowledgeSection
            title="7. Current Build Areas"
            description="Modules and dashboards currently in development"
            items={[
              'OpenClaw governance framework',
              'OpenClaw gateway health monitoring',
              'Trading paper readiness contracts',
              'Credential safety policy stack',
              'Knowledge vault (this dashboard)',
              'Future: Credit/public-side dashboard',
              'Future: Business operations dashboard',
            ]}
          />

          {/* 8. Operator Instructions */}
          <KnowledgeSection
            title="8. Operator Instructions"
            description="Guidelines for using Veridan Core dashboards and systems"
            items={[
              'Always use dashboards before detailed panels',
              'If status shows HOLD, stop and fix missing step',
              'Never enter credentials into UI forms',
              'Never enable live execution without approval',
              'Use paper/sandbox mode before live systems',
              'Keep evidence and audit records for all actions',
              'Refer to SOP Library when uncertain',
            ]}
          />
        </div>

        {/* Knowledge Vault Planning Section */}
        <div className="mt-8">
          <div className="mb-4">
            <h2 className="text-2xl font-mono font-bold text-slate-100">Knowledge Vault Planning</h2>
            <p className="mt-2 text-[13px] font-mono text-slate-300">
              Strategic planning for Knowledge Vault capabilities, governance structure, and safety gates before document, upload, and AI indexing features are enabled.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* 1. Purpose Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
                <h3 className="text-[11px] font-mono font-bold uppercase text-slate-100">1. Purpose</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Centralized internal knowledge repository for operators</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Store SOPs, trading rules, credit policies, and governance</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Future sync with Obsidian as source of truth</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-primary shrink-0 mt-0.5">•</span>
                    <span>Read-only governance reference for all modules</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Safe Now Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-emerald-500/10 border-b border-emerald-500/20">
                <h3 className="text-[11px] font-mono font-bold uppercase text-emerald-400">2. Safe Now</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Read-only access to vault content</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Viewing SOPs and governance rules</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Operator reference for all procedures</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                    <span>Planning and scoping knowledge categories</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Blocked Until Later Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20">
                <h3 className="text-[11px] font-mono font-bold uppercase text-destructive/80">3. Blocked Until Later</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Document upload functionality</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>File parsing and extraction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>AI indexing and semantic search</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Private document storage and retrieval</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-destructive/70 shrink-0 mt-0.5">✕</span>
                    <span>Credential or sensitive data storage</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Future Knowledge Categories Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-700/10 border-b border-slate-700/20">
                <h3 className="text-[11px] font-mono font-bold uppercase text-slate-300">4. Future Knowledge Categories</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0 mt-0.5">→</span>
                    <span>Compliance documentation (legal, regulatory)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0 mt-0.5">→</span>
                    <span>Audit trails and evidence archives</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0 mt-0.5">→</span>
                    <span>Change logs and version history</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0 mt-0.5">→</span>
                    <span>Integration guides (brokers, APIs, systems)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0 mt-0.5">→</span>
                    <span>Troubleshooting and runbooks</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Governance Requirements Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-cyan-500/10 border-b border-cyan-500/20">
                <h3 className="text-[11px] font-mono font-bold uppercase text-cyan-400">5. Governance Requirements Before Uploads or AI Indexing</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Define document access control and role-based permissions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Establish PII detection and redaction rules</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Approve AI indexing scope and limitations</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Define data retention and archive policies</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Establish audit logging for all document access</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-cyan-400 shrink-0 mt-0.5">◇</span>
                    <span>Require human review before search results are exposed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Next Development Step Card */}
            <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
              <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                <h3 className="text-[11px] font-mono font-bold uppercase text-amber-400">6. Next Development Step</h3>
              </div>
              <div className="p-4 space-y-2">
                <div className="text-[10px] font-mono text-slate-300 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Finalize knowledge categories and SOP structure</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Define Obsidian vault sync design and safety gates</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Design document upload workflow with governance approval</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Build read-only preview mode before live indexing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-amber-400 shrink-0 mt-0.5">→</span>
                    <span>Establish audit trail and compliance requirements</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
          <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[9px] font-mono text-muted-foreground/70">
            <p className="font-bold mb-1">About the Knowledge Vault</p>
            <p>This dashboard is a read-only reference for Veridan Core's internal procedures, rules, and governance. It organizes operational knowledge across trading, credit, entities, and security. In future phases, this will sync with your Obsidian vault as a bidirectional source of truth.</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}