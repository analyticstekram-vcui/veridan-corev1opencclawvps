import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

export default function PersistentHeader({ currentPage }) {
  return (
    <div className="sticky top-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Left: Home/Command Center Button */}
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors font-semibold whitespace-nowrap"
        >
          <Home className="w-3.5 h-3.5" />
          Command Center
        </Link>

        {/* Center: Breadcrumb (if on a sub-page) */}
        {currentPage && currentPage !== 'Control Tower' && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-400 truncate font-mono">{currentPage}</span>
          </div>
        )}

        {/* Right: Status indicator */}
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Mode: PREVIEW_ONLY</div>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
      </div>
    </div>
  );
}