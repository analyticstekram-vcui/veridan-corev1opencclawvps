import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function BackToDashboard({ className = '' }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 transition-colors font-semibold whitespace-nowrap ${className}`}
    >
      <Home className="w-3 h-3" />
      Back to Command Center
    </Link>
  );
}