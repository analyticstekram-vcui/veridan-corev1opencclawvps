import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const TABS = [
  { id: 'actions', label: 'Actions' },
  { id: 'ai', label: 'AI Decisions' },
  { id: 'openclaw', label: 'OpenClaw Events' },
  { id: 'obsidian', label: 'Obsidian Changes' },
  { id: 'errors', label: 'Errors' },
];

const logData = {
  actions: [
    { time: '09:43:02', source: 'AI-CMD', action: 'Dispute initiated TL-8812', status: 'PENDING' },
    { time: '09:42:22', source: 'AI-CMD', action: 'Credit audit VRD-0042 complete', status: 'OK' },
    { time: '09:42:15', source: 'USER', action: 'Requested credit audit VRD-0042', status: 'OK' },
    { time: '09:41:03', source: 'SYSTEM', action: 'Module initialization complete', status: 'OK' },
    { time: '09:41:02', source: 'SYSTEM', action: 'Session started', status: 'OK' },
  ],
  ai: [
    { time: '09:42:22', source: 'AUDIT-v3', action: 'Determined 1 derogatory mark disputable', status: 'CONF: 0.92' },
    { time: '09:42:18', source: 'AUDIT-v3', action: 'Cross-referenced D&B DUNS #841923', status: 'MATCH' },
    { time: '09:42:16', source: 'AUDIT-v3', action: 'Initiated multi-source credit pull', status: 'OK' },
  ],
  openclaw: [
    { time: '09:42:20', source: 'API', action: 'Experian business profile fetched', status: 'HTTP 200' },
    { time: '09:42:19', source: 'API', action: 'D&B record lookup complete', status: 'HTTP 200' },
    { time: '09:41:03', source: 'SYNC', action: 'OpenClaw connection established', status: 'OK' },
  ],
  obsidian: [
    { time: '09:42:23', source: 'VAULT', action: 'Audit report saved: /reports/VRD-0042.md', status: 'WRITTEN' },
    { time: '09:41:03', source: 'VAULT', action: 'Primary vault synced (142 notes)', status: 'OK' },
  ],
  errors: [
    { time: '09:40:58', source: 'NET', action: 'Timeout on secondary API endpoint (retry succeeded)', status: 'WARN' },
  ],
};

const statusColors = {
  OK: 'text-primary',
  PENDING: 'text-amber-500',
  WARN: 'text-amber-500',
  MATCH: 'text-blue-400',
  WRITTEN: 'text-primary',
  'HTTP 200': 'text-primary',
  'CONF: 0.92': 'text-blue-400',
};

export default function LogDrawer({ collapsed, onToggle }) {
  const [activeTab, setActiveTab] = useState('actions');
  const rows = logData[activeTab] || [];

  return (
    <div className={`bg-card border-t border-border flex flex-col shrink-0 select-none transition-all duration-200 ${collapsed ? 'h-8' : 'h-48'}`}>
      {/* Tab Bar */}
      <div className="h-8 border-b border-border/50 flex items-center px-1 shrink-0">
        <button
          onClick={onToggle}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors mr-1"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (collapsed) onToggle(); }}
            className={`
              px-2.5 py-1 text-[10px] font-mono transition-colors
              ${activeTab === tab.id
                ? 'text-foreground bg-secondary/50 border-b border-primary'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
              }
              ${tab.id === 'errors' && logData.errors.length > 0 ? 'relative' : ''}
            `}
          >
            {tab.label}
            {tab.id === 'errors' && logData.errors.length > 0 && (
              <span className="ml-1 px-1 py-px bg-amber-500/20 text-amber-500 text-[8px]">
                {logData.errors.length}
              </span>
            )}
          </button>
        ))}
        <div className="ml-auto text-[9px] font-mono text-muted-foreground/40 pr-2">
          {rows.length} entries
        </div>
      </div>

      {/* Log Table */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="text-muted-foreground/40 border-b border-border/30">
                <th className="text-left px-3 py-1 w-20 font-normal">TIME</th>
                <th className="text-left px-3 py-1 w-24 font-normal">SOURCE</th>
                <th className="text-left px-3 py-1 font-normal">ACTION</th>
                <th className="text-left px-3 py-1 w-24 font-normal">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-1 text-muted-foreground/50">{row.time}</td>
                  <td className="px-3 py-1 text-muted-foreground">{row.source}</td>
                  <td className="px-3 py-1 text-foreground/80">{row.action}</td>
                  <td className={`px-3 py-1 ${statusColors[row.status] || 'text-muted-foreground'}`}>
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}