import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2 } from 'lucide-react';

const FACILITY_TYPES = ['revolving', 'term', 'heloc', 'line_of_credit', 'credit_card', 'bridge'];
const RISK_RATINGS = ['low', 'medium', 'high', 'critical'];
const APPROVAL_STATUSES = ['approved', 'pending', 'rejected', 'expired'];

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-2.5 py-1.5 bg-secondary/50 border border-border text-[11px] font-mono text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/50 transition-colors";

export default function CreateCreditFacilityModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    facilityName: '', facilityCode: '', facilityType: 'revolving', status: 'pending',
    borrowerEntityName: '', lenderEntityName: '', liabilityAccount: '', cashAccount: '',
    currency: 'USD', creditLimitCents: '', aprBps: '', promoAprBps: '',
    promoStartDate: '', promoEndDate: '', minimumPaymentCents: '', statementDay: '', dueDay: '',
    openedDate: '', personalGuarantee: false, secured: false, collateral: '',
    riskRating: 'medium', approvalStatus: 'pending', paymentDueDate: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const payload = {
      ...form,
      creditLimitCents: form.creditLimitCents ? Math.round(parseFloat(form.creditLimitCents) * 100) : 0,
      minimumPaymentCents: form.minimumPaymentCents ? Math.round(parseFloat(form.minimumPaymentCents) * 100) : 0,
      aprBps: form.aprBps ? Math.round(parseFloat(form.aprBps) * 100) : null,
      promoAprBps: form.promoAprBps ? Math.round(parseFloat(form.promoAprBps) * 100) : null,
      statementDay: form.statementDay ? parseInt(form.statementDay) : null,
      dueDay: form.dueDay ? parseInt(form.dueDay) : null,
      availableCreditCents: form.creditLimitCents ? Math.round(parseFloat(form.creditLimitCents) * 100) : 0,
      currentBalanceCents: 0,
    };
    try {
      await base44.entities.CreditFacility.create(payload);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <h2 className="text-[13px] font-mono font-semibold text-foreground">Create Credit Facility</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 pb-1">Identity</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Facility Name" required>
              <input className={inputCls} value={form.facilityName} onChange={e => set('facilityName', e.target.value)} required placeholder="e.g. Main Revolving Line" />
            </Field>
            <Field label="Facility Code">
              <input className={inputCls} value={form.facilityCode} onChange={e => set('facilityCode', e.target.value)} placeholder="e.g. CF-001" />
            </Field>
            <Field label="Type">
              <select className={inputCls} value={form.facilityType} onChange={e => set('facilityType', e.target.value)}>
                {FACILITY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={e => set('status', e.target.value)}>
                {['active','inactive','suspended','closed','pending'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>

          <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 pb-1">Parties</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Borrower Entity" required>
              <input className={inputCls} value={form.borrowerEntityName} onChange={e => set('borrowerEntityName', e.target.value)} required placeholder="Entity name" />
            </Field>
            <Field label="Lender Entity">
              <input className={inputCls} value={form.lenderEntityName} onChange={e => set('lenderEntityName', e.target.value)} placeholder="Lender name" />
            </Field>
          </div>

          <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 pb-1">Accounts & Credit</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Liability Account">
              <input className={inputCls} value={form.liabilityAccount} onChange={e => set('liabilityAccount', e.target.value)} placeholder="Account ref" />
            </Field>
            <Field label="Cash Account">
              <input className={inputCls} value={form.cashAccount} onChange={e => set('cashAccount', e.target.value)} placeholder="Account ref" />
            </Field>
            <Field label="Currency">
              <input className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value)} />
            </Field>
            <Field label="Credit Limit ($)" required>
              <input type="number" step="0.01" className={inputCls} value={form.creditLimitCents} onChange={e => set('creditLimitCents', e.target.value)} required placeholder="0.00" />
            </Field>
          </div>

          <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 pb-1">Rates</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="APR (%)">
              <input type="number" step="0.01" className={inputCls} value={form.aprBps} onChange={e => set('aprBps', e.target.value)} placeholder="e.g. 24.99" />
            </Field>
            <Field label="Promo APR (%)">
              <input type="number" step="0.01" className={inputCls} value={form.promoAprBps} onChange={e => set('promoAprBps', e.target.value)} placeholder="e.g. 0.00" />
            </Field>
            <Field label="Promo Start">
              <input type="date" className={inputCls} value={form.promoStartDate} onChange={e => set('promoStartDate', e.target.value)} />
            </Field>
            <Field label="Promo End">
              <input type="date" className={inputCls} value={form.promoEndDate} onChange={e => set('promoEndDate', e.target.value)} />
            </Field>
          </div>

          <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 pb-1">Payment Schedule</div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Minimum Payment ($)">
              <input type="number" step="0.01" className={inputCls} value={form.minimumPaymentCents} onChange={e => set('minimumPaymentCents', e.target.value)} placeholder="0.00" />
            </Field>
            <Field label="Statement Day">
              <input type="number" min="1" max="31" className={inputCls} value={form.statementDay} onChange={e => set('statementDay', e.target.value)} placeholder="1–31" />
            </Field>
            <Field label="Due Day">
              <input type="number" min="1" max="31" className={inputCls} value={form.dueDay} onChange={e => set('dueDay', e.target.value)} placeholder="1–31" />
            </Field>
          </div>

          <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest border-b border-border/30 pb-1">Security & Risk</div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Risk Rating">
              <select className={inputCls} value={form.riskRating} onChange={e => set('riskRating', e.target.value)}>
                {RISK_RATINGS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Approval Status">
              <select className={inputCls} value={form.approvalStatus} onChange={e => set('approvalStatus', e.target.value)}>
                {APPROVAL_STATUSES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Collateral">
              <input className={inputCls} value={form.collateral} onChange={e => set('collateral', e.target.value)} placeholder="Description" />
            </Field>
            <Field label="Opened Date">
              <input type="date" className={inputCls} value={form.openedDate} onChange={e => set('openedDate', e.target.value)} />
            </Field>
            <div className="flex items-center gap-3 col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.personalGuarantee} onChange={e => set('personalGuarantee', e.target.checked)} className="accent-primary" />
                <span className="text-[11px] font-mono text-foreground">Personal Guarantee</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.secured} onChange={e => set('secured', e.target.checked)} className="accent-primary" />
                <span className="text-[11px] font-mono text-foreground">Secured</span>
              </label>
            </div>
          </div>

          <Field label="Notes">
            <textarea className={`${inputCls} h-20 resize-none`} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes..." />
          </Field>

          {error && <div className="text-[11px] font-mono text-destructive">{error}</div>}
        </form>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border shrink-0">
          <button onClick={onClose} className="px-4 py-1.5 border border-border text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-[11px] font-mono hover:bg-primary/90 transition-colors disabled:opacity-50">
            {loading && <Loader2 className="w-3 h-3 animate-spin" />} Create Facility
          </button>
        </div>
      </div>
    </div>
  );
}