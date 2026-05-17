/**
 * VeridanCoreBranchDashboard
 * Central navigation dashboard showing all major Veridan Core branches.
 * Read-only status cards with safe navigation links.
 *
 * Does NOT:
 *   - Call OpenClaw
 *   - Call trading brokers
 *   - Call credit bureaus
 *   - Call banks
 *   - Process payments
 *   - Collect credentials
 *   - Write localStorage
 *   - Execute anything
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, AlertCircle, CheckCircle2, Lock } from 'lucide-react';

function BranchCard({ title, description, status, details, buttonLabel, buttonPath }) {
  const navigate = useNavigate();

  const statusColors = {
    'ACTIVE_PREVIEW': 'text-green-500 border-green-500/30 bg-green-500/5',
    'PAPER_PLANNING': 'text-amber-500 border-amber-500/30 bg-amber-500/5',
    'PLANNING_READY': 'text-blue-500 border-blue-500/30 bg-blue-500/5',
    'READ_ONLY_READY': 'text-slate-400 border-slate-600/30 bg-slate-600/5',
  };

  return (
    <div className="bg-card border border-border/50 rounded-sm overflow-hidden hover:border-border transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-mono font-bold text-foreground">{title}</h3>
            <p className="text-[11px] font-mono text-muted-foreground/70 mt-1">{description}</p>
          </div>
          <div className={`px-2 py-1 rounded-sm border text-[8px] font-mono font-bold ${statusColors[status] || 'text-slate-400'}`}>
            {status}
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-1.5 mb-4">
          {details.map((detail, idx) => (
            <div key={idx} className="flex items-center gap-2 text-[9px] font-mono">
              <CheckCircle2 className="w-3 h-3 text-slate-500 shrink-0" />
              <span className="text-muted-foreground/80">
                {detail.label}: <span className="text-foreground font-bold">{detail.value}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Navigation button */}
        <button
          onClick={() => navigate(buttonPath)}
          className="w-full flex items-center justify-between px-3 py-2 bg-primary/10 border border-primary/30 rounded-sm text-primary hover:bg-primary/20 transition-colors text-[10px] font-mono font-bold"
        >
          <span>{buttonLabel}</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function VeridanCoreBranchDashboard() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-mono font-bold text-foreground">Veridan Core</h1>
          </div>
          <p className="text-[14px] font-mono text-muted-foreground/70">
            Central dashboard for all Veridan Core operations and planning modules
          </p>
          <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-muted-foreground/50">
            <Lock className="w-3 h-3" />
            All modules running in safe/planning mode · No live execution
          </div>
        </div>

        {/* Branch Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
          {/* 1. OpenClaw / AI Governance */}
          <BranchCard
            title="OpenClaw / AI Governance"
            description="AI command framework, execution governance, and safety enforcement"
            status="ACTIVE_PREVIEW"
            details={[
              { label: 'Gateway Health', value: 'AVAILABLE' },
              { label: 'Execution Mode', value: 'DISABLED' },
              { label: 'Dry Run Preview', value: 'ACTIVE' },
            ]}
            buttonLabel="Open OpenClaw Panel"
            buttonPath="/openclaw-control"
          />

          {/* 2. Trading / Paper Planning */}
          <BranchCard
            title="Trading / Paper Planning"
            description="Paper trading environment, strategy definition, and broker readiness"
            status="PAPER_PLANNING"
            details={[
              { label: 'Broker Connection', value: 'NOT_CONNECTED' },
              { label: 'Live Trading', value: 'DISABLED' },
              { label: 'Paper Mode', value: 'PLANNING' },
            ]}
            buttonLabel="Open Trading Console"
            buttonPath="/control-room"
          />

          {/* 3. Credit / Public Side */}
          <BranchCard
            title="Credit / Public Side"
            description="Personal and business credit monitoring, dispute tracking, and readiness"
            status="PLANNING_READY"
            details={[
              { label: 'Bureau Connection', value: 'DISABLED' },
              { label: 'Dispute Submission', value: 'DISABLED' },
              { label: 'Monitoring Status', value: 'PLANNING' },
            ]}
            buttonLabel="Open Credit Dashboard"
            buttonPath="/credit-public-side"
          />

          {/* 4. Business Operations */}
          <BranchCard
            title="Business Operations"
            description="Income-producing ventures, revenue tracking, and operations planning"
            status="PLANNING_READY"
            details={[
              { label: 'Payment Processing', value: 'DISABLED' },
              { label: 'Automation Execution', value: 'DISABLED' },
              { label: 'Task Tracking', value: 'PREVIEW' },
            ]}
            buttonLabel="Open Business Operations"
            buttonPath="/business-operations"
          />

          {/* 5. Knowledge Vault */}
          <BranchCard
            title="Knowledge Vault"
            description="Internal system brain, SOPs, rules, entities, and operator instructions"
            status="READ_ONLY_READY"
            details={[
              { label: 'Obsidian Sync', value: 'FUTURE' },
              { label: 'Backend Writes', value: 'DISABLED' },
              { label: 'Access Mode', value: 'READ_ONLY' },
            ]}
            buttonLabel="Open Knowledge Vault"
            buttonPath="/knowledge-vault"
          />
        </div>

        {/* Safety Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Safety Status */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-foreground">Global Safety Status</h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Live Execution: DISABLED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Trading Execution: DISABLED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Credential Entry: DISABLED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Money Movement: DISABLED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border border-amber-500/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="text-[9px] font-mono text-amber-500">Backend Writes: CONTROLLED / MOSTLY DISABLED</span>
              </div>
            </div>
          </div>

          {/* Right: Module Connection Status */}
          <div className="bg-card border border-border/50 rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-secondary/30 border-b border-border/40">
              <h2 className="text-[11px] font-mono font-bold uppercase text-foreground">Module Connection Status</h2>
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Trading Brokers: NOT CONNECTED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Credit Bureaus: NOT CONNECTED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Banks: NOT CONNECTED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/5 border border-destructive/30 rounded-sm">
                <AlertCircle className="w-3 h-3 text-destructive shrink-0" />
                <span className="text-[9px] font-mono text-destructive">Payment Processors: NOT CONNECTED</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-600/5 border border-slate-600/30 rounded-sm">
                <CheckCircle2 className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="text-[9px] font-mono text-muted-foreground/80">All connections safe/disabled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-8 p-4 bg-secondary/20 border border-border/30 rounded-sm flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-[9px] font-mono text-muted-foreground/70">
            <p className="font-bold mb-1">About Veridan Core</p>
            <p>Veridan Core is a comprehensive AI-governance platform for managing credit, trading, business operations, and knowledge systems. All modules are running in safe planning mode with no live execution, no credential entry, no money movement, and no backend writes except for controlled audit/logging functions. Use the branch cards above to navigate to specific operational areas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}