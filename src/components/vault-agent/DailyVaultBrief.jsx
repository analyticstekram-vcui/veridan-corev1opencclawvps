import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

function BriefSection({ title, items, color = 'text-slate-300', emptyMsg }) {
  return (
    <div className="space-y-1.5">
      <div className={`text-[8px] font-bold uppercase tracking-widest ${color}`}>{title}</div>
      {items.length === 0
        ? <div className="text-[7px] font-mono text-slate-600">{emptyMsg}</div>
        : items.map((item, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[7px] font-mono text-slate-400">
            <span className={`${color} font-bold shrink-0`}>•</span>
            <span>{item}</span>
          </div>
        ))
      }
    </div>
  );
}

function NextActionRow({ label, path, badge }) {
  return (
    <Link to={path} className="flex items-center justify-between px-3 py-2 bg-background/50 border border-border/30 rounded-sm hover:border-primary/30 hover:bg-primary/5 transition-colors group">
      <span className="text-[8px] font-mono text-slate-300 group-hover:text-primary transition-colors">{label}</span>
      <div className="flex items-center gap-2">
        {badge && <span className="text-[6px] font-bold uppercase border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-sm">{badge}</span>}
        <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
}

export default function DailyVaultBrief({ stats, domainCoverage, recentWrites, pendingDrafts, loading }) {
  if (loading) return null;

  const { healthScore, failedWrites, duplicateCandidates, orphanCandidates, coveragePct } = stats;

  // Build top risks
  const risks = [];
  if (failedWrites > 0) risks.push(`${failedWrites} failed write(s) detected — check vault bridge`);
  if (duplicateCandidates > 0) risks.push(`${duplicateCandidates} duplicate draft candidate(s) — run cleanup`);
  if (orphanCandidates > 0) risks.push(`${orphanCandidates} orphan audit record(s) — reconciliation needed`);
  if (coveragePct < 30) risks.push(`Domain coverage is critically low (${coveragePct}%) — many required docs missing`);
  if (coveragePct < 60 && coveragePct >= 30) risks.push(`Domain coverage is below target (${coveragePct}%) — prioritize missing docs`);
  if (pendingDrafts.length > 5) risks.push(`${pendingDrafts.length} drafts awaiting approval — review queue`);
  if (risks.length === 0) risks.push('No critical risks detected at this time');

  // Missing domain priorities
  const criticalDomains = domainCoverage
    .filter(d => d.missing > 0 && d.priority === 'CRITICAL')
    .map(d => `${d.domain}: ${d.missing} document(s) missing`);

  const pendingNames = pendingDrafts.slice(0, 5).map(d => d.filename || d.title || d.draftId || '—');
  const recentWriteNames = (recentWrites || []).slice(0, 5).map(a => `${a.filename || '—'} → ${(a.filePath || '').split('/').pop()}`);

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/30 bg-card/80 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-accent" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Daily Vault Brief</span>
          <span className="text-[7px] font-mono text-slate-500">— {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
        <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded-sm border ${
          healthScore >= 70 ? 'text-primary border-primary/30 bg-primary/10' :
          healthScore >= 40 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
          'text-destructive border-destructive/30 bg-destructive/10'
        }`}>
          Health Score: {healthScore}/100
        </span>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <BriefSection
            title="⚠ Top Risks"
            items={risks}
            color="text-amber-400"
            emptyMsg="No risks detected"
          />
          <BriefSection
            title="✗ Critical Missing Domains"
            items={criticalDomains.length > 0 ? criticalDomains : ['All critical domains have at least one document']}
            color="text-destructive"
            emptyMsg="All covered"
          />
          <BriefSection
            title="⏳ Drafts Awaiting Approval"
            items={pendingNames.length > 0 ? pendingNames : ['No drafts pending review']}
            color="text-amber-400"
            emptyMsg="No pending drafts"
          />
        </div>
        <div className="space-y-4">
          <BriefSection
            title="✓ Recent Vault Writes"
            items={recentWriteNames.length > 0 ? recentWriteNames : ['No recent writes']}
            color="text-primary"
            emptyMsg="No recent writes found"
          />

          {/* Next Actions */}
          <div className="space-y-1.5">
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-300">Recommended Next Actions</div>
            <div className="space-y-1">
              {pendingDrafts.length > 0 && (
                <NextActionRow label={`Review ${pendingDrafts.length} pending draft(s)`} path="/obsidian-draft-review" badge="APPROVAL_REQUIRED" />
              )}
              {failedWrites > 0 && (
                <NextActionRow label="Investigate failed writes" path="/vault-file-index" badge="ACTION_NEEDED" />
              )}
              {duplicateCandidates > 0 && (
                <NextActionRow label="Run duplicate cleanup" path="/vault-file-index" badge="CLEANUP" />
              )}
              <NextActionRow label="Run vault pack workflow" path="/obsidian-workbench-preview" />
              <NextActionRow label="Open vault file index" path="/vault-file-index" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}