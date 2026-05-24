import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import OpenClawTaskPreviewSender from '../openclaw/OpenClawTaskPreviewSender';

const statusConfig = {
  PROPOSED_NOT_EXECUTED: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  DRAFT: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  READY_FOR_REVIEW: { icon: CheckCircle2, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  APPROVED_PREVIEW: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  REJECTED: { icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

const sourceLabel = {
  OBSIDIAN_WORKBENCH: '🔹 Obsidian',
  TRADING_MODULE: '📈 Trading',
  CREDIT_MODULE: '💳 Credit',
  BUSINESS_MODULE: '🏢 Business',
  OPENCLAW: '🔒 OpenClaw',
};

export default function OpenClawTaskQueueItem({ task }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[task.status] || statusConfig.DRAFT;
  const Icon = cfg.icon;
  const src = sourceLabel[task.source] || 'Task';

  return (
    <div className={`border rounded-sm ${cfg.border} ${cfg.bg} overflow-hidden`}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start justify-between gap-3 p-3 hover:bg-black/20 transition-colors"
      >
        <div className="flex items-start gap-2 flex-1 min-w-0 text-left">
          <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-bold text-slate-100 break-words">{task.title}</div>
            <div className="text-[7px] text-slate-500 font-mono mt-0.5 space-x-2 flex flex-wrap">
              <span>{src}</span>
              <span>·</span>
              <span className={`font-bold ${cfg.color}`}>{task.status}</span>
              <span>·</span>
              <span>{task.taskType || 'TASK'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-[6px] text-slate-500 text-right font-mono">
            {new Date(task.createdAt).toLocaleTimeString()}
          </div>
          {expanded ? <ChevronUp className="w-3 h-3 text-slate-500" /> : <ChevronDown className="w-3 h-3 text-slate-500" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-current/20 bg-black/10 p-3 space-y-3">
          {task.description && (
            <div className="text-[7px] text-slate-400 font-mono">{task.description}</div>
          )}
          {task.source === 'OBSIDIAN_WORKBENCH' && (
            <OpenClawTaskPreviewSender task={task} />
          )}
          <div className="text-[7px] text-slate-500 font-mono space-y-0.5 pt-2 border-t border-current/20">
            <div>taskId: <span className="text-slate-300">{task.taskId}</span></div>
            <div>approvalState: <span className="text-slate-300">{task.approvalState}</span></div>
            <div>riskLevel: <span className="text-slate-300">{task.riskLevel || '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}