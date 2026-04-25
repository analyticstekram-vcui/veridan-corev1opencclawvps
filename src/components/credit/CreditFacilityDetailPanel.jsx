import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import CreditFacilitySummaryPanel from './CreditFacilitySummaryPanel';
import CreditUtilizationPanel from './CreditUtilizationPanel';
import CreditAllocationPanel from './CreditAllocationPanel';
import CreditLedgerEventsTable from './CreditLedgerEventsTable';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'utilization', label: 'Utilization' },
  { id: 'allocations', label: 'Allocations' },
  { id: 'ledger', label: 'Ledger' },
  { id: 'capital', label: 'Capital Links' },
];

export default function CreditFacilityDetailPanel({ facility, ledgerEvents, ledgerLoading, onRefreshLedger }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [allocations, setAllocations] = useState([]);
  const [allocLoading, setAllocLoading] = useState(false);

  useEffect(() => {
    setActiveTab('summary');
  }, [facility?.id]);

  useEffect(() => {
    if (facility?.id && activeTab === 'allocations') {
      setAllocLoading(true);
      base44.entities.CreditAllocation.filter({ creditFacilityId: facility.id }, '-allocationDate', 100)
        .then(setAllocations)
        .finally(() => setAllocLoading(false));
    }
  }, [facility?.id, activeTab]);

  if (!facility) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-[11px] font-mono text-muted-foreground/40">Select a credit facility to view details.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Tab Bar */}
      <div className="shrink-0 border-b border-border bg-card flex items-center px-2 gap-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-[11px] font-mono transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto px-3 py-2 text-[10px] font-mono text-muted-foreground/50">
          {facility.facilityCode || facility.id?.slice(0, 8)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'summary' && <CreditFacilitySummaryPanel facility={facility} />}
        {activeTab === 'utilization' && <CreditUtilizationPanel facility={facility} />}
        {activeTab === 'allocations' && (
          <CreditAllocationPanel allocations={allocations} loading={allocLoading} />
        )}
        {activeTab === 'ledger' && (
          <CreditLedgerEventsTable events={ledgerEvents} loading={ledgerLoading} onRefresh={onRefreshLedger} />
        )}
        {activeTab === 'capital' && (
          <div className="p-6 text-[11px] font-mono text-muted-foreground/40">Capital link integration coming soon.</div>
        )}
      </div>
    </div>
  );
}