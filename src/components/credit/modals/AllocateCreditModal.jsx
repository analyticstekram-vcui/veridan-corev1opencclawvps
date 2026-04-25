import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, GitBranch } from 'lucide-react';

const ALLOCATION_TYPES = ['inventory', 'equipment', 'real_estate', 'working_capital', 'payroll', 'marketing', 'other'];
const RISK_RATINGS = ['low', 'medium', 'high', 'critical'];

const inputCls = "w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

function centsToDisplay(cents) {
  if (cents == null) return '$0';
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export default function AllocateCreditModal({ facility, onClose, onSuccess }) {
  const [form, setForm] = useState({
    allocationType: 'working_capital',
    amountCents: '',
    costOfCapitalBps: '',
    expectedRoiBps: '',
    riskRating: 'medium',
    allocationDate: new Date().toISOString().slice(0, 10),
    repaymentDate: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amountCents = Math.round(parseFloat(form.amountCents) * 100);
    if (!amountCents || amountCents <= 0) { setError('Enter a valid amount.'); return; }
    if (amountCents > (facility.availableCreditCents || 0)) {
      setError(`Exceeds available credit of ${centsToDisplay(facility.availableCreditCents)}.`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Compute new balances — allocation is a tagged draw against available credit
      const newBalance = (facility.currentBalanceCents || 0) + amountCents;
      const newAvailable = (facility.availableCreditCents || 0) - amountCents;

      // 1. Persist allocation record
      await base44.entities.CreditAllocation.create({
        creditFacilityId: facility.id,
        allocationType: form.allocationType,
        amountCents,
        outstandingCents: amountCents,
        costOfCapitalBps: form.costOfCapitalBps ? Math.round(parseFloat(form.costOfCapitalBps) * 100) : null,
        expectedRoiBps: form.expectedRoiBps ? Math.round(parseFloat(form.expectedRoiBps) * 100) : null,
        riskRating: form.riskRating,
        allocationDate: form.allocationDate,
        repaymentDate: form.repaymentDate || null,
        description: form.description,
        status: 'active',
      });

      // 2. Update facility balances so they persist on reload
      await base44.entities.CreditFacility.update(facility.id, {
        currentBalanceCents: newBalance,
        availableCreditCents: newAvailable,
      });

      // 3. Write ledger event with accurate post-allocation balances
      await base44.entities.CreditLedgerEvent.create({
        creditFacilityId: facility.id,
        eventDate: form.allocationDate,
        eventType: 'allocation',
        description: `Allocation: ${form.allocationType}${form.description ? ' — ' + form.description : ''}`,
        amountCents,
        balanceAfterCents: newBalance,
        availableAfterCents: newAvailable,
      });

      onSuccess();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-accent" />
            <h2 className="text-[13px] font-mono font-semibold">Allocate Credit</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-3 bg-secondary/30 border-b border-border text-[11px] font-mono space-y-0.5">
          <div className="text-muted-foreground/60">Facility: <span className="text-foreground">{facility.facilityName}</span></div>
          <div className="text-muted-foreground/60">Available: <span className="text-primary">{centsToDisplay(facility.availableCreditCents)}</span></div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">
                Allocation Type<span className="text-destructive">*</span>
              </label>
              <select className={inputCls} value={form.allocationType} onChange={e => set('allocationType', e.target.value)}>
                {ALLOCATION_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">
                Amount ($)<span className="text-destructive">*</span>
              </label>
              <input type="number" step="0.01" className={inputCls} value={form.amountCents} onChange={e => set('amountCents', e.target.value)} placeholder="0.00" required autoFocus />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Cost of Capital (%)</label>
              <input type="number" step="0.01" className={inputCls} value={form.costOfCapitalBps} onChange={e => set('costOfCapitalBps', e.target.value)} placeholder="e.g. 8.50" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Expected ROI (%)</label>
              <input type="number" step="0.01" className={inputCls} value={form.expectedRoiBps} onChange={e => set('expectedRoiBps', e.target.value)} placeholder="e.g. 18.00" />
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Risk Rating</label>
              <select className={inputCls} value={form.riskRating} onChange={e => set('riskRating', e.target.value)}>
                {RISK_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Allocation Date</label>
              <input type="date" className={inputCls} value={form.allocationDate} onChange={e => set('allocationDate', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Repayment Date</label>
              <input type="date" className={inputCls} value={form.repaymentDate} onChange={e => set('repaymentDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider block mb-1">Description</label>
            <input className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Allocation purpose..." />
          </div>
          {error && <div className="text-[11px] font-mono text-destructive">{error}</div>}
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-accent-foreground text-[11px] font-mono hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />} Confirm Allocation
          </button>
        </div>
      </div>
    </div>
  );
}