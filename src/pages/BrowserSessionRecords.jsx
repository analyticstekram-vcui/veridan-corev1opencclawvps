import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Monitor, Shield, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

function SessionDetailRow({ session, expanded, onToggle }) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-border hover:bg-secondary/20 cursor-pointer transition-colors"
      >
        <td className="px-4 py-3 text-[11px] font-mono text-foreground">
          <button className="flex items-center gap-1.5" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
            {expanded ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-muted-foreground/40" />}
            {session.sessionId}
          </button>
        </td>
        <td className="px-4 py-3 text-[10px]">
          <span className={`px-1.5 py-0.5 border uppercase tracking-wider font-semibold ${
            session.status === 'active'
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-border bg-secondary/10 text-muted-foreground'
          }`}>
            {session.status || '—'}
          </span>
        </td>
        <td className="px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider">{session.mode || '—'}</td>
        <td className="px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider">{session.governance || '—'}</td>
        <td className="px-4 py-3 text-[11px] font-mono text-blue-400 truncate max-w-xs">{session.currentUrl || '—'}</td>
        <td className="px-4 py-3 text-[11px] text-foreground/70 truncate max-w-xs">{session.pageTitle || '—'}</td>
        <td className="px-4 py-3 text-[10px] text-muted-foreground/60 uppercase tracking-wider">{session.lastAction || '—'}</td>
        <td className="px-4 py-3 text-[10px] text-muted-foreground/60">
          {Array.isArray(session.auditTrail) ? session.auditTrail.length : 0}
        </td>
        <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground/60">
          {session.createdAt ? format(new Date(session.createdAt), 'MMM d, HH:mm') : '—'}
        </td>
        <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground/60">
          {session.updated_date ? format(new Date(session.updated_date), 'MMM d, HH:mm') : '—'}
        </td>
      </tr>

      {/* Expanded details */}
      {expanded && (
        <tr className="border-b border-primary/20 bg-primary/5">
          <td colSpan="10" className="px-6 py-6">
            <div className="space-y-5">
              {/* Session metadata */}
              <div>
                <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-3">Session Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Session ID', session.sessionId],
                    ['Status', session.status],
                    ['Mode', session.mode],
                    ['Governance', session.governance],
                    ['Created By', session.createdBy],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-secondary/30 border border-border px-3 py-2">
                      <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">{label}</div>
                      <div className="text-[10px] font-mono text-foreground break-all">{val || '—'}</div>
                    </div>
                  ))}
                  <div className="col-span-2 md:col-span-4 bg-secondary/30 border border-border px-3 py-2">
                    <div className="text-[8px] uppercase tracking-widest text-muted-foreground/40 mb-0.5">Current URL</div>
                    <div className="text-[10px] font-mono text-blue-400 break-all">{session.currentUrl || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Audit trail table */}
              {Array.isArray(session.auditTrail) && session.auditTrail.length > 0 ? (
                <div>
                  <h4 className="text-[9px] uppercase tracking-widest text-muted-foreground/40 mb-3">Audit Trail ({session.auditTrail.length})</h4>
                  <div className="border border-border overflow-x-auto">
                    <table className="w-full text-[9px]">
                      <thead className="bg-secondary/30 border-b border-border/30">
                        <tr>
                          <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Timestamp</th>
                          <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Command</th>
                          <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Target URL</th>
                          <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Status</th>
                          <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Page Title</th>
                          <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Screenshot</th>
                          <th className="px-3 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Diagnostics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {session.auditTrail.map((entry, idx) => (
                          <tr key={idx} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-3 py-2 font-mono text-muted-foreground/70 whitespace-nowrap">
                              {entry.timestamp ? format(new Date(entry.timestamp), 'HH:mm:ss') : '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-foreground uppercase tracking-wider">
                              {entry.commandType || '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-blue-400 truncate max-w-xs text-[8px]">
                              {entry.targetUrl || '—'}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`text-[8px] px-1 py-0.5 border uppercase tracking-wider font-semibold ${
                                entry.status === 'success'
                                  ? 'border-primary/30 bg-primary/10 text-primary'
                                  : 'border-destructive/30 bg-destructive/10 text-destructive'
                              }`}>
                                {entry.status || '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-foreground/70 truncate max-w-xs">{entry.pageTitle || '—'}</td>
                            <td className="px-3 py-2 text-[8px] text-muted-foreground/60">
                              {entry.screenshotCaptured ? '✓ YES' : '—'}
                            </td>
                            <td className="px-3 py-2 text-[8px] text-muted-foreground/60 max-w-xs">
                              {Array.isArray(entry.diagnosticsSummary) && entry.diagnosticsSummary.length > 0
                                ? entry.diagnosticsSummary.slice(0, 2).join('; ')
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-muted-foreground/40 italic">No audit trail entries.</div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function BrowserSessionRecords() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const records = await base44.entities.BrowserSession.list();
        setSessions(records || []);
      } catch (err) {
        setError(err.message || 'Failed to load sessions');
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[14px] font-semibold tracking-wider text-foreground">BROWSER SESSION RECORDS</h1>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest mt-0.5">
              Persisted Veridan browser activity from the BrowserSession entity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 border border-primary/30 bg-primary/5 text-[9px] text-primary uppercase tracking-wider font-semibold">
              <Shield className="w-2.5 h-2.5" /> SAFE_READ_ONLY
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-full space-y-4">
        {/* Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            to="/browser-session"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-primary/30 bg-primary/5 text-[9px] text-primary uppercase tracking-wider font-semibold hover:bg-primary/10 transition-colors"
          >
            <Monitor className="w-3 h-3" /> Back to Browser Session
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive/5 border border-destructive/20 px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-[11px] text-destructive">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading session records...
          </div>
        )}

        {/* Sessions table */}
        {!loading && !error && (
          <>
            <div className="text-[9px] text-muted-foreground/40 uppercase tracking-widest mb-2">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
            </div>
            {sessions.length > 0 ? (
              <div className="border border-border overflow-x-auto rounded-sm">
                <table className="w-full text-[10px]">
                  <thead className="bg-secondary/30 border-b border-border/30">
                    <tr>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Session ID</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Status</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Mode</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Governance</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Current URL</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Page Title</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Last Action</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Audit Entries</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Created</th>
                      <th className="px-4 py-2 text-left text-muted-foreground/40 uppercase tracking-wider font-semibold">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {sessions.map(session => (
                      <SessionDetailRow
                        key={session.id}
                        session={session}
                        expanded={expandedSessionId === session.id}
                        onToggle={() => setExpandedSessionId(expandedSessionId === session.id ? null : session.id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-secondary/10 border border-border/50 px-4 py-4 text-[11px] text-muted-foreground/40 italic">
                No browser session records found. Start a session on the Browser Session page.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}