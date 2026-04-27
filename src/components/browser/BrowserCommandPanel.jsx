import React, { useState } from 'react';
import { Send, Terminal, Globe, MousePointer, Type, Camera, ChevronDown } from 'lucide-react';

const COMMAND_TYPES = [
  { id: 'navigate', label: 'Navigate', icon: Globe },
  { id: 'click',    label: 'Click',    icon: MousePointer },
  { id: 'type',     label: 'Type',     icon: Type },
  { id: 'screenshot', label: 'Screenshot', icon: Camera },
];

const QUICK_COMMANDS = [
  { label: 'OpenClaw Control', command: 'Open http://142.93.206.36:3001', type: 'navigate' },
  { label: 'TradingView', command: 'Open https://www.tradingview.com', type: 'navigate' },
  { label: 'Tradovate', command: 'Open https://app.tradovate.com', type: 'navigate' },
  { label: 'Cloudflare', command: 'Open https://dash.cloudflare.com', type: 'navigate' },
  { label: 'Base44', command: 'Open https://base44.com', type: 'navigate' },
];

export default function BrowserCommandPanel({ disabled, onExecute, loading }) {
  const [command, setCommand]   = useState('');
  const [cmdType, setCmdType]   = useState('navigate');
  const [showQuick, setShowQuick] = useState(false);

  const handleSubmit = () => {
    if (!command.trim() || loading) return;
    onExecute({ command: command.trim(), commandType: cmdType });
    setCommand('');
  };

  const handleQuick = (qc) => {
    setCmdType(qc.type);
    onExecute({ command: qc.command, commandType: qc.type });
    setShowQuick(false);
  };

  return (
    <div className="bg-card border border-border p-4 font-mono space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Terminal className="w-3.5 h-3.5 text-primary" />
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Browser Command</span>
      </div>

      {/* Command Type Selector */}
      <div className="flex gap-1">
        {COMMAND_TYPES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCmdType(id)}
            className={`flex items-center gap-1 px-2.5 py-1 border text-[10px] transition-colors ${
              cmdType === id
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary/50 border border-border focus-within:border-primary/50 transition-colors">
          <span className="text-primary text-xs">›</span>
          <input
            type="text"
            value={command}
            onChange={e => setCommand(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            disabled={disabled || loading}
            placeholder={
              cmdType === 'navigate'   ? 'e.g. Open https://tradingview.com' :
              cmdType === 'click'      ? 'e.g. Click the Login button' :
              cmdType === 'type'       ? 'e.g. Type "username" in the email field' :
              'Take a screenshot of the current page'
            }
            className="flex-1 bg-transparent text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || loading || !command.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[11px] hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <Send className="w-3 h-3" />
          Execute
        </button>
      </div>

      {/* Quick Commands */}
      <div>
        <button
          onClick={() => setShowQuick(v => !v)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform ${showQuick ? 'rotate-180' : ''}`} />
          Quick Commands
        </button>
        {showQuick && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_COMMANDS.map((qc) => (
              <button
                key={qc.label}
                onClick={() => handleQuick(qc)}
                disabled={disabled || loading}
                className="px-2.5 py-1 border border-border text-[10px] text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors disabled:opacity-40"
              >
                {qc.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}