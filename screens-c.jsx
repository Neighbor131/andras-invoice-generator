// screens-c.jsx — Public MVP secondary screens
const { useState: useStateC } = React;

function ProductStat({ label, value, tone, icon }) {
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="eyebrow" style={{ color: 'var(--muted)' }}>{label}</span>
        <span style={{ color: tone || 'var(--brand)' }}><Icon name={icon || 'bolt'} size={18} /></span>
      </div>
      <div className="num" style={{ fontSize: 24, fontWeight: 620, color: tone || 'var(--ink)' }}>{value}</div>
    </Card>
  );
}

function StatusBadge({ status }) {
  const map = {
    Draft: ['neutral', 'Draft'],
    Ready: ['ok', 'Ready'],
    Future: ['brand', 'Future'],
  };
  const [tone, label] = map[status] || map.Draft;
  return <Badge tone={tone} size="sm">{label}</Badge>;
}

function FutureFeature({ eyebrow, title, sub, icon, go }) {
  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 860 }}>
      <ScreenHead eyebrow={eyebrow} title={title} sub={sub}
        right={<Button icon="invoice" onClick={() => go('setup')}>Create invoice</Button>} />
      <Card elevated style={{ padding: 28 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <span style={{ width: 50, height: 50, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', flex: 'none', background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
            <Icon name={icon} size={24} />
          </span>
          <div>
            <Badge tone="brand" icon="shield">Planned account feature</Badge>
            <h2 style={{ margin: '14px 0 8px', fontSize: 22, fontWeight: 620, letterSpacing: '-0.025em' }}>Not available in the no-sign-in MVP</h2>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14.5, lineHeight: 1.55, maxWidth: 600 }}>
              This public version only creates invoices locally and exports PDFs. Features like saved clients, recurring billing, expenses, bank matching and reminders would require login, cloud storage and permissions.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function InvoiceCommandCenter({ store, region, go }) {
  const inv = store.invoice;
  const c = store.client;
  const totals = computeTotals(inv, region);
  const hasDraft = !!(c || store.business.name || totals.total);
  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>
      <ScreenHead eyebrow="Invoices" title="Local invoice workspace"
        sub="This public MVP is a browser workspace: one working draft saved on this device, with real PDF export. Accounts, history and email delivery come later."
        right={<Button icon="plus" onClick={() => go('setup')}>New invoice</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 18 }}>
        <ProductStat label="Draft total" value={fmtMoney(totals.total, region, { currency: inv.currency })} tone="var(--brand)" icon="invoice" />
        <ProductStat label="Client" value={c ? 'Added' : 'Missing'} tone={c ? 'var(--ok)' : 'var(--warn)'} icon="clients" />
        <ProductStat label="PDF export" value="Ready" tone="var(--ok)" icon="download" />
      </div>

      <Card pad={false} style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 620 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 120px 120px 110px', padding: '13px 18px', gap: 12 }}>
            {['No.', 'Client', 'Status', 'Due', 'Amount'].map((h, i) => <div key={h} className="eyebrow" style={{ textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>)}
          </div>
          <Divider />
          {hasDraft ? (
            <button onClick={() => go('preview')}
              style={{ width: '100%', display: 'grid', gridTemplateColumns: '110px 1fr 120px 120px 110px', gap: 12, alignItems: 'center',
                padding: '15px 18px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              <span className="num" style={{ fontSize: 13.5, fontWeight: 560 }}>#{inv.number}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 560 }}>{c ? c.name : 'Client not added yet'}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>Browser workspace draft</span>
              </span>
              <StatusBadge status={canSend(store, region) ? 'Ready' : 'Draft'} />
              <span className="num" style={{ fontSize: 12.5, color: 'var(--muted)' }}>{inv.dueDate}</span>
              <span className="num" style={{ textAlign: 'right', fontSize: 14, fontWeight: 560 }}>{fmtMoney(totals.total, region, { currency: inv.currency })}</span>
            </button>
          ) : (
            <div style={{ padding: 26, textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
              No invoice draft yet. Start with your business details and Andras will build the PDF as you go.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function EstimatesFlow({ go }) {
  return <FutureFeature eyebrow="Estimates" title="Estimates are planned for accounts" sub="Quotes, approvals and conversion to invoice need saved client and project records." icon="doc" go={go} />;
}

function RecurringSetup({ go }) {
  return <FutureFeature eyebrow="Recurring invoices" title="Recurring billing needs a signed-in workspace" sub="Schedules, reminders and automatic sending require saved invoices, delivery logs and payment state." icon="recurring" go={go} />;
}

function ExpenseCapture({ go }) {
  return <FutureFeature eyebrow="Expenses" title="Expense capture is a future workspace feature" sub="Receipt uploads and reimbursement tracking need secure file storage and saved client/project records." icon="receipt" go={go} />;
}

function MoneyDashboard({ go }) {
  return <FutureFeature eyebrow="Money" title="Money tracking needs connected accounts" sub="Cashflow, bank matching and receipts require user permission and a secure backend." icon="bank" go={go} />;
}

function ClientDirectory({ go }) {
  return <FutureFeature eyebrow="Clients" title="Saved clients come with login" sub="The no-account MVP only stores the recipient for the current local draft. A signed-in version would keep client profiles across invoices." icon="clients" go={go} />;
}

Object.assign(window, {
  ProductStat, InvoiceCommandCenter, EstimatesFlow, RecurringSetup,
  ExpenseCapture, MoneyDashboard, ClientDirectory,
});
