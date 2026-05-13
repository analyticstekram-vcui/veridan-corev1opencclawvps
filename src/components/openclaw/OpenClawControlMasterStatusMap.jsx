import React from 'react';
import { CheckCircle2, AlertTriangle, Lock, Eye } from 'lucide-react';

export default function OpenClawControlMasterStatusMap() {
  const layers = [
    {
      name: 'A. Governance Shell',
      color: 'slate',
      items: [
        {
          name: 'System Verify',
          status: 'ACTIVE',
          purpose: 'Verify system integrity and operator readiness',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Operator Checklist',
          status: 'ACTIVE',
          purpose: 'Track operator sign-off and approvals',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Release Approval Records',
          status: 'ACTIVE',
          purpose: 'Log approval decisions and audit trail',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Governance Consistency Audit',
          status: 'ACTIVE',
          purpose: 'Verify governance state consistency',
          capability: 'PREVIEW_ONLY',
        },
      ],
    },
    {
      name: 'B. Proposal Layer',
      color: 'amber',
      items: [
        {
          name: 'Command Proposal Queue',
          status: 'ACTIVE',
          purpose: 'Queue and manage operator proposals',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Proposal Validation',
          status: 'ACTIVE',
          purpose: 'Validate proposal structure and constraints',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Proposal Approval',
          status: 'ACTIVE',
          purpose: 'Multi-sig approval workflow',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Proposal Audit Trail',
          status: 'ACTIVE',
          purpose: 'Immutable log of proposal changes',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Proposal Expiration',
          status: 'ACTIVE',
          purpose: 'Enforce time-based proposal validity',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Proposal Bundle Export',
          status: 'ACTIVE',
          purpose: 'Export proposal metadata with bundle hash',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Proposal Bundle Verification',
          status: 'ACTIVE',
          purpose: 'Verify bundle integrity and authenticity',
          capability: 'PREVIEW_ONLY',
        },
      ],
    },
    {
      name: 'C. Safe Bridge Contract Layer',
      color: 'purple',
      items: [
        {
          name: 'Safe Bridge Contract Preview',
          status: 'ACTIVE',
          purpose: 'Preview request structure before signing',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Contract Compliance Tests',
          status: 'ACTIVE',
          purpose: 'Validate request against contract constraints',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Bridge Request Builder Preview',
          status: 'ACTIVE',
          purpose: 'Interactively build bridge request payload',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Bridge Request Preview Export',
          status: 'ACTIVE',
          purpose: 'Export request preview with metadata',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Bridge Request Preview Verification',
          status: 'ACTIVE',
          purpose: 'Verify exported request integrity',
          capability: 'PREVIEW_ONLY',
        },
      ],
    },
    {
      name: 'D. Backend Bridge Security Layer',
      color: 'cyan',
      items: [
        {
          name: 'Phase 1: Validation + Audit',
          status: 'OPERATIONAL',
          purpose: 'Validate request structure and fields',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 2: Policy Gate + Replay Protection',
          status: 'OPERATIONAL',
          purpose: 'Enforce policies and detect replay attacks',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 3: Mock Signature Validation',
          status: 'OPERATIONAL',
          purpose: 'Early signature structure validation',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 4A: Secret Config Check',
          status: 'OPERATIONAL',
          purpose: 'Verify HMAC secret is configured',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 4B: Real HMAC Verifier',
          status: 'OPERATIONAL',
          purpose: 'Verify HMAC-SHA256 signatures',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 4C: Backend Signer',
          status: 'OPERATIONAL',
          purpose: 'Generate HMAC signatures for requests',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 4D: HMAC Test Suite',
          status: 'OPERATIONAL',
          purpose: 'Deterministic HMAC validation tests',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 4E: HMAC Chain Stabilization',
          status: 'STABLE',
          purpose: 'Lock HMAC validation for production',
          capability: 'PREVIEW_ONLY',
        },
      ],
    },
    {
      name: 'E. Dry-Run Bridge Layer',
      color: 'green',
      items: [
        {
          name: 'Phase 5A: Dry-Run Bridge Route',
          status: 'OPERATIONAL',
          purpose: 'Accept signed requests in dry-run mode',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 5B: Observation Dashboard',
          status: 'STABLE',
          purpose: 'Monitor dry-run audit records',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 5C: Observation Export',
          status: 'STABLE',
          purpose: 'Export audit data with SHA-256 signing',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 5D: Export Verification',
          status: 'STABLE',
          purpose: 'Verify export integrity with hash comparison',
          capability: 'PREVIEW_ONLY',
        },
        {
          name: 'Phase 5E: Final Status Dashboard',
          status: 'STABLE',
          purpose: 'Show complete dry-run readiness status',
          capability: 'PREVIEW_ONLY',
        },
      ],
    },
    {
      name: 'F. Future Disabled Layer',
      color: 'red',
      items: [
        {
          name: 'OpenClaw Gateway Connection',
          status: 'DISABLED',
          purpose: 'Connect to live OpenClaw service',
          capability: 'NONE',
        },
        {
          name: 'Browser Automation Execution',
          status: 'DISABLED',
          purpose: 'Execute real browser commands',
          capability: 'NONE',
        },
        {
          name: 'API Mutation Execution',
          status: 'DISABLED',
          purpose: 'Execute live API mutations',
          capability: 'NONE',
        },
        {
          name: 'Trading/Order Execution',
          status: 'DISABLED',
          purpose: 'Execute trades or orders',
          capability: 'NONE',
        },
        {
          name: 'Money Movement',
          status: 'DISABLED',
          purpose: 'Move funds or transfer money',
          capability: 'NONE',
        },
        {
          name: 'Credential Entry',
          status: 'DISABLED',
          purpose: 'Accept or store credentials',
          capability: 'NONE',
        },
        {
          name: 'CLICK/TYPE Execution',
          status: 'DISABLED',
          purpose: 'Execute element manipulation',
          capability: 'NONE',
        },
        {
          name: 'HIGH/CRITICAL Execution',
          status: 'DISABLED',
          purpose: 'Execute high-risk operations',
          capability: 'NONE',
        },
      ],
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      slate: 'border-slate-500/20 bg-slate-500/5',
      amber: 'border-amber-500/20 bg-amber-500/5',
      purple: 'border-purple-500/20 bg-purple-500/5',
      cyan: 'border-cyan-500/20 bg-cyan-500/5',
      green: 'border-green-500/20 bg-green-500/5',
      red: 'border-red-500/20 bg-red-500/5',
    };
    return colors[color] || colors.slate;
  };

  const getHeaderClasses = (color) => {
    const colors = {
      slate: 'border-slate-500/20 bg-slate-500/10 text-slate-400',
      amber: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
      purple: 'border-purple-500/20 bg-purple-500/10 text-purple-400',
      cyan: 'border-cyan-500/20 bg-cyan-500/10 text-cyan-400',
      green: 'border-green-500/20 bg-green-500/10 text-green-400',
      red: 'border-red-500/20 bg-red-500/10 text-red-400',
    };
    return colors[color] || colors.slate;
  };

  const getStatusColor = (status) => {
    if (status === 'DISABLED') return 'bg-red-500/20 text-red-600';
    if (status === 'STABLE') return 'bg-green-500/20 text-green-600';
    return 'bg-blue-500/20 text-blue-600';
  };

  const getCapabilityIcon = (capability) => {
    if (capability === 'NONE') return Lock;
    if (capability === 'PREVIEW_ONLY') return Eye;
    return CheckCircle2;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border border-blue-500/20 bg-blue-500/5 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-blue-500/20 bg-blue-500/10">
          <div>
            <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              OpenClaw Control: Master Status Map
            </div>
            <div className="text-[8px] text-blue-400/70 mt-1">
              Full governance, validation, signing, dry-run, and disabled layers chain.
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="px-4 py-2 border-b border-blue-500/20 flex items-center gap-1.5 flex-wrap">
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            GOVERNANCE_LOCKED
          </span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            HMAC_LOCKED
          </span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            DRY_RUN_ONLY
          </span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            OPENCLAW_NOT_CONNECTED
          </span>
          <span className="text-[7px] font-semibold text-blue-400 px-1.5 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded">
            EXECUTION_DISABLED
          </span>
        </div>

        {/* Warning */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[8px] text-amber-600">
            OpenClaw Control currently supports governance, signing, validation, dry-run preview, audit, observation, and export only. It does not execute actions.
          </span>
        </div>
      </div>

      {/* Global System Boundary */}
      <div className="border border-orange-500/20 bg-orange-500/5 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-orange-500/20 bg-orange-500/10">
          <div className="text-[8px] font-semibold text-orange-400 uppercase">Global System Boundary</div>
        </div>
        <div className="px-4 py-3 grid grid-cols-4 gap-3 text-[8px]">
          <div>
            <div className="text-slate-500 mb-0.5">Max Execution Capability</div>
            <code className="font-mono text-foreground">PREVIEW_ONLY</code>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">OpenClaw Connected</div>
            <code className="font-mono text-red-600">false</code>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">liveExecution Enabled</div>
            <code className="font-mono text-red-600">false</code>
          </div>
          <div>
            <div className="text-slate-500 mb-0.5">Execution Routes Enabled</div>
            <code className="font-mono text-red-600">false</code>
          </div>
        </div>
      </div>

      {/* Layers */}
      <div className="space-y-4">
        {layers.map((layer, layerIdx) => (
          <div key={layerIdx} className={`border rounded-lg overflow-hidden ${getColorClasses(layer.color)}`}>
            <div className={`px-4 py-3 border-b ${getHeaderClasses(layer.color)}`}>
              <div className="text-[9px] font-bold uppercase">{layer.name}</div>
            </div>

            <div className="px-4 py-3 space-y-2">
              {layer.items.map((item, itemIdx) => {
                const CapabilityIcon = getCapabilityIcon(item.capability);
                return (
                  <div key={itemIdx} className="border border-slate-500/20 bg-slate-500/5 rounded p-2.5">
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-[8px] font-semibold text-foreground">{item.name}</span>
                      <span className={`text-[7px] font-bold px-2 py-0.5 rounded ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <p className="text-[7px] text-slate-400 mb-1.5">{item.purpose}</p>

                    <div className="flex items-center gap-1.5 text-[7px]">
                      <CapabilityIcon className="w-3 h-3 text-slate-500" />
                      <code className="font-mono text-slate-500">{item.capability}</code>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Execution Chain Summary */}
      <div className="border border-slate-500/20 bg-slate-500/5 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-500/20 bg-slate-500/10">
          <div className="text-[8px] font-semibold text-slate-400 uppercase">Execution Chain Summary</div>
        </div>
        <div className="px-4 py-3 space-y-2 text-[8px]">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
            <span className="text-slate-400">
              <strong>Layers A–E:</strong> Governance, proposals, safe bridge contracts, backend security, and dry-run preview infrastructure. All components support PREVIEW_ONLY execution (observation, validation, export, verification).
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Lock className="w-3 h-3 text-red-600 shrink-0 mt-0.5" />
            <span className="text-slate-400">
              <strong>Layer F:</strong> All live execution capabilities are intentionally disabled. OpenClaw gateway, browser automation, API mutations, trading, money movement, credential entry, element manipulation, and high-risk operations are locked.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="w-3 h-3 text-cyan-600 shrink-0 mt-0.5" />
            <span className="text-slate-400">
              <strong>Current State:</strong> The system is ready to observe, validate, sign, audit, and export dry-run operations. Future Phase 6 will add live OpenClaw connectivity while maintaining the parallel safety and audit infrastructure.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}