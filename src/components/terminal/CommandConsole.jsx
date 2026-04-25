import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, ShieldAlert, ChevronRight, Bot, User } from 'lucide-react';

const PLACEHOLDER_MESSAGES = [
  { id: 1, role: 'system', time: '09:41:02', content: 'VERIDAN CORE v2.4.1 — AI Command Console initialized.' },
  { id: 2, role: 'system', time: '09:41:03', content: 'Connected to OpenClaw API. Obsidian Vault synced. All modules nominal.' },
  { id: 3, role: 'user', time: '09:42:15', content: 'Run credit audit for business entity VRD-0042.' },
  { id: 4, role: 'ai', time: '09:42:16', content: 'Initiating credit audit for VRD-0042...\n→ Pulling Experian business profile\n→ Cross-referencing with D&B records\n→ Checking trade line history (24 months)' },
  { id: 5, role: 'ai', time: '09:42:22', content: 'Audit complete. Business credit score: 78/100. 3 trade lines detected with 1 derogatory mark. Full report staged in Obsidian Vault.' },
  { id: 6, role: 'user', time: '09:43:01', content: 'Dispute the derogatory mark on trade line TL-8812.' },
  { id: 7, role: 'ai', time: '09:43:02', content: '⚠ APPROVAL REQUIRED — This action will submit a formal dispute to Experian. Estimated resolution: 30-45 days. Approve to proceed.', needsApproval: true },
];

const MessageRow = ({ msg }) => {
  const roleColors = {
    system: 'text-muted-foreground',
    user: 'text-blue-400',
    ai: 'text-primary',
  };
  const roleIcons = {
    system: <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />,
    user: <User className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />,
    ai: <Bot className="w-3 h-3 text-primary shrink-0 mt-0.5" />,
  };

  return (
    <div className="group flex gap-2 px-3 py-1.5 hover:bg-secondary/30 transition-colors">
      <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0 mt-0.5 w-14">
        {msg.time}
      </span>
      {roleIcons[msg.role]}
      <div className="flex-1 min-w-0">
        <pre className={`text-xs font-mono whitespace-pre-wrap break-words leading-relaxed ${roleColors[msg.role]}`}>
          {msg.content}
        </pre>
        {msg.needsApproval && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-mono">
              <ShieldAlert className="w-3 h-3" />
              APPROVAL REQUIRED
            </div>
            <button className="px-2 py-0.5 bg-primary/10 border border-primary/30 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors">
              APPROVE
            </button>
            <button className="px-2 py-0.5 bg-destructive/10 border border-destructive/30 text-destructive text-[10px] font-mono hover:bg-destructive/20 transition-colors">
              DENY
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function CommandConsole() {
  const [messages, setMessages] = useState(PLACEHOLDER_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      time,
      content: input,
    }]);
    setInput('');
    // Simulate AI response
    setTimeout(() => {
      const t = new Date();
      const rt = t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'ai',
        time: rt,
        content: 'Command acknowledged. Processing request...',
      }]);
    }, 800);
  };

  const handleClear = () => {
    setMessages([{
      id: Date.now(),
      role: 'system',
      time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      content: 'Console cleared. Ready for commands.',
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Console Header */}
      <div className="h-8 bg-card border-b border-border flex items-center px-3 shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-mono text-muted-foreground">AI COMMAND CONSOLE</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono text-muted-foreground/50">{messages.length} entries</span>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-1">
        {messages.map((msg) => (
          <MessageRow key={msg.id} msg={msg} />
        ))}
      </div>

      {/* Input Bar */}
      <div className="border-t border-border bg-card p-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-primary text-xs font-mono pl-1">›</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none"
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
            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Send command"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}