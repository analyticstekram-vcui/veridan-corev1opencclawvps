/**
 * GatewayConnectorSectionNav
 * UI-only navigation panel for Gateway Connector sections.
 *
 * SAFETY CONTRACT:
 *   - No backend calls, no OpenClaw calls, no command actions
 *   - No execution, trading, credentials, scheduler, polling, timers
 *   - Navigation scroll-to only
 *   - Collapse/expand state management (visual only, does not remove components)
 *   - localStorage preference persistence
 *   - READ_ONLY / LOCKED / DISABLED
 */
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Shield, Lock, Power } from 'lucide-react';

const STORAGE_KEY = 'openclawGatewayConnectorNavigationPreferences';

const SECTIONS = [
  {
    group: 'Operator Overview',
    items: [
      { id: 'control-room-summary', label: 'Control Room Summary' },
      { id: 'manual-monitoring-console', label: 'Manual Monitoring Console' },
    ],
  },
  {
    group: 'Manual Monitoring',
    items: [
      { id: 'evidence-export', label: 'Evidence Export' },
      { id: 'audit-dashboard', label: 'Audit Dashboard' },
      { id: 'promotion-gate', label: 'Promotion Gate' },
      { id: 'operator-runbook', label: 'Operator Runbook' },
      { id: 'final-acceptance', label: 'Final Acceptance Packet' },
    ],
  },
  {
    group: 'Live Read-Only Bridge',
    items: [
      { id: 'bridge-call', label: 'Controlled Bridge Call' },
      { id: 'status-bridge', label: 'Read-Only Status Bridge' },
      { id: 'historical-status', label: 'Historical Status Dashboard' },
      { id: 'health-monitoring', label: 'Automated Health Monitoring' },
    ],
  },
  {
    group: 'Capability and Route Governance',
    items: [
      { id: 'capability-governance', label: 'Capability Governance' },
      { id: 'route-governance', label: 'Route Governance' },
    ],
  },
  {
    group: 'Evidence and Baseline Archive',
    items: [
      { id: 'bridge-audit', label: 'Bridge Audit and Integrity' },
      { id: 'baseline-archive', label: 'Baseline and Archive Evidence' },
    ],
  },
];

function loadPreferences() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export default function GatewayConnectorSectionNav() {
  const [expandedGroups, setExpandedGroups] = useState({});
  const [evidenceCollapsed, setEvidenceCollapsed] = useState(false);

  useEffect(() => {
    const prefs = loadPreferences();
    setExpandedGroups(prefs.expandedGroups || {});
    setEvidenceCollapsed(prefs.evidenceCollapsed || false);
  }, []);

  const handleToggleGroup = (groupName) => {
    const newState = { ...expandedGroups, [groupName]: !expandedGroups[groupName] };
    setExpandedGroups(newState);
    savePreferences({ expandedGroups: newState, evidenceCollapsed });
  };

  const handleToggleEvidenceStack = () => {
    const newState = !evidenceCollapsed;
    setEvidenceCollapsed(newState);
    savePreferences({ expandedGroups, evidenceCollapsed: newState });
    window.dispatchEvent(new CustomEvent('gateway-evidence-toggle', { detail: { collapsed: newState } }));
  };

  const handleScrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mb-0.5">Navigation Cleanup</div>
          <div className="text-[12px] font-bold text-foreground">Gateway Connector Section Navigator</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleEvidenceStack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] border border-border text-slate-400 hover:bg-secondary/50 rounded font-bold transition-colors"
          >
            {evidenceCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {evidenceCollapsed ? 'Expand' : 'Collapse'} Evidence Stack
          </button>
        </div>
      </div>

      {/* Safety Status Chips */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/30 rounded text-[8px] font-bold text-primary uppercase tracking-wider">
          <Shield className="w-3 h-3" /> READ_ONLY
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[8px] font-bold text-amber-600 uppercase tracking-wider">
          <Lock className="w-3 h-3" /> LOCKED
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 border border-destructive/30 rounded text-[8px] font-bold text-destructive uppercase tracking-wider">
          <Power className="w-3 h-3" /> DISABLED
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
        {SECTIONS.map((section) => (
          <div key={section.group}>
            <button
              type="button"
              onClick={() => handleToggleGroup(section.group)}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-secondary/20 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                {expandedGroups[section.group] ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  {section.group}
                </span>
              </div>
              <span className="text-[8px] text-slate-500 font-semibold">
                {section.items.length} items
              </span>
            </button>

            {expandedGroups[section.group] && (
              <div className="bg-secondary/10 px-4 py-3 space-y-2 divide-y divide-border/20">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleScrollToSection(item.id)}
                    className="w-full flex items-center gap-2 px-2 py-2 text-left hover:bg-secondary/30 transition-colors rounded text-[9px] font-semibold text-slate-300 hover:text-foreground first:pt-0 last:pb-0"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Safety Footer */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded text-[8px] text-primary/80 font-semibold">
        <Shield className="w-3 h-3 shrink-0" />
        Navigation cleanup only. No OpenClaw calls. No command actions. No execution. No scheduler. No polling.
      </div>
    </div>
  );
}