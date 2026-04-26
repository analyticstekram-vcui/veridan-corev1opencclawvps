import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, CheckCircle2, Loader2 } from 'lucide-react';

const RISK_MAP = {
  'system.status': 'low',
  'logs.fetch':    'low',
  'session.list':  'medium',
};
const REQUIRED = { low: 1, medium: 2 };

export default function MultiSigApprovalBar({ command, currentUser, onUpdated }) {
  const [loading, setLoading] = useState(false);

  const riskLevel   = RISK_MAP[command.commandText?.trim()] || command.riskLevel;
  const required    = REQUIRED[riskLevel] || 1;
  const approvers   = Array.isArray(command.approvers) ? command.approvers : [];
  const hasApproved = approvers.includes(currentUser?.email);
  const count       = new Set(approvers).size;
  const complete    = count >= required;

  if (required <= 1 || command.status !== 'approved') return null;

  const handleSecondApproval = async () => {
    if (hasApproved || !currentUser?.email) return;
    setLoading(true);
    const newApprovers = [...new Set([...approvers, currentUser.email])];
    const existing = Array.isArray(command.auditLog) ? command.auditLog : [];
    await base44.entities.OpenClawCommand.update(command.id, {
      approvers: newApprovers,
      auditLog: [...existing, {
        eventType: 'OPENCLAW_MULTISIG_COSIGNED',
        approver: currentUser.email,
        timestamp: new Date().toISOString(),
        totalApprovers: newApprovers.length,
      }],
    });
    setLoading(false);
    if (onUpdated) onUpdated();
  };

  return (
    <div className={`px-4 py-3 border-b font-mono ${complete ? 'border-primary/20 bg-primary/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className={`w-3.5 h-3.5 ${complete ? 'text-primary' : 'text-amber-500'}`} />
          <div>
            <div className={`text-[11px] font-semibold ${complete ? 'text-primary' : 'text-amber-500'}`}>
              Multi-Sig: {count}/{required} approvers
            </div>
            <div className="text-[10px] text-muted-foreground/50">
              MEDIUM risk requires {required} distinct approvers · {approvers.join(', ') || 'none yet'}
            </div>
          </div>
        </div>

        {!complete && !hasApproved && currentUser && (
          <button
            onClick={handleSecondApproval}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] hover:bg-amber-500/20 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Co-Sign
          </button>
        )}

        {complete && (
          <span className="text-[10px] text-primary uppercase tracking-wider">Multi-sig complete</span>
        )}
        {hasApproved && !complete && (
          <span className="text-[10px] text-muted-foreground/60">Awaiting 2nd approver</span>
        )}
      </div>
    </div>
  );
}