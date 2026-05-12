import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, AlertTriangle, Clock, Activity } from 'lucide-react';
import { format } from 'date-fns';

const SESSION_STATES = {
  ACTIVE: { label: 'ACTIVE', color: 'text-primary border-primary/30 bg-primary/5', icon: Activity },
  IDLE_WARNING: { label: 'IDLE_WARNING', color: 'text-amber-500 border-amber-500/30 bg-amber-500/5', icon: AlertTriangle },
  LOCKED: { label: 'LOCKED', color: 'text-destructive border-destructive/30 bg-destructive/5', icon: Lock },
};

export default function SessionTimeoutPanel() {
  // Session state
  const [sessionState, setSessionState] = useState('ACTIVE');
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [auditLog, setAuditLog] = useState([]);
  const [showConfig, setShowConfig] = useState(false);
  
  // Configuration (in seconds)
  const [config, setConfig] = useState({
    idleWarningThreshold: 600,      // 10 minutes
    autoLockThreshold: 900,          // 15 minutes
    sensitiveReAuthRequired: true,
  });

  const [configEdit, setConfigEdit] = useState({ ...config });
  const activityTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Log audit event
  const addAuditLog = (eventType, details = '') => {
    const entry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType,
      details,
      sessionState,
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 100)); // keep last 100
  };

  // Track user activity globally
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      // Transition out of LOCKED/IDLE_WARNING if activity detected
      if (sessionState === 'LOCKED' || sessionState === 'IDLE_WARNING') {
        setSessionState('ACTIVE');
        addAuditLog('activity_resumed', 'User activity detected, session activated');
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, handleActivity));
    return () => events.forEach(e => document.removeEventListener(e, handleActivity));
  }, [sessionState]);

  // Main countdown/state machine timer
  useEffect(() => {
    if (sessionState === 'LOCKED') return;

    countdownTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      setIdleSeconds(elapsed);

      // Check thresholds
      if (elapsed >= config.autoLockThreshold) {
        setSessionState('LOCKED');
        addAuditLog('session_locked', `Auto-lock after ${elapsed}s idle`);
      } else if (elapsed >= config.idleWarningThreshold && sessionState === 'ACTIVE') {
        setSessionState('IDLE_WARNING');
        addAuditLog('idle_warning', `Idle warning after ${elapsed}s inactivity`);
      }
    }, 1000);

    return () => clearInterval(countdownTimerRef.current);
  }, [sessionState, config.autoLockThreshold, config.idleWarningThreshold]);

  // Manual lock
  const handleLockNow = () => {
    setSessionState('LOCKED');
    setIdleSeconds(0);
    lastActivityRef.current = Date.now();
    addAuditLog('session_locked_manual', 'Operator manually locked session');
  };

  // Unlock simulation
  const handleUnlockSimulation = () => {
    setSessionState('ACTIVE');
    setIdleSeconds(0);
    lastActivityRef.current = Date.now();
    addAuditLog('session_unlocked_simulation', 'Simulation unlock for testing');
  };

  // Save configuration
  const handleSaveConfig = () => {
    setConfig({ ...configEdit });
    addAuditLog('config_changed', `Idle warning: ${configEdit.idleWarningThreshold}s, auto-lock: ${configEdit.autoLockThreshold}s`);
    setShowConfig(false);
  };

  const stateCfg = SESSION_STATES[sessionState] || SESSION_STATES.ACTIVE;
  const StateIcon = stateCfg.icon;
  const remainingSeconds = config.autoLockThreshold - idleSeconds;
  const warningPercentage = (idleSeconds / config.autoLockThreshold) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-slate-400 mb-1 font-semibold">Session Control</div>
          <div className="text-[13px] font-semibold text-foreground">Operator Timeout Policy</div>
        </div>
        <Clock className="w-5 h-5 text-primary" />
      </div>

      {/* Safety Banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-primary/5 border border-primary/20 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-[10px] text-primary/80">
          <div className="font-semibold mb-0.5">Session timeout is a frontend/UX control layer only.</div>
          <div className="text-[9px] text-primary/70">Production authentication and authorization enforcement must be backend/provider-enforced. This panel shows idle state and simulated timeout. Real session termination, token revocation, and access control are server-side responsibilities.</div>
        </div>
      </div>

      {/* Session State Card */}
      <div className={`border rounded-lg p-4 space-y-4 ${stateCfg.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StateIcon className="w-5 h-5" />
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider">{stateCfg.label}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">
                {sessionState === 'ACTIVE' && 'Session active. Continue working.'}
                {sessionState === 'IDLE_WARNING' && `Idle warning: ${remainingSeconds}s until auto-lock`}
                {sessionState === 'LOCKED' && 'Session locked. Unlock simulation to continue testing.'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[14px] font-semibold font-mono">{idleSeconds}s</div>
            <div className="text-[8px] text-slate-400 mt-0.5">idle time</div>
          </div>
        </div>

        {/* Progress bar (only when IDLE_WARNING) */}
        {sessionState === 'IDLE_WARNING' && (
          <div className="space-y-2">
            <div className="w-full h-2 bg-background/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${warningPercentage}%` }}
              />
            </div>
            <div className="text-[9px] text-slate-400 text-center">
              Auto-lock in {remainingSeconds}s • {Math.round(warningPercentage)}% idle
            </div>
          </div>
        )}

        {/* Locked state message */}
        {sessionState === 'LOCKED' && (
          <div className="bg-destructive/10 border border-destructive/20 px-3 py-2 rounded text-[9px] text-destructive">
            <div className="font-semibold mb-1">🔒 Session Locked</div>
            <div className="text-[8px]">Use "Unlock Simulation" button below to resume testing.</div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleLockNow}
          disabled={sessionState === 'LOCKED'}
          className="flex items-center gap-2 px-3 py-2 text-[10px] border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 rounded font-semibold"
        >
          <Lock className="w-3 h-3" /> Lock Now
        </button>

        <button
          type="button"
          onClick={handleUnlockSimulation}
          disabled={sessionState !== 'LOCKED'}
          className="flex items-center gap-2 px-3 py-2 text-[10px] border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 rounded font-semibold"
        >
          <Unlock className="w-3 h-3" /> Unlock Simulation
        </button>

        <button
          type="button"
          onClick={() => {
            setShowConfig(!showConfig);
            if (!showConfig) setConfigEdit({ ...config });
          }}
          className="px-3 py-2 text-[10px] border border-border bg-card text-slate-400 hover:text-foreground hover:bg-secondary/50 transition-colors rounded font-semibold ml-auto"
        >
          {showConfig ? 'Hide Config' : 'Edit Config'}
        </button>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="border border-border/50 rounded-lg bg-secondary/10 p-4 space-y-3">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Timeout Settings</div>

          <div className="space-y-3">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">
                Idle Warning Threshold (seconds)
              </label>
              <input
                type="number"
                min="60"
                step="30"
                value={configEdit.idleWarningThreshold}
                onChange={(e) => setConfigEdit({ ...configEdit, idleWarningThreshold: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded font-mono"
              />
              <div className="text-[8px] text-slate-500 mt-1">Show warning at {configEdit.idleWarningThreshold}s idle ({Math.floor(configEdit.idleWarningThreshold / 60)}m {configEdit.idleWarningThreshold % 60}s)</div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-semibold block mb-1">
                Auto-Lock Threshold (seconds)
              </label>
              <input
                type="number"
                min="120"
                step="30"
                value={configEdit.autoLockThreshold}
                onChange={(e) => setConfigEdit({ ...configEdit, autoLockThreshold: parseInt(e.target.value) })}
                className="w-full px-2 py-1.5 text-[10px] border border-border bg-card text-foreground outline-none focus:border-primary/50 rounded font-mono"
              />
              <div className="text-[8px] text-slate-500 mt-1">Lock session at {configEdit.autoLockThreshold}s idle ({Math.floor(configEdit.autoLockThreshold / 60)}m {configEdit.autoLockThreshold % 60}s)</div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-border/30 rounded">
              <input
                type="checkbox"
                id="reauth"
                checked={configEdit.sensitiveReAuthRequired}
                onChange={(e) => setConfigEdit({ ...configEdit, sensitiveReAuthRequired: e.target.checked })}
                className="w-3 h-3"
              />
              <label htmlFor="reauth" className="text-[9px] text-foreground cursor-pointer flex-1">
                Sensitive panels require re-authentication on unlock
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setConfigEdit({ ...config });
                setShowConfig(false);
              }}
              className="px-3 py-1.5 text-[9px] border border-border text-slate-400 hover:text-foreground hover:bg-secondary/50 transition-colors rounded font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-3 py-1.5 text-[9px] border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded font-semibold"
            >
              Save Settings
            </button>
          </div>

          <div className="text-[8px] text-slate-500 bg-card/30 border border-border/30 px-2 py-1.5 rounded">
            ⚠️ Settings apply to this session only. Production timeouts must be enforced server-side with backend token management.
          </div>
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px]">
        <div className="bg-card border border-border/50 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Idle Time</div>
          <div className="text-[14px] font-semibold text-foreground">{idleSeconds}s</div>
          <div className="text-[8px] text-slate-500 mt-1">
            {idleSeconds < config.idleWarningThreshold && `${config.idleWarningThreshold - idleSeconds}s to warning`}
            {idleSeconds >= config.idleWarningThreshold && `${Math.max(0, config.autoLockThreshold - idleSeconds)}s to lock`}
          </div>
        </div>

        <div className="bg-card border border-border/50 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Last Activity</div>
          <div className="text-[11px] font-semibold text-foreground font-mono">
            {format(new Date(lastActivityRef.current), 'HH:mm:ss')}
          </div>
          <div className="text-[8px] text-slate-500 mt-1">Just now</div>
        </div>

        <div className="bg-card border border-border/50 px-3 py-2 rounded">
          <div className="text-slate-400 uppercase tracking-wider mb-1 text-[8px] font-semibold">Audit Log Entries</div>
          <div className="text-[14px] font-semibold text-foreground">{auditLog.length}</div>
          <div className="text-[8px] text-slate-500 mt-1">Session events</div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Local Audit Log (Session-Only)</div>
        <div className="border border-border/50 rounded-lg bg-card/30 max-h-48 overflow-auto">
          {auditLog.length === 0 ? (
            <div className="px-4 py-6 text-center text-[9px] text-slate-400">No session events recorded yet</div>
          ) : (
            <div className="divide-y divide-border/30">
              {auditLog.map(log => (
                <div key={log.id} className="px-3 py-2 hover:bg-secondary/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-semibold text-slate-300">{log.eventType}</div>
                      <div className="text-[8px] text-slate-500 mt-0.5">{log.details}</div>
                    </div>
                    <div className="text-[8px] text-slate-500 font-mono shrink-0 whitespace-nowrap">
                      {format(new Date(log.timestamp), 'HH:mm:ss')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-[8px] text-slate-500">
          Audit log is stored in browser session memory only. Cleared on page refresh. Production audit logs must be server-side.
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 px-4 py-3 bg-secondary/10 border border-border/50 rounded-lg text-[9px] text-slate-400">
        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-foreground mb-0.5">Frontend session control only—not a security mechanism.</div>
          <div className="text-[8px] text-slate-400">This panel provides UX feedback and local timeout simulation. Real session security, token management, and access enforcement are backend responsibilities. Operators must use properly configured identity providers and server-side session management.</div>
        </div>
      </div>
    </div>
  );
}