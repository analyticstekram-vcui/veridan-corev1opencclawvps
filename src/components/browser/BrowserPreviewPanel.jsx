import React from 'react';
import { Monitor, Wifi, WifiOff, ExternalLink } from 'lucide-react';

export default function BrowserPreviewPanel({ session, screenshotUrl }) {
  const online = session?.status !== 'OFFLINE';

  return (
    <div className="bg-card border border-border font-mono flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Monitor className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">Live View</span>
        </div>
        <div className="flex items-center gap-2">
          {online ? (
            <Wifi className="w-3 h-3 text-primary" />
          ) : (
            <WifiOff className="w-3 h-3 text-muted-foreground/40" />
          )}
          <span className="text-[9px] text-muted-foreground/50">
            {session?.mock ? 'MOCK · Real browser not connected' : online ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* URL Bar */}
      {session?.currentUrl && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/50 bg-secondary/20">
          <div className="flex-1 px-2 py-0.5 bg-secondary/50 border border-border text-[10px] text-blue-400 font-mono truncate">
            {session.currentUrl}
          </div>
          <a href={session.currentUrl} target="_blank" rel="noopener noreferrer"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Preview Area */}
      <div className="flex-1 min-h-64 flex flex-col items-center justify-center bg-background/40 relative">
        {screenshotUrl ? (
          <img src={screenshotUrl} alt="Browser screenshot" className="max-w-full max-h-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-6">
            {/* Mock browser frame */}
            <div className="w-full max-w-sm border border-border/30 bg-secondary/10">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/20 bg-secondary/30">
                <div className="w-2 h-2 rounded-full bg-destructive/40" />
                <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                <div className="w-2 h-2 rounded-full bg-primary/40" />
                <div className="flex-1 mx-2 px-2 py-0.5 bg-secondary/50 border border-border/20 text-[9px] text-muted-foreground/40 font-mono truncate">
                  {session?.currentUrl || 'about:blank'}
                </div>
              </div>
              {/* Fake page */}
              <div className="h-32 flex flex-col items-center justify-center gap-2">
                <Monitor className="w-6 h-6 text-muted-foreground/10" />
                <span className="text-[9px] text-muted-foreground/30 uppercase tracking-widest">
                  {!online ? 'Session Offline' : 'Awaiting Command'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground/40 font-mono">
                MOCK MODE · Real browser preview requires live agent
              </div>
              {session?.currentUrl && (
                <div className="text-[10px] text-blue-400/60 font-mono">Target: {session.currentUrl}</div>
              )}
            </div>
          </div>
        )}

        {/* MOCK badge */}
        {online && (
          <div className="absolute top-3 right-3 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-[9px] text-amber-500 uppercase tracking-widest font-mono">
            MOCK · READY FOR CONNECTION
          </div>
        )}
      </div>
    </div>
  );
}