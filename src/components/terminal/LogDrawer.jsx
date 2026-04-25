import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { getLogs } from '@/lib/veridanApi';

const TABS = [
  { id: 'all', label: 'All Events' },
  { id: 'USER', label: 'Actions' },
  { id: 'AI', label: 'AI Decisions' },
  { id: 'OPENCLAW', label: 'OpenClaw' },
  { id: 'ERROR', label: 'Errors' },
];

const statusColors = {
  OK:       'text-primary',
  PENDING:  'text-amber-500',
  APPROVED: 'text-primary',
  DENIED:   'text-destructive',
  WARN:     'text-amber-500',
  ERROR:    'text-destructive',
  SKIPPED:  'text-muted-foreground',
  RECEIVED: 'text-blue-400',
  WRITTEN:  'text-primary',
  'HTTP 200': 'text-primary',
};

export default function LogDrawer({ collapsed, onToggle }) {
  const [activeTab, setActiveTab] = useState('all');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getLogs();
      setLogs(data.logs || []);
    } catch (_) { /* silently fail */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = activeTab === 'all'
    ? logs
    : activeTab === 'ERROR'
    ? logs.filter(l => l.status === 'ERROR' || l.status === 'WARN')
    : logs.filter(l => l.source === activeTab || l.source?.startsWith(activeTab));

  const errorCount = logs.filter(l => l.status === 'ERROR' || l.status === 'WARN').length;

  return (
    <div className={`bg-card border-t border-border flex flex-col shrink-0 select-none transition-all duration-200 ${collapsed ? 'h-8' : 'h-48'}`}>
      <div className="h-8 border-b border-border/50 flex items-center px-1 shrink-0">
        <button onClick={onToggle} className="p-1 text-muted-foreground hover:text-foreground transition-colors mr-1">
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); if (collapsed) onToggle(); }}
            className={`px-2.5 py-1 text-[10px] font-mono transition-colors ${
              activeTab === tab.id
                ? 'text-foreground bg-secondary/50 border-b border-primary'
                : 'text-muted-foreground/60 hover:text-muted-foreground'
            }`}
          >
            {tab.label}
            {tab.id === 'ERROR' && errorCount > 0 && (
              <span className="ml-1 px-1 py-px bg-amber-500/20 text-amber-500 text-[8px]">{errorCount}</span>
            )}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pr-2">
          <span className="text-[9px] font-mono text-muted-foreground/40">{filtered.length} entries</span>
          <button onClick={fetchLogs} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[10px] font-mono text-muted-foreground/30">
              {loading ? 'Loading...' : 'No events yet'}
            </div>
          ) : (
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
                {filtered.map((row, i) => (
                  <tr key={i} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                    <td className="px-3 py-1 text-muted-foreground/50">{row.time}</td>
                    <td className="px-3 py-1 text-muted-foreground">{row.source}</td>
                    <td className="px-3 py-1 text-foreground/80">{row.action}</td>
                    <td className={`px-3 py-1 ${statusColors[row.status] || 'text-muted-foreground'}`}>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}