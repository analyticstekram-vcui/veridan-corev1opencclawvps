/**
 * SummarySafetyClaimsFooter — Shared safety claims section for module status summaries.
 */

import React from 'react';

export default function SummarySafetyClaimsFooter({ claims }) {
  return (
    <div className="px-3 py-2.5 bg-primary/5 border border-primary/15 rounded-sm">
      <div className="text-[8px] font-bold uppercase text-primary/70 mb-2">Safety Claims</div>
      <div className="flex flex-wrap gap-1">
        {claims.map(claim => (
          <span
            key={claim}
            className="px-1.5 py-0.5 bg-primary/5 border border-primary/15 rounded text-[7px] text-primary/70 font-mono"
          >
            {claim}
          </span>
        ))}
      </div>
    </div>
  );
}