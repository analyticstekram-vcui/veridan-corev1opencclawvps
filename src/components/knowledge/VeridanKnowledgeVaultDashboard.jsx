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
import { BookOpen, Lock, Info } from 'lucide-react';

function KnowledgeSection({ title, description, items }) {
  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
      <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
        <h3 className="text-[11px] font-mono font-bold uppercase text-foreground">{title}</h3>
        <p className="text-[9px] font-mono text-muted-foreground/70 mt-1">{description}</p>
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-mono font-bold text-foreground">Veridan Knowledge Vault</h1>
          </div>
          <p className="text-[13px] font-mono text-muted-foreground/70">
            Internal system brain for SOPs, rules, entities, and operator instructions
          </p>
          <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-muted-foreground/50">
            <Lock className="w-3 h-3" />
            Read-only reference · No edits yet · Future Obsidian sync
          </div>
        </div>

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
  );
}