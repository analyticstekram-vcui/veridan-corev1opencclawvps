import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChevronDown, ChevronRight, AlertTriangle, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const RISK_COLORS = {
  'LOW': '#8b5cf6',
  'MEDIUM': '#f59e0b',
  'HIGH': '#ef4444',
  'CRITICAL': '#dc2626',
};

const RISK_ORDER = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function RiskDistributionChart({ data }) {
  return (
    <div className="bg-secondary/20 border border-border rounded-lg p-4">
      <div className="text-[11px] font-semibold text-foreground mb-3">Risk Tier Distribution (Radar)</div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(220 14% 16%)" />
          <PolarAngleAxis dataKey="riskTier" stroke="hsl(210 20% 75%)" style={{ fontSize: '12px' }} />
          <PolarRadiusAxis stroke="hsl(220 14% 16%)" style={{ fontSize: '10px' }} />
          <Radar name="Count" dataKey="count" stroke={RISK_COLORS['MEDIUM']} fill={RISK_COLORS['MEDIUM']} fillOpacity={0.6} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(220 14% 8%)', border: '1px solid hsl(220 14% 16%)', borderRadius: '4px' }}
            labelStyle={{ color: 'hsl(210 20% 90%)' }}
            formatter={(value) => [value, 'Commands']}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RiskTimelineChart({ data }) {
  return (
    <div className="bg-secondary/20 border border-border rounded-lg p-4">
      <div className="text-[11px] font-semibold text-foreground mb-3">Risk Over Time (24h)</div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid stroke="hsl(220 14% 16%)" />
          <XAxis dataKey="hour" stroke="hsl(210 20% 75%)" style={{ fontSize: '10px' }} />
          <YAxis stroke="hsl(210 20% 75%)" style={{ fontSize: '10px' }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'hsl(220 14% 8%)', border: '1px solid hsl(220 14% 16%)', borderRadius: '4px' }}
            labelStyle={{ color: 'hsl(210 20% 90%)' }}
          />
          <Bar dataKey="critical" stackId="a" fill={RISK_COLORS['CRITICAL']} />
          <Bar dataKey="high" stackId="a" fill={RISK_COLORS['HIGH']} />
          <Bar dataKey="medium" stackId="a" fill={RISK_COLORS['MEDIUM']} />
          <Bar dataKey="low" stackId="a" fill={RISK_COLORS['LOW']} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function HighRiskCommandRow({ command, expanded, onToggle }) {
  const riskColor = RISK_COLORS[command.riskLevel] || RISK_COLORS['LOW'];
  const riskLabel = command.riskLevel || 'UNKNOWN';

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-2.5 flex items-center justify-between gap-3"
        onClick={() => onToggle(command.id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {expanded ? <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold text-foreground truncate">{command.commandType || 'Unknown'}</div>
            <div className="text-[8px] text-muted-foreground/50 mt-0.5">{command.id}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[8px] px-1.5 py-0.5 border rounded" style={{ borderColor: `${riskColor}40`, backgroundColor: `${riskColor}15`, color: riskColor }}>
            {riskLabel}
          </span>
          <span className="text-[8px] px-1.5 py-0.5 border border-border bg-secondary/50 text-muted-foreground rounded">
            {command.status || 'draft'}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-2.5 space-y-2 text-[9px]">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Created</div>
              <div className="text-[8px] text-foreground font-mono">{command.created_date ? format(new Date(command.created_date), 'HH:mm:ss') : '—'}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Requested By</div>
              <div className="text-[8px] text-foreground truncate">{command.requestedBy || '—'}</div>
            </div>
            <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Target URL</div>
              <div className="text-[8px] text-blue-400 font-mono truncate">{command.targetUrl || '—'}</div>
            </div>
            <div className="col-span-2 bg-secondary/30 border border-border px-2 py-1.5 rounded">
              <div className="text-[7px] uppercase tracking-widest text-muted-foreground/50 mb-1">Status</div>
              <div className="text-[8px] text-foreground font-semibold capitalize">{command.status}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InteractiveRiskMapPanel() {
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [riskFilter, setRiskFilter] = useState('ALL');

  useEffect(() => {
    const fetchCommands = async () => {
      try {
        const data = await base44.entities.OpenClawCommand.list('-created_date', 100);
        setCommands(data || []);
      } catch (e) {
        console.error('Failed to fetch commands:', e);
        setCommands([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, []);

  // Build risk distribution data
  const riskDistribution = RISK_ORDER.map(risk => ({
    riskTier: risk,
    count: commands.filter(c => c.riskLevel === risk).length,
    fill: RISK_COLORS[risk],
  }));

  // Build timeline data (mock 24h)
  const timelineData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    low: Math.floor(Math.random() * 5),
    medium: Math.floor(Math.random() * 4),
    high: Math.floor(Math.random() * 2),
    critical: Math.floor(Math.random() * 1),
  }));

  // Filter high-risk commands
  const highRiskCommands = commands
    .filter(c => ['HIGH', 'CRITICAL'].includes(c.riskLevel))
    .sort((a, b) => {
      const riskOrder = { CRITICAL: 0, HIGH: 1 };
      return (riskOrder[a.riskLevel] || 2) - (riskOrder[b.riskLevel] || 2);
    });

  const filteredCommands = riskFilter === 'ALL' 
    ? highRiskCommands 
    : highRiskCommands.filter(c => c.riskLevel === riskFilter);

  const summaryStats = {
    total: commands.length,
    critical: commands.filter(c => c.riskLevel === 'CRITICAL').length,
    high: commands.filter(c => c.riskLevel === 'HIGH').length,
    pending: commands.filter(c => c.status === 'pending').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-1">Interactive Risk Map</div>
          <div className="text-[13px] font-semibold text-foreground">Command Risk Distribution & Analysis</div>
        </div>
      </div>

      {/* Risk summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-muted-foreground/50 uppercase tracking-wider mb-1 text-[8px]">Total Commands</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-destructive/5 border border-destructive/20 px-3 py-2 rounded">
          <div className="text-destructive/60 uppercase tracking-wider mb-1 text-[8px]">Critical</div>
          <div className="text-[14px] font-semibold text-destructive">{summaryStats.critical}</div>
        </div>
        <div className="bg-orange-500/5 border border-orange-500/20 px-3 py-2 rounded">
          <div className="text-orange-500/60 uppercase tracking-wider mb-1 text-[8px]">High Risk</div>
          <div className="text-[14px] font-semibold text-orange-500">{summaryStats.high}</div>
        </div>
        <div className="bg-blue-400/5 border border-blue-400/20 px-3 py-2 rounded">
          <div className="text-blue-400/60 uppercase tracking-wider mb-1 text-[8px]">Pending</div>
          <div className="text-[14px] font-semibold text-blue-400">{summaryStats.pending}</div>
        </div>
      </div>

      {/* Risk charts */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-4 h-4 text-primary animate-spin mr-2" />
          <span className="text-[10px] text-muted-foreground">Loading commands...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <RiskDistributionChart data={riskDistribution} />
          <RiskTimelineChart data={timelineData} />
        </div>
      )}

      {/* High-risk commands section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <div className="text-[11px] font-semibold text-foreground">High-Risk Commands for Review</div>
          </div>
          <span className="text-[9px] text-muted-foreground/30">{filteredCommands.length} commands</span>
        </div>

        {/* Risk filter */}
        <div className="flex items-center gap-1.5">
          {['ALL', 'CRITICAL', 'HIGH'].map(opt => (
            <button
              key={opt}
              onClick={() => setRiskFilter(opt)}
              className={`px-3 py-1.5 text-[9px] border rounded whitespace-nowrap transition-colors ${
                riskFilter === opt
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Command list */}
        <div className="space-y-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-6 text-center text-[10px] text-muted-foreground/40">
              {loading ? 'Loading...' : 'No high-risk commands found'}
            </div>
          ) : (
            filteredCommands.map(cmd => (
              <HighRiskCommandRow
                key={cmd.id}
                command={cmd}
                expanded={expandedId === cmd.id}
                onToggle={setExpandedId}
              />
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-primary/80">
        <TrendingUp className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold mb-1">Risk Map is read-only. It visualizes pending command risk distribution.</div>
          <div>Use the Command Queue panel to approve or deny high-risk commands. Drill down to review command details before approval.</div>
        </div>
      </div>
    </div>
  );
}