import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RefreshCw, Wifi, WifiOff, Server, Clock, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function OpenClawGatewayConnectorPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [readLogs, setReadLogs] = useState([]);

  const fetchGatewayStatus = async (readType = 'health') => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('openclawGatewayReadOnlyConnector', {
        readType,
      });
      setStatus(response.data);
      setLastRefresh(new Date().toLocaleTimeString());
      
      // Load recent logs
      const logs = await base44.entities.OpenClawGatewayConnectorLog.list('-readAt', 10);
      setReadLogs(logs || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch gateway status');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayStatus('health');
    const interval = setInterval(() => fetchGatewayStatus('health'), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Real Gateway Connector</div>
          <div className="text-[13px] font-semibold text-foreground">OpenClaw Gateway Read-Only Diagnostics</div>
        </div>
        <button
          type="button"
          onClick={() => fetchGatewayStatus('health')}
          disabled={loading}
          className="px-3 py-1.5 text-[10px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 font-semibold rounded flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Connection Status */}
      <div className={`rounded-lg p-4 border ${
        status?.gatewayOnline 
          ? 'bg-primary/5 border-primary/20' 
          : 'bg-slate-500/5 border-slate-500/20'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {status?.gatewayOnline ? (
            <>
              <Wifi className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-primary uppercase tracking-wider">GATEWAY ONLINE</div>
                <div className="text-[9px] text-primary/70 mt-0.5">Connected to {status?.data?.gateway_url || 'OpenClaw gateway'}</div>
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-slate-500" />
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">GATEWAY OFFLINE</div>
                <div className="text-[9px] text-slate-400/70 mt-0.5">Gateway is unreachable — running in local preview mode</div>
              </div>
            </>
          )}
        </div>
        {status && (
          <div className="grid grid-cols-3 gap-2 text-[9px] mt-3">
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Status</div>
              <div className="font-semibold text-foreground">{status.success ? 'Connected' : 'Error'}</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">Latency</div>
              <div className="font-semibold text-foreground">{status.latencyMs}ms</div>
            </div>
            <div className="bg-card/50 border border-border/30 px-2 py-1.5 rounded">
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground/50 mb-0.5">HTTP</div>
              <div className="font-semibold text-foreground">{status.httpStatus || 'N/A'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Diagnostic Buttons */}
      <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
        <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Diagnostic Reads</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['health', 'version', 'status', 'capabilities', 'session_status', 'audit_summary'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => fetchGatewayStatus(type)}
              disabled={loading}
              className="px-3 py-2 text-[9px] border border-border text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-50 font-semibold rounded capitalize"
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Gateway Data Display */}
      {status?.data && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-2">
          <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-2">Gateway Response</div>
          <div className="bg-card border border-border/30 px-3 py-2.5 rounded text-[9px] text-foreground/80 font-mono max-h-48 overflow-y-auto">
            <pre>{JSON.stringify(status.safeSnapshot || status.data, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-[10px] text-destructive">
            <div className="font-semibold mb-0.5">Read Failed</div>
            <div className="text-[9px] text-destructive/80">{error}</div>
          </div>
        </div>
      )}

      {/* Recent Reads Audit Log */}
      {readLogs.length > 0 && (
        <div className="bg-secondary/10 border border-border/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-muted-foreground" />
            <div className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Recent Reads ({readLogs.length})</div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {readLogs.map(log => (
              <div key={log.id} className="bg-card border border-border/30 px-3 py-2 rounded text-[8px] space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground capitalize">{log.readType}</span>
                  {log.success ? (
                    <CheckCircle2 className="w-3 h-3 text-primary" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-destructive" />
                  )}
                </div>
                <div className="text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(log.readAt).toLocaleTimeString()}</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span>{log.latencyMs}ms</span>
                </div>
                {log.errorMessage && (
                  <div className="text-destructive/70 mt-0.5">Error: {log.errorMessage}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Read-Only Gateway Connector</div>
          <div className="text-[9px] text-primary/70">Only health, version, status, capabilities, session status, and audit summaries are fetched. No command execution, mutations, credential entry, or data movement. All reads logged to audit trail. Baseline constraints remain locked.</div>
        </div>
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <div className="text-[8px] text-muted-foreground/50 text-center border-t border-border/30 pt-2 mt-2">
          Last refresh: {lastRefresh}
        </div>
      )}
    </div>
  );
}