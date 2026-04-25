import React from 'react';

function Row({ label, value, valueClass }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-border/40 last:border-b-0">
      <div className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider w-40 shrink-0 pt-0.5">{label}</div>
      <div className={`text-[11px] font-mono break-words ${valueClass || 'text-foreground'}`}>{value ?? '—'}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <div className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-2 px-5 pt-4">{title}</div>
      <div className="px-5">{children}</div>
    </div>
  );
}

const statusColors = {
  active: 'text-primary',
  inactive: 'text-muted-foreground',
  suspended: 'text-amber-500',
  closed: 'text-destructive',
  pending: 'text-blue-400',
};

export default function CreditFacilitySummaryPanel({ facility: f }) {
  return (
    <div className="py-2">
      <Section title="Identity">
        <Row label="Facility Name" value={f.facilityName} />
        <Row label="Facility Code" value={f.facilityCode} />
        <Row label="Type" value={f.facilityType} />
        <Row label="Status" value={f.status} valueClass={statusColors[f.status]} />
        <Row label="Currency" value={f.currency} />
      </Section>

      <Section title="Parties">
        <Row label="Borrower Entity" value={f.borrowerEntityName} />
        <Row label="Lender Entity" value={f.lenderEntityName} />
      </Section>

      <Section title="Accounts">
        <Row label="Liability Account" value={f.liabilityAccount} />
        <Row label="Cash Account" value={f.cashAccount} />
      </Section>

      <Section title="Dates">
        <Row label="Opened Date" value={f.openedDate} />
        <Row label="Closed Date" value={f.closedDate} />
        <Row label="Payment Due Date" value={f.paymentDueDate} />
      </Section>

      <Section title="Security">
        <Row label="Personal Guarantee" value={f.personalGuarantee ? 'Yes' : 'No'} valueClass={f.personalGuarantee ? 'text-amber-500' : 'text-muted-foreground'} />
        <Row label="Secured" value={f.secured ? 'Yes' : 'No'} valueClass={f.secured ? 'text-primary' : 'text-muted-foreground'} />
        <Row label="Collateral" value={f.collateral} />
      </Section>

      {f.notes && (
        <Section title="Notes">
          <div className="text-[11px] font-mono text-muted-foreground whitespace-pre-wrap">{f.notes}</div>
        </Section>
      )}
    </div>
  );
}