import React from 'react';
import { CheckCircle2, AlertTriangle, Clock, Archive, XCircle, Copy, Unlink, FileText } from 'lucide-react';

function ScoreRing({ score }) {
  const color = score >= 70 ? 'text-primary' : score >= 40 ? 'text-amber-400' : 'text-destructive';
  const label = score >= 70 ? 'HEALTHY' : score >= 40 ? 'NEEDS ATTENTION' : 'AT RISK';
  return (
    <div className="flex flex-col items-center justify-center px-6 py-4 border border-border/40 bg-card rounded-sm">
      <div className={`text-4xl font-mono font-bold ${color}`}>{score}</div>
      <div className="text-[7px] font-mono text-slate-500 mt-0.5">/ 100</div>
      <div className={`text-[8px] font-bold uppercase mt-1.5 ${color}`}>{label}</div>
      <div className="text-[6px] font-mono text-slate-600 mt-0.5">VAULT HEALTH SCORE</div>
    </div>
  );
}

function StatCell({ icon: Icon, label, value, color = 'text-slate-200', warn }) {
  return (
    <div className={`flex flex-col gap-1 px-3 py-2.5 border rounded-sm bg-card/80 ${warn ? 'border-amber-500/30' : 'border-border/30'}`}>
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3 h-3 ${warn ? 'text-amber-400' : 'text-slate-500'}`} />
        <span className="text-[7px] font-mono text-slate-500 uppercase">{label}</span>
      </div>
      <span className={`text-[14px] font-mono font-bold ${color}`}>{value ?? '—'}</span>
    </div>
  );
}

export default function VaultHealthSummary({ stats, loading }) {
  if (loading) {
    return (
      <div className="border border-border/40 bg-card rounded-sm p-6 text-center text-[8px] font-mono text-slate-500">
        Analyzing vault records…
      </div>
    );
  }

  const { healthScore, totalDrafts, approvedDrafts, pendingDrafts, writtenDrafts,
          archivedDrafts, failedWrites, duplicateCandidates, orphanCandidates, lastWriteTimestamp } = stats;

  return (
    <div className="border border-border/40 bg-card rounded-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/30 bg-card/80">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Vault Health Summary</span>
        <span className="ml-2 text-[7px] font-mono text-slate-500">— live from VeridanObsidianDraft + VeridanObsidianWriteAudit entities</span>
      </div>
      <div className="p-4 flex gap-4 flex-wrap">
        <ScoreRing score={healthScore} />
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <StatCell icon={FileText}    label="Total Drafts"       value={totalDrafts}         color="text-slate-200" />
          <StatCell icon={CheckCircle2} label="Approved"          value={approvedDrafts}      color="text-primary" />
          <StatCell icon={Clock}        label="Pending Review"    value={pendingDrafts}       color="text-amber-400" warn={pendingDrafts > 0} />
          <StatCell icon={CheckCircle2} label="Written to Vault"  value={writtenDrafts}       color="text-primary" />
          <StatCell icon={Archive}      label="Archived"          value={archivedDrafts}      color="text-slate-400" />
          <StatCell icon={XCircle}      label="Failed Writes"     value={failedWrites}        color={failedWrites > 0 ? 'text-destructive' : 'text-slate-400'} warn={failedWrites > 0} />
          <StatCell icon={Copy}         label="Duplicate Candidates" value={duplicateCandidates} color={duplicateCandidates > 0 ? 'text-amber-400' : 'text-slate-400'} warn={duplicateCandidates > 0} />
          <StatCell icon={Unlink}       label="Orphan Candidates" value={orphanCandidates}   color={orphanCandidates > 0 ? 'text-amber-400' : 'text-slate-400'} warn={orphanCandidates > 0} />
        </div>
      </div>
      {lastWriteTimestamp && lastWriteTimestamp !== '—' && (
        <div className="px-4 py-2 border-t border-border/20 text-[7px] font-mono text-slate-500">
          Latest write audit: <span className="text-slate-300">{lastWriteTimestamp}</span>
        </div>
      )}
    </div>
  );
}