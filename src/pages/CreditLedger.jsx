import React, { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import CreditFacilityKpiStrip from '@/components/credit/CreditFacilityKpiStrip';
import CreditFacilityFilters from '@/components/credit/CreditFacilityFilters';
import CreditFacilityTable from '@/components/credit/CreditFacilityTable';
import CreditFacilityDetailPanel from '@/components/credit/CreditFacilityDetailPanel';
import CreateCreditFacilityModal from '@/components/credit/modals/CreateCreditFacilityModal';
import DrawCreditModal from '@/components/credit/modals/DrawCreditModal';
import PayDownCreditModal from '@/components/credit/modals/PayDownCreditModal';
import AllocateCreditModal from '@/components/credit/modals/AllocateCreditModal';
import { RefreshCw, Plus, ArrowDownCircle, ArrowUpCircle, GitBranch } from 'lucide-react';

export default function CreditLedger() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [ledgerEvents, setLedgerEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState({
    status: null, entityId: null, dateFrom: null, dateTo: null, search: '',
  });

  const [modals, setModals] = useState({
    create: false, draw: false, paydown: false, allocate: false,
  });

  const openModal = (key) => setModals(m => ({ ...m, [key]: true }));
  const closeModal = (key) => setModals(m => ({ ...m, [key]: false }));

  const fetchFacilities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.CreditFacility.list('-created_date', 200);
      setFacilities(data);
      if (selectedFacility) {
        const updated = data.find(f => f.id === selectedFacility.id);
        if (updated) setSelectedFacility(updated);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedFacility]);

  const fetchLedger = useCallback(async (facilityId) => {
    if (!facilityId) return;
    setLedgerLoading(true);
    try {
      const data = await base44.entities.CreditLedgerEvent.filter(
        { creditFacilityId: facilityId }, '-eventDate', 100
      );
      setLedgerEvents(data);
    } finally {
      setLedgerLoading(false);
    }
  }, []);

  useEffect(() => { fetchFacilities(); }, [refreshKey]);

  const handleSelectFacility = useCallback((facility) => {
    setSelectedFacility(facility);
    if (facility) fetchLedger(facility.id);
    else setLedgerEvents([]);
  }, [fetchLedger]);

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    if (selectedFacility) fetchLedger(selectedFacility.id);
  };

  const handleOptimisticDraw = (amountCents) => {
    const update = (f) => ({
      ...f,
      currentBalanceCents: (f.currentBalanceCents || 0) + amountCents,
      availableCreditCents: (f.availableCreditCents || 0) - amountCents,
    });
    setFacilities(prev => prev.map(f => f.id === selectedFacility.id ? update(f) : f));
    setSelectedFacility(prev => update(prev));
  };

  const handleOptimisticPayDown = (amountCents) => {
    const update = (f) => ({
      ...f,
      currentBalanceCents: Math.max(0, (f.currentBalanceCents || 0) - amountCents),
      availableCreditCents: Math.min(f.creditLimitCents, (f.availableCreditCents || 0) + amountCents),
    });
    setFacilities(prev => prev.map(f => f.id === selectedFacility.id ? update(f) : f));
    setSelectedFacility(prev => update(prev));
  };

  const canDraw = selectedFacility?.status === 'active';
  const canPayDown = (selectedFacility?.currentBalanceCents || 0) > 0;
  const canAllocate = selectedFacility?.status === 'active';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header Bar */}
      <div className="shrink-0 border-b border-border bg-card px-6 py-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold font-mono text-foreground tracking-wide">Credit Facility Ledger</h1>
          <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
            Borrowed liquidity, utilization, repayment, and allocation control
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
          <button
            onClick={() => openModal('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-mono hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Create Facility
          </button>
          <button
            onClick={() => openModal('draw')}
            disabled={!canDraw}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card text-[11px] font-mono hover:bg-secondary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowDownCircle className="w-3 h-3 text-blue-400" /> Draw Credit
          </button>
          <button
            onClick={() => openModal('paydown')}
            disabled={!canPayDown}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card text-[11px] font-mono hover:bg-secondary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUpCircle className="w-3 h-3 text-primary" /> Pay Down
          </button>
          <button
            onClick={() => openModal('allocate')}
            disabled={!canAllocate}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card text-[11px] font-mono hover:bg-secondary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <GitBranch className="w-3 h-3 text-accent" /> Allocate
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <CreditFacilityKpiStrip facilities={facilities} loading={loading} />

      {/* Filters */}
      <CreditFacilityFilters filters={filters} onChange={setFilters} facilities={facilities} />

      {/* Table + Detail Split */}
      <div className="flex-1 flex min-h-0 flex-col md:flex-row">
        <div className="md:w-[40%] lg:w-[40%] min-h-0 flex flex-col border-r border-border">
          <CreditFacilityTable
            facilities={facilities}
            filters={filters}
            loading={loading}
            selectedId={selectedFacility?.id}
            onSelect={handleSelectFacility}
          />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <CreditFacilityDetailPanel
            facility={selectedFacility}
            ledgerEvents={ledgerEvents}
            ledgerLoading={ledgerLoading}
            onRefreshLedger={() => fetchLedger(selectedFacility?.id)}
          />
        </div>
      </div>

      {/* Modals */}
      {modals.create && (
        <CreateCreditFacilityModal
          onClose={() => closeModal('create')}
          onCreated={() => { closeModal('create'); handleRefresh(); }}
        />
      )}
      {modals.draw && selectedFacility && (
        <DrawCreditModal
          facility={selectedFacility}
          onClose={() => closeModal('draw')}
          onSuccess={(amt) => { closeModal('draw'); handleOptimisticDraw(amt); fetchLedger(selectedFacility.id); }}
        />
      )}
      {modals.paydown && selectedFacility && (
        <PayDownCreditModal
          facility={selectedFacility}
          onClose={() => closeModal('paydown')}
          onSuccess={(amt) => { closeModal('paydown'); handleOptimisticPayDown(amt); fetchLedger(selectedFacility.id); }}
        />
      )}
      {modals.allocate && selectedFacility && (
        <AllocateCreditModal
          facility={selectedFacility}
          onClose={() => closeModal('allocate')}
          onSuccess={() => { closeModal('allocate'); handleRefresh(); fetchLedger(selectedFacility.id); }}
        />
      )}
    </div>
  );
}