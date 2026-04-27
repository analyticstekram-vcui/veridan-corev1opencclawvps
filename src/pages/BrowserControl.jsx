import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Globe, AlertTriangle } from 'lucide-react';
import BrowserSessionPanel from '@/components/browser/BrowserSessionPanel';
import BrowserCommandPanel from '@/components/browser/BrowserCommandPanel';
import BrowserApprovalQueue from '@/components/browser/BrowserApprovalQueue';
import BrowserPreviewPanel from '@/components/browser/BrowserPreviewPanel';
import BrowserActivityLog from '@/components/browser/BrowserActivityLog';
import BrowserAllowlistPanel from '@/components/browser/BrowserAllowlistPanel';

const invoke = (payload) => base44.functions.invoke('veridanBrowser', payload);

export default function BrowserControl() {
  const [session, setSession]       = useState({ status: 'OFFLINE', id: null, currentUrl: null, mock: true });
  const [logs, setLogs]             = useState([]);
  const [queue, setQueue]           = useState([]);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [cmdLoading, setCmdLoading]         = useState(false);
  const [logsLoading, setLogsLoading]       = useState(false);
  const [actioning, setActioning]   = useState(null); // actionId being approved/denied
  const [screenshotUrl, setScreenshotUrl]   = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError]           = useState(null);
  const pollRef = useRef(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await invoke({ action: 'status' });
      if (res.data?.session) setSession(res.data.session);
    } catch (_) {}
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await invoke({ action: 'logs', limit: 100 });
      if (res.data?.logs) setLogs(res.data.logs);
    } catch (_) {} finally { setLogsLoading(false); }
  }, []);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await invoke({ action: 'queue' });
      if (res.data?.queue) setQueue(res.data.queue);
    } catch (_) {}
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchStatus(), fetchLogs(), fetchQueue()]);
  }, [fetchStatus, fetchLogs, fetchQueue]);

  useEffect(() => {
    refreshAll();
    pollRef.current = setInterval(refreshAll, 8000);
    return () => clearInterval(pollRef.current);
  }, [refreshAll]);

  const handleStartSession = async () => {
    setSessionLoading(true);
    setError(null);
    try {
      const res = await invoke({ action: 'session_start' });
      if (res.data?.session) setSession(res.data.session);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to start session');
    } finally { setSessionLoading(false); fetchLogs(); }
  };

  const handleStopSession = async () => {
    setSessionLoading(true);
    setError(null);
    try {
      const res = await invoke({ action: 'session_stop' });
      if (res.data?.session) setSession(res.data.session);
      setScreenshotUrl(null);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to stop session');
    } finally { setSessionLoading(false); fetchLogs(); }
  };

  const handleScreenshot = async () => {
    setCmdLoading(true);
    try {
      const res = await invoke({ action: 'screenshot' });
      if (res.data?.screenshotUrl) setScreenshotUrl(res.data.screenshotUrl);
      setLastResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Screenshot failed');
    } finally { setCmdLoading(false); fetchLogs(); }
  };

  const handleCommand = async ({ command, commandType }) => {
    if (session.status === 'OFFLINE') {
      setError('Start a browser session first.');
      return;
    }
    setCmdLoading(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await invoke({ action: 'command', command, commandType });
      const data = res.data || {};
      setLastResult(data);
      if (data.session) setSession(data.session);
      if (data.requiresApproval) {
        fetchQueue();
      }
      if (data.blocked) {
        setError(data.reason || 'Command blocked');
      }
    } catch (e) {
      const msg = e?.response?.data?.reason || e?.response?.data?.error || 'Command failed';
      setError(msg);
    } finally { setCmdLoading(false); fetchLogs(); }
  };

  const handleApprove = async (actionId) => {
    setActioning(actionId);
    try {
      await invoke({ action: 'approve', actionId, approved: true });
      fetchQueue(); fetchLogs();
    } catch (_) {} finally { setActioning(null); }
  };

  const handleDeny = async (actionId) => {
    setActioning(actionId);
    try {
      await invoke({ action: 'approve', actionId, approved: false });
      fetchQueue(); fetchLogs();
    } catch (_) {} finally { setActioning(null); }
  };

  const pendingCount = queue.filter(q => q.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-background font-mono">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wider text-foreground">BROWSER CONTROL</h1>
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Secure browser automation · Veridan Core</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[11px] animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {pendingCount} action{pendingCount > 1 ? 's' : ''} awaiting approval
            </div>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 border ${
            session.status === 'READY' || session.status === 'ACTIVE'
              ? 'border-primary/30 bg-primary/5'
              : 'border-border bg-secondary/30'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              session.status === 'ACTIVE' ? 'bg-blue-400 animate-pulse' :
              session.status === 'READY'  ? 'bg-primary' :
              session.status === 'ERROR'  ? 'bg-destructive' :
              'bg-muted-foreground/30'
            }`} />
            <span className="text-[10px] text-muted-foreground uppercase">{session.status}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT COLUMN */}
        <div className="space-y-4">
          <BrowserSessionPanel
            session={session}
            loading={sessionLoading}
            onStart={handleStartSession}
            onStop={handleStopSession}
            onScreenshot={handleScreenshot}
          />

          <BrowserCommandPanel
            disabled={session.status === 'OFFLINE'}
            onExecute={handleCommand}
            loading={cmdLoading}
          />

          {/* Last Result */}
          {lastResult && (
            <div className="bg-card border border-border p-4 space-y-2">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground/50">Last Result</div>
              {lastResult.requiresApproval ? (
                <div className="flex items-center gap-2 text-[11px] text-amber-500">
                  <AlertTriangle className="w-3 h-3" />
                  Queued for approval: <span className="font-semibold">{lastResult.label}</span>
                </div>
              ) : lastResult.blocked ? (
                <div className="text-[11px] text-destructive">{lastResult.reason}</div>
              ) : (
                <div className="text-[11px] text-primary">
                  {lastResult.result?.note || lastResult.result?.status || 'Command executed'}
                  {lastResult.mock && <span className="text-muted-foreground/50 ml-2">[MOCK]</span>}
                </div>
              )}
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2 bg-destructive/5 border border-destructive/20 px-4 py-3 text-[11px] text-destructive">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <BrowserAllowlistPanel />
        </div>

        {/* CENTER COLUMN — Preview */}
        <div className="lg:col-span-2 space-y-4">
          <BrowserPreviewPanel session={session} screenshotUrl={screenshotUrl} />
          <BrowserApprovalQueue
            queue={queue}
            onApprove={handleApprove}
            onDeny={handleDeny}
            actioning={actioning}
          />
          <BrowserActivityLog logs={logs} loading={logsLoading} onRefresh={fetchLogs} />
        </div>
      </div>
    </div>
  );
}