import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ChevronDown, ChevronRight, Play, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

const ACTIONS = [
  {
    id: 'page.url.read',
    name: 'Read Current URL',
    description: 'Get the current page URL and components',
    action: 'page.url.read',
    allowSelector: false,
    expectedOutput: 'URL string, protocol, hostname, pathname',
    riskTier: 'LOW',
  },
  {
    id: 'page.title.read',
    name: 'Read Page Title',
    description: 'Get the current page title element text',
    action: 'page.title.read',
    allowSelector: false,
    expectedOutput: 'Page title string',
    riskTier: 'LOW',
  },
  {
    id: 'browser.read',
    name: 'Read Browser Session',
    description: 'Get current browser session metadata',
    action: 'browser.read',
    allowSelector: false,
    expectedOutput: 'Session ID, viewport dimensions, active status',
    riskTier: 'LOW',
  },
  {
    id: 'dom.text.extract',
    name: 'Extract Visible Text',
    description: 'Extract all visible text from current page',
    action: 'dom.text.extract',
    allowSelector: false,
    expectedOutput: 'Text snapshot (truncated), element count, headings',
    riskTier: 'LOW',
  },
  {
    id: 'element.inspect.snapshot',
    name: 'Inspect Element Metadata',
    description: 'Get metadata about a specific element via CSS selector',
    action: 'element.inspect.snapshot',
    allowSelector: true,
    expectedOutput: 'Element tag, className, attributes, bounding box',
    riskTier: 'LOW',
  },
  {
    id: 'browser.screenshot.metadata',
    name: 'Screenshot Metadata',
    description: 'Get metadata about page screenshot (not the image)',
    action: 'browser.screenshot.metadata',
    allowSelector: false,
    expectedOutput: 'Screenshot dimensions, format, size, timestamp',
    riskTier: 'LOW',
  },
];

const FILTER_OPTIONS = ['ALL', 'AVAILABLE', 'SIMULATED', 'BLOCKED', 'SUCCESS'];

function ActionCard({ action, result, loading, onRun, expandedId, onToggle }) {
  const [selector, setSelector] = useState('');
  const isExpanded = expandedId === action.id;
  const permission = 'ALLOWED';

  return (
    <div className="border border-border/50 rounded-lg bg-secondary/10 overflow-hidden">
      {/* Summary row */}
      <div
        className="cursor-pointer hover:bg-secondary/20 transition-colors px-4 py-3 flex items-center justify-between gap-3"
        onClick={() => onToggle(action.id)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isExpanded ? <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" /> : <ChevronRight className="w-3 h-3 shrink-0 text-slate-400" />}
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-foreground">{action.name}</div>
            <div className="text-[8px] text-slate-400 mt-0.5 line-clamp-1 font-semibold">{action.description}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[8px] px-1.5 py-0.5 border border-primary/30 bg-primary/5 text-primary rounded">
            {permission}
          </span>
          {result && (
            <span className={`text-[8px] px-1.5 py-0.5 border rounded ${result.ok ? 'border-primary/30 bg-primary/5 text-primary' : 'border-destructive/30 bg-destructive/5 text-destructive'}`}>
              {result.ok ? 'SUCCESS' : 'FAILED'}
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-border/30 bg-secondary/5 px-4 py-3 space-y-3 text-[10px]">
          {/* Action details */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Risk Tier</div>
              <div className="text-[9px] text-foreground font-semibold">{action.riskTier}</div>
            </div>
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Mode</div>
              <div className="text-[9px] text-primary font-semibold">SIMULATED</div>
            </div>
            <div className="col-span-2 bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Expected Output</div>
              <div className="text-[9px] text-foreground/80">{action.expectedOutput}</div>
            </div>
          </div>

          {/* Selector input if allowed */}
          {action.allowSelector && (
            <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
              <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">CSS Selector (optional)</div>
              <input
                type="text"
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="e.g., .chart-container, [data-id='123']"
                className="w-full px-2 py-1.5 text-[9px] bg-secondary border border-border text-foreground outline-none focus:border-primary/50"
              />
            </div>
          )}

          {/* Result details */}
          {result && (
            <div className="space-y-2 border-t border-border/20 pt-3">
              <div className="grid grid-cols-3 gap-2 text-[9px]">
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Timestamp</div>
                  <div className="text-foreground font-mono text-[8px]">{result.timestamp ? format(new Date(result.timestamp), 'HH:mm:ss') : '—'}</div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Status</div>
                  <div className={`font-semibold text-[8px] ${result.ok ? 'text-primary' : 'text-destructive'}`}>
                    {result.status}
                  </div>
                </div>
                <div className="bg-secondary/30 border border-border px-2 py-1.5 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-0.5 font-semibold">Trace ID</div>
                  <div className="text-slate-400 font-mono text-[8px] truncate">{result.traceId?.slice(0, 12)}...</div>
                </div>
              </div>

              {/* Result JSON */}
              {result.result && (
                <div className="bg-secondary/30 border border-border px-3 py-2 rounded">
                  <div className="text-[8px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Result</div>
                  <pre className="text-[8px] text-foreground/70 overflow-x-auto font-mono bg-secondary/50 p-2 rounded">
                    {JSON.stringify(result.result, null, 2).slice(0, 400)}
                    {JSON.stringify(result.result, null, 2).length > 400 ? '\n...' : ''}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Run button */}
          <button
            onClick={() => onRun(action, selector)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
            {loading ? 'Running...' : 'Run Read Action'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function BrowserReadActionsPanel() {
  const [filter, setFilter] = useState('ALL');
  const [results, setResults] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const filtered = ACTIONS.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'AVAILABLE') return results[a.id]?.ok !== false;
    if (filter === 'SIMULATED') return results[a.id]?.mode === 'SIMULATED';
    if (filter === 'BLOCKED') return results[a.id]?.status === 'BLOCKED';
    if (filter === 'SUCCESS') return results[a.id]?.ok === true;
    return true;
  });

  const runAction = async (action, selector) => {
    setLoadingId(action.id);
    try {
      const res = await base44.functions.invoke('openclawBrowserReadStatus', {
        action: action.action,
        ...(selector && { selector }),
      });
      setResults(prev => ({ ...prev, [action.id]: res.data }));
    } catch (e) {
      setResults(prev => ({
        ...prev,
        [action.id]: {
          ok: false,
          status: 'ERROR',
          error: e.message,
        },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const summaryStats = {
    total: ACTIONS.length,
    available: ACTIONS.filter(a => results[a.id]?.ok !== false).length,
    simulated: ACTIONS.filter(a => results[a.id]?.mode === 'SIMULATED').length,
    blocked: ACTIONS.filter(a => results[a.id]?.status === 'BLOCKED').length,
    successful: Object.values(results).filter(r => r?.ok === true).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Browser Read Actions</div>
          <div className="text-[13px] font-semibold text-foreground">Read-Only Browser Inspection · Simulated Mode</div>
        </div>
        <span className="text-[9px] text-slate-400 font-semibold">{filtered.length} of {summaryStats.total} shown</span>
      </div>

      {/* Summary counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
        <div className="bg-secondary/20 border border-border px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Total</div>
          <div className="text-[14px] font-semibold text-foreground">{summaryStats.total}</div>
        </div>
        <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded">
          <div className="text-primary uppercase tracking-wider mb-1 text-[8px] font-semibold">Available</div>
          <div className="text-[14px] font-semibold text-primary">{summaryStats.available}</div>
        </div>
        <div className="bg-blue-400/5 border border-blue-400/20 px-3 py-2 rounded">
          <div className="text-blue-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Simulated</div>
          <div className="text-[14px] font-semibold text-blue-400">{summaryStats.simulated}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 px-3 py-2 rounded">
          <div className="text-amber-500 uppercase tracking-wider mb-1 text-[8px] font-semibold">Blocked</div>
          <div className="text-[14px] font-semibold text-amber-500">{summaryStats.blocked}</div>
        </div>
        <div className="bg-green-500/5 border border-green-500/20 px-3 py-2 rounded">
          <div className="text-green-500 uppercase tracking-wider mb-1 text-[8px] font-semibold">Successful Runs</div>
          <div className="text-[14px] font-semibold text-green-500">{summaryStats.successful}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-3 py-1.5 text-[9px] border rounded whitespace-nowrap transition-colors font-semibold ${
              filter === opt
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-slate-400 hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Action cards */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-slate-400 font-semibold">No {filter.toLowerCase()} actions found</div>
        ) : (
          filtered.map(action => (
            <ActionCard
              key={action.id}
              action={action}
              result={results[action.id]}
              loading={loadingId === action.id}
              onRun={runAction}
              expandedId={expandedId}
              onToggle={setExpandedId}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded text-[9px] text-slate-300">
        <Eye className="w-3 h-3 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold mb-1 text-foreground">Browser Read Actions are inspection-only</div>
          <div className="text-slate-400">They do not modify browser state, enable live execution, or bypass governance. All reads are simulated with mock data in this phase.</div>
        </div>
      </div>
    </div>
  );
}