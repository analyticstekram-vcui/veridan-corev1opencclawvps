import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ShieldAlert, ChevronRight, Bot, User, Loader2, Activity, TrendingUp } from 'lucide-react';
import { postCommand, postApprove, getStatus } from '@/lib/veridanApi';
import OpenClawGatewayHealthPanel from './OpenClawGatewayHealthPanel';
import TradingPaperReadinessDashboard from '@/components/trading/TradingPaperReadinessDashboard';
import TradingPaperContract from '@/components/trading/TradingPaperContract';
import TradingPaperContractValidator from '@/components/trading/TradingPaperContractValidator';
import PaperBrokerSandboxConnectorRequirements from '@/components/trading/PaperBrokerSandboxConnectorRequirements';
import PaperConnectorContract from '@/components/trading/PaperConnectorContract';
import PaperConnectorContractValidator from '@/components/trading/PaperConnectorContractValidator';
import ConnectorStorageApiKeyPolicy from '@/components/trading/ConnectorStorageApiKeyPolicy';

const riskColors = { low: 'text-primary', medium: 'text-amber-500', high: 'text-destructive' };

const MessageRow = ({ msg, onApprove }) => {
  const [approving, setApproving] = useState(false);

  const roleColors = { system: 'text-muted-foreground', user: 'text-blue-400', ai: 'text-primary' };
  const roleIcons = {
    system: <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />,
    user:   <User className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />,
    ai:     <Bot className="w-3 h-3 text-primary shrink-0 mt-0.5" />,
  };

  const handleApproval = async (approved) => {
    if (!msg.commandId || approving) return;
    setApproving(true);
    await onApprove(msg.commandId, approved);
  };

  return (
    <div className="group flex gap-2 px-3 py-1.5 hover:bg-secondary/30 transition-colors">
      <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0 mt-0.5 w-14">{msg.time}</span>
      {roleIcons[msg.role]}
      <div className="flex-1 min-w-0">
        <pre className={`text-xs font-mono whitespace-pre-wrap break-words leading-relaxed ${roleColors[msg.role]}`}>
          {msg.content}
        </pre>
        {msg.riskLevel && (
          <span className={`text-[9px] font-mono ${riskColors[msg.riskLevel]} opacity-70`}>
            RISK: {msg.riskLevel.toUpperCase()}
          </span>
        )}
        {msg.needsApproval && !msg.resolved && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-mono">
              <ShieldAlert className="w-3 h-3" />
              APPROVAL REQUIRED
            </div>
            {approving ? (
              <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
            ) : (
              <>
                <button
                  onClick={() => handleApproval(true)}
                  className="px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors"
                >
                  APPROVE
                </button>
                <button
                  onClick={() => handleApproval(false)}
                  className="px-2 py-0.5 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-mono hover:bg-destructive/20 transition-colors"
                >
                  DENY
                </button>
              </>
            )}
          </div>
        )}
        {msg.needsApproval && msg.resolved && (
          <div className={`text-[10px] font-mono mt-1 ${msg.resolved === 'approved' ? 'text-primary' : 'text-destructive'}`}>
            ✓ {msg.resolved === 'approved' ? 'APPROVED — executing...' : 'DENIED — command cancelled'}
          </div>
        )}
      </div>
    </div>
  );
};

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function CommandConsole({ onOpenClawStatus, onStatusUpdate }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'system', time: nowTime(), content: 'VERIDAN CORE v2.4.1 — AI Command Console initialized.' },
    { id: 2, role: 'system', time: nowTime(), content: 'Connecting to Veridan backend...' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const pollingStartedRef = useRef(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Single centralized status poller — one mount, one interval, one in-flight guard
  useEffect(() => {
    if (pollingStartedRef.current) return;
    pollingStartedRef.current = true;

    let isInitial = true;

    const runStatusCheck = async () => {
      if (inFlightRef.current) return; // skip if previous call still running
      inFlightRef.current = true;
      try {
        const res = await getStatus();
        const connected = res?.openclaw?.online === true;
        if (onOpenClawStatus) onOpenClawStatus(connected);
        if (onStatusUpdate) onStatusUpdate(res);
        if (isInitial) {
          isInitial = false;
          const diag = res?.openclaw?.diagnostic;
          const diagDetail = res?.openclaw?.diagnosticDetail || '';
          let statusMsg;
          if (diag === 'openclaw_online') {
            statusMsg = `OpenClaw ONLINE — ${diagDetail}`;
          } else if (diag === 'cloudflare_protected_reachable') {
            statusMsg = `OpenClaw REACHABLE — ${diagDetail}`;
          } else if (diag === 'gateway_unreachable' || diag === 'gateway_error') {
            statusMsg = `OpenClaw OFFLINE — ${diagDetail}`;
          } else {
            statusMsg = connected
              ? 'OpenClaw ONLINE — Veridan backend connected. Type a command to begin.'
              : 'OpenClaw OFFLINE — Veridan backend reachable but OpenClaw not connected.';
          }
          setMessages(prev => prev.map(m =>
            m.content === 'Connecting to Veridan backend...'
              ? { ...m, content: statusMsg }
              : m
          ));
        }
      } catch (_) {
        if (onOpenClawStatus) onOpenClawStatus(false);
        if (isInitial) {
          isInitial = false;
          setMessages(prev => prev.map(m =>
            m.content === 'Connecting to Veridan backend...'
              ? { ...m, content: 'Veridan backend OFFLINE — running in local mode.' }
              : m
          ));
        }
      } finally {
        inFlightRef.current = false;
      }
    };

    runStatusCheck();
    const intervalId = setInterval(runStatusCheck, 20000);

    return () => {
      clearInterval(intervalId);
      pollingStartedRef.current = false;
    };
  }, []);

  const pushMsg = (msg) => setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const command = input.trim();
    setInput('');

    pushMsg({ role: 'user', time: nowTime(), content: command });
    setLoading(true);
    pushMsg({ role: 'system', time: nowTime(), content: 'Processing command...', isTyping: true });

    let result;
    try {
      result = await postCommand(command);
    } catch (err) {
      setMessages(prev => prev.filter(m => !m.isTyping));
      pushMsg({ role: 'system', time: nowTime(), content: `Error: ${err.message}` });
      setLoading(false);
      return;
    }

    setMessages(prev => prev.filter(m => !m.isTyping));

    // Update OpenClaw connectivity status from command response
    if (result.openclawConnected !== undefined && onOpenClawStatus) {
      onOpenClawStatus(result.openclawConnected);
    }

    if (result.status === 'pending_approval') {
      pushMsg({
        role: 'ai',
        time: nowTime(),
        content: `⚠ APPROVAL REQUIRED — ${result.summary}`,
        needsApproval: true,
        commandId: result.commandId,
        riskLevel: result.riskLevel,
        action: result.action,
      });
    } else {
      const ocNote = result.openclawConnected === false ? '\n[OpenClaw: OFFLINE]' : result.openclawConnected === true ? '\n[OpenClaw: ONLINE]' : '';
      pushMsg({
        role: 'ai',
        time: nowTime(),
        content: result.summary + (result.result?.note ? `\n\n[${result.result.note}]` : '') + ocNote,
        riskLevel: result.riskLevel,
      });
    }
    setLoading(false);
  };

  const handleApprove = async (commandId, approved) => {
    setMessages(prev =>
      prev.map(m => m.commandId === commandId ? { ...m, resolved: approved ? 'approved' : 'denied' } : m)
    );

    let result;
    try {
      result = await postApprove(commandId, approved);
    } catch (err) {
      pushMsg({ role: 'system', time: nowTime(), content: `Approval error: ${err.message}` });
      return;
    }

    if (approved) {
      const note = result.result?.note || result.result?.error;
      pushMsg({
        role: 'ai',
        time: nowTime(),
        content: `Execution complete.${note ? `\n[${note}]` : ''}`,
      });
    } else {
      pushMsg({ role: 'system', time: nowTime(), content: 'Command denied and discarded.' });
    }
  };

  const handleClear = () => {
    setMessages([{ id: Date.now(), role: 'system', time: nowTime(), content: 'Console cleared. Ready for commands.' }]);
  };

  const [activeTab, setActiveTab] = useState('console');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab bar */}
      <div className="h-8 bg-card border-b border-border flex items-center px-1 shrink-0 gap-0">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex items-center gap-1.5 px-3 h-full text-[10px] font-mono border-b-2 transition-colors ${activeTab === 'console' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Bot className="w-3 h-3" />
          CONSOLE
        </button>
        <button
          onClick={() => setActiveTab('gateway')}
          className={`flex items-center gap-1.5 px-3 h-full text-[10px] font-mono border-b-2 transition-colors ${activeTab === 'gateway' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <Activity className="w-3 h-3" />
          GATEWAY HEALTH
        </button>
        <button
          onClick={() => setActiveTab('trading')}
          className={`flex items-center gap-1.5 px-3 h-full text-[10px] font-mono border-b-2 transition-colors ${activeTab === 'trading' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          <TrendingUp className="w-3 h-3" />
          PAPER TRADING
        </button>
        {activeTab === 'console' && (
          <div className="ml-auto flex items-center gap-2 pr-2">
            {loading && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
            <span className="text-[10px] font-mono text-muted-foreground/50">{messages.length} entries</span>
          </div>
        )}
      </div>

      {/* Console tab */}
      {activeTab === 'console' && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
            {messages.map((msg) => (
              <MessageRow key={msg.id} msg={msg} onApprove={handleApprove} />
            ))}
          </div>
          <div className="border-t border-border bg-card p-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-xs font-mono pl-1">›</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={loading ? 'Processing...' : 'Enter command...'}
                disabled={loading}
                className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none disabled:opacity-50"
              />
              <button
                onClick={handleClear}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Clear console"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                title="Send command"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Gateway Health tab */}
      {activeTab === 'gateway' && <OpenClawGatewayHealthPanel />}

      {/* Paper Trading tab */}
      {activeTab === 'trading' && (
        <div className="flex-1 overflow-y-auto flex flex-col space-y-4 p-3">
          <TradingPaperReadinessDashboard />
          <TradingPaperContract />
          <TradingPaperContractValidator />
          <PaperBrokerSandboxConnectorRequirements />
          <PaperConnectorContract />
          <PaperConnectorContractValidator />
          <ConnectorStorageApiKeyPolicy />
        </div>
      )}
    </div>
  );
}