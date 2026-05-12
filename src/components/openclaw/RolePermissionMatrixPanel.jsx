import React, { useState } from 'react';
import { ROLES, PERMISSIONS, ROLE_PERMISSIONS, ROLE_METADATA } from '@/lib/rbac';
import { ChevronDown, ChevronRight, Shield, Lock, Eye, CheckCircle2, AlertTriangle } from 'lucide-react';

const PERMISSION_METADATA = {
  canViewOpenClaw: { label: 'View OpenClaw Panels', category: 'Core Access', critical: true },
  canRunReadOnlyTests: { label: 'Run Read-Only Tests', category: 'Execution', critical: false },
  canApproveCommands: { label: 'Approve Commands', category: 'Approval', critical: true },
  canReviewChecklist: { label: 'Review Production Checklist', category: 'Governance', critical: true },
  canViewAudit: { label: 'View Audit Logs', category: 'Audit', critical: true },
  canManageConnectors: { label: 'Manage System Connectors', category: 'Admin', critical: false },
  canUseLiveExecution: { label: 'Use Live Execution', category: 'Execution (DISABLED)', critical: true },
};

function PermissionCell({ role, permission, hasPermission: permitted }) {
  const isLiveExecution = permission === PERMISSIONS.canUseLiveExecution;
  
  return (
    <div className={`flex items-center justify-center py-2 px-1.5 border-r border-b border-border/30 text-[9px] font-semibold ${
      permitted && !isLiveExecution
        ? 'bg-primary/10 text-primary'
        : isLiveExecution
        ? 'bg-destructive/5 text-destructive/70 line-through'
        : 'bg-muted/5 text-slate-400'
    }`}>
      {permitted && !isLiveExecution ? (
        <CheckCircle2 className="w-3.5 h-3.5" />
      ) : isLiveExecution ? (
        <Lock className="w-3.5 h-3.5" />
      ) : (
        <Eye className="w-3.5 h-3.5 opacity-30" />
      )}
    </div>
  );
}

export default function RolePermissionMatrixPanel() {
  const [expandedPermission, setExpandedPermission] = useState(null);

  const permissionsByCategory = {};
  Object.entries(PERMISSION_METADATA).forEach(([perm, meta]) => {
    if (!permissionsByCategory[meta.category]) {
      permissionsByCategory[meta.category] = [];
    }
    permissionsByCategory[meta.category].push(perm);
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Access Control</div>
          <div className="text-[13px] font-semibold text-foreground">Role-Permission Matrix</div>
        </div>
        <Shield className="w-5 h-5 text-primary" />
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Live execution is disabled for all roles.</div>
          <div className="text-[9px] text-primary/70">No role, including OWNER and ADMIN, can enable live execution. All governance, approval workflows, and safety constraints remain in effect.</div>
        </div>
      </div>

      {/* Role overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {Object.entries(ROLE_METADATA).map(([roleKey, roleMeta]) => {
          const perms = ROLE_PERMISSIONS[roleKey];
          return (
            <div key={roleKey} className="border border-border/50 rounded-lg bg-card/50 p-3 space-y-2">
              <div className="text-[10px] font-semibold text-foreground">{roleMeta.displayName}</div>
              <div className="text-[8px] text-slate-300 line-clamp-2">{roleMeta.description}</div>
              <div className="flex items-center justify-between pt-1 border-t border-border/30">
                <span className="text-[8px] text-slate-400 uppercase tracking-wider font-semibold">Permissions</span>
                <span className="text-[9px] font-semibold text-primary">{perms.length}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission matrix table */}
      <div className="border border-border/50 rounded-lg bg-card overflow-hidden">
        {/* Header row with role names */}
        <div className="flex">
          <div className="w-48 flex-shrink-0 bg-secondary/20 border-r border-b border-border/30 px-3 py-3 font-semibold text-[10px] uppercase tracking-wider text-slate-200">
            Permission
          </div>
          {Object.entries(ROLE_METADATA).map(([roleKey, roleMeta]) => (
            <div key={roleKey} className="flex-1 min-w-24 bg-secondary/10 border-r border-b border-border/30 px-2 py-3 font-semibold text-[9px] uppercase tracking-wider text-slate-200 text-center">
              {roleMeta.displayName}
            </div>
          ))}
        </div>

        {/* Permission rows grouped by category */}
        {Object.entries(permissionsByCategory).map(([category, perms]) => (
          <div key={category}>
            {/* Category header */}
            <div className="flex bg-secondary/5 border-b border-border/20">
              <div className="w-48 flex-shrink-0 px-3 py-2 font-semibold text-[8px] uppercase tracking-widest text-slate-400">
                {category}
              </div>
              <div className="flex-1" />
            </div>

            {/* Permission rows */}
            {perms.map((perm) => {
              const meta = PERMISSION_METADATA[perm];
              const isExpanded = expandedPermission === perm;
              
              return (
                <div key={perm}>
                  <div className="flex hover:bg-primary/2 transition-colors">
                    <div
                      className="w-48 flex-shrink-0 border-r border-border/30 px-3 py-2 cursor-pointer hover:bg-secondary/20 flex items-center justify-between group"
                      onClick={() => setExpandedPermission(isExpanded ? null : perm)}
                    >
                      <div>
                        <div className="text-[9px] font-semibold text-slate-200">{meta.label}</div>
                        {meta.critical && (
                          <div className="text-[8px] text-destructive/80 mt-0.5 font-semibold">⚠️ Critical</div>
                        )}
                      </div>
                      <div className="text-slate-500 group-hover:text-slate-300">
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </div>
                    </div>

                    {/* Permission cells for each role */}
                    {Object.keys(ROLE_METADATA).map((roleKey) => {
                      const hasPermission = ROLE_PERMISSIONS[roleKey].includes(perm);
                      return (
                        <div key={`${perm}-${roleKey}`} className="flex-1 min-w-24 border-r border-border/30">
                          <PermissionCell role={roleKey} permission={perm} hasPermission={hasPermission} />
                        </div>
                      );
                    })}
                  </div>

                  {/* Expanded description */}
                  {isExpanded && (
                    <div className="flex border-t border-border/20 bg-secondary/5">
                      <div className="w-48 flex-shrink-0 border-r border-border/30 px-3 py-2 bg-card/50" />
                      <div className="flex-1 px-3 py-2 col-span-5">
                        <div className="text-[9px] text-slate-300 space-y-1">
                          {perm === 'canViewOpenClaw' && (
                            <>
                              <div><span className="font-semibold">Access:</span> View OpenClaw Control panels based on role</div>
                              <div><span className="font-semibold">Required for:</span> All operations</div>
                            </>
                          )}
                          {perm === 'canRunReadOnlyTests' && (
                            <>
                              <div><span className="font-semibold">Access:</span> Run safe, read-only browser commands and simulations</div>
                              <div><span className="font-semibold">Restrictions:</span> No live execution, no mutations, read-only only</div>
                            </>
                          )}
                          {perm === 'canApproveCommands' && (
                            <>
                              <div><span className="font-semibold">Access:</span> Approve pending command proposals and workflows</div>
                              <div><span className="font-semibold">Restrictions:</span> Cannot execute, only approve</div>
                            </>
                          )}
                          {perm === 'canReviewChecklist' && (
                            <>
                              <div><span className="font-semibold">Access:</span> Review and mark production readiness checklist items</div>
                              <div><span className="font-semibold">Scope:</span> Audit-only, no execution impact</div>
                            </>
                          )}
                          {perm === 'canViewAudit' && (
                            <>
                              <div><span className="font-semibold">Access:</span> View command execution history, legacy reviews, and audit trails</div>
                              <div><span className="font-semibold">Restrictions:</span> Read-only, no modifications</div>
                            </>
                          )}
                          {perm === 'canManageConnectors' && (
                            <>
                              <div><span className="font-semibold">Access:</span> Configure and manage system connector health and status</div>
                              <div><span className="font-semibold">Restrictions:</span> No secret exposure, governance enforcement maintained</div>
                            </>
                          )}
                          {perm === 'canUseLiveExecution' && (
                            <>
                              <div><span className="font-semibold">Status:</span> <span className="text-destructive font-semibold">PERMANENTLY DISABLED</span></div>
                              <div><span className="font-semibold">Reason:</span> Live execution is not permitted for any role at this time</div>
                              <div><span className="font-semibold">Impact:</span> All operations remain in SIMULATED or READ_ONLY mode</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-2">
        <div className="text-[10px] font-semibold text-foreground mb-2">Legend</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[9px]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-slate-300">Permission Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-300">Permission Denied</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-destructive/70 line-through" />
            <span className="text-destructive/80">Permanently Disabled</span>
          </div>
        </div>
      </div>

      {/* Safety footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg text-[9px] text-primary/80">
        <Shield className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-0.5">Access control is enforced server-side.</div>
          <div className="text-[8px] text-primary/70">This matrix shows configured roles and permissions. All governance, approval workflows, and security constraints are applied at the backend level. Live execution remains permanently disabled.</div>
        </div>
      </div>
    </div>
  );
}