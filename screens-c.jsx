// screens-c.jsx — Product extension flows: invoices, estimates, recurring, expenses, money, clients
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
    Sent: ['brand', 'Sent'],
    Viewed: ['brand', 'Viewed'],
    Overdue: ['bad', 'Overdue'],
    Paid: ['ok', 'Paid'],
    Approved: ['ok', 'Approved'],
  };
  const [tone, label] = map[status] || map.Draft;
  return <Badge tone={tone} size="sm">{label}</Badge>;
}

function InvoiceCommandCenter({ store, region, go }) {
  const r = REGIONS[region];
  const inv = store.invoice;
  const c = store.client || SUGGESTED_CLIENTS[0];
  const totals = computeTotals(inv, region);
  const [active, setActive] = useStateC('overdue');
  const [reminderSent, setReminderSent] = useStateC(false);
  const invoices = [
    { id: 'current', no: inv.number, client: c.name, status: totals.total > 0 ? 'Sent' : 'Draft', due: inv.dueDate, amount: totals.total || 0 },
    { id: 'overdue', no: 'GB-0008', client: 'Holt & Vane', status: reminderSent ? 'Viewed' : 'Overdue', due: '2026-05-18', amount: 2800 },
    { id: 'paid', no: 'US-0007', client: 'Meridian Studio', status: 'Paid', due: '2026-05-10', amount: 1450 },
    { id: 'estimate', no: 'EST-014', client: 'Northwind Coffee', status: 'Approved', due: 'Approved today', amount: 3600 },
  ];
  const selected = invoices.find((i) => i.id === active) || invoices[0];

  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>
      <ScreenHead eyebrow="Invoices" title="Invoice command center"
        sub="A working hub for drafts, overdue invoices, payment status and approved estimates that can become invoices."
        right={<Button icon="plus" onClick={() => go('setup')}>New invoice</Button>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 18 }}>
        <ProductStat label="Outstanding" value={fmtMoney(2800, region)} tone="var(--bad)" icon="alert" />
        <ProductStat label="Paid this month" value={fmtMoney(4650, region)} tone="var(--ok)" icon="bank" />
        <ProductStat label="Avg. paid in" value="6.2 days" icon="clock" />
        <ProductStat label="Ready to bill" value={fmtMoney(3600, region)} tone="var(--brand)" icon="doc" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <Card pad={false} style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 620 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 110px 120px 110px', padding: '13px 18px', gap: 12 }}>
              {['No.', 'Client', 'Status', 'Due', 'Amount'].map((h, i) => <div key={h} className="eyebrow" style={{ textAlign: i === 4 ? 'right' : 'left' }}>{h}</div>)}
            </div>
            <Divider />
            {invoices.map((row) => (
              <button key={row.id} onClick={() => setActive(row.id)}
                style={{ width: '100%', display: 'grid', gridTemplateColumns: '90px 1fr 110px 120px 110px', gap: 12, alignItems: 'center',
                  padding: '15px 18px', border: 'none', borderBottom: '1px solid var(--line)', background: active === row.id ? 'var(--brand-softer)' : 'transparent',
                  cursor: 'pointer', textAlign: 'left' }}>
                <span className="num" style={{ fontSize: 13.5, fontWeight: 560 }}>#{row.no}</span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 560 }}>{row.client}</span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--muted)' }}>{row.id === 'estimate' ? 'Estimate approved' : 'Invoice'}</span>
                </span>
                <StatusBadge status={row.status} />
                <span className="num" style={{ fontSize: 12.5, color: row.status === 'Overdue' ? 'var(--bad)' : 'var(--muted)' }}>{row.due}</span>
                <span className="num" style={{ textAlign: 'right', fontSize: 14, fontWeight: 560 }}>{fmtMoney(row.amount, region)}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{selected.client}</div>
              <div className="num" style={{ fontSize: 12.5, color: 'var(--muted)' }}>#{selected.no} · {fmtMoney(selected.amount, region)}</div>
            </div>
            <StatusBadge status={selected.status} />
          </div>

          {selected.id === 'overdue' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ padding: '13px 14px', background: reminderSent ? 'var(--ok-soft)' : 'var(--bad-soft)', borderRadius: 'var(--r-md)', color: reminderSent ? 'var(--ok)' : 'var(--bad)', display: 'flex', gap: 10 }}>
                <Icon name={reminderSent ? 'checkSmall' : 'alert'} size={18} />
                <span style={{ fontSize: 13.2, lineHeight: 1.45, color: 'var(--ink-2)' }}>
                  {reminderSent ? 'Reminder sent. The invoice status will update when the client opens the payment page.' : 'This invoice is 12 days overdue. Andras can send a polite reminder with the payment link included.'}
                </span>
              </div>
              <Field label="Reminder tone">
                <Select value="Friendly" onChange={() => {}} options={['Friendly', 'Firm', 'Final notice']} />
              </Field>
              <Textarea rows={5} value={`Hi Holt & Vane,\n\nA quick reminder that invoice #${selected.no} for ${fmtMoney(selected.amount, region)} is now overdue. You can pay securely using the link below.\n\nThank you.`} onChange={() => {}} />
              <Button icon="mail" onClick={() => setReminderSent(true)}>{reminderSent ? 'Reminder sent' : 'Send reminder'}</Button>
            </div>
          )}

          {selected.id === 'estimate' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: '13px 14px', background: 'var(--ok-soft)', borderRadius: 'var(--r-md)', display: 'flex', gap: 10 }}>
                <Icon name="checkSmall" size={18} style={{ color: 'var(--ok)' }} />
                <span style={{ fontSize: 13.2, lineHeight: 1.45, color: 'var(--ink-2)' }}>The client approved this estimate. Convert it to an invoice without retyping scope, rate or payment terms.</span>
              </div>
              <Button iconRight="arrowRight" onClick={() => go('estimatesHome')}>Convert estimate</Button>
            </div>
          )}

          {selected.id === 'paid' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: '13px 14px', background: 'var(--ok-soft)', borderRadius: 'var(--r-md)', display: 'flex', gap: 10 }}>
                <Icon name="bank" size={18} style={{ color: 'var(--ok)' }} />
                <span style={{ fontSize: 13.2, lineHeight: 1.45, color: 'var(--ink-2)' }}>Payment matched to bank deposit. Receipt and reconciliation details are available in Money.</span>
              </div>
              <Button variant="outline" iconRight="arrowRight" onClick={() => go('moneyHome')}>Open receipt</Button>
            </div>
          )}

          {selected.id === 'current' && (
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ padding: '13px 14px', background: 'var(--brand-softer)', borderRadius: 'var(--r-md)', display: 'flex', gap: 10 }}>
                <Icon name="info" size={18} style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: 13.2, lineHeight: 1.45, color: 'var(--ink-2)' }}>Your current invoice sits here after sending, with viewed, paid and overdue states attached.</span>
              </div>
              <Button variant="outline" iconRight="arrowRight" onClick={() => go('preview')}>View invoice</Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function EstimatesFlow({ store, update, region, go }) {
  const [converted, setConverted] = useStateC(false);
  const convert = () => {
    update({
      client: SUGGESTED_CLIENTS[2],
      invoice: {
        ...store.invoice,
        number: invoiceNumberForCountry(store.invoice.number || '0009', store.business?.country || defaultCountryForRegion(region)),
        terms: REGIONS[region].defaultTerms,
        items: [
          { desc: 'Brand strategy sprint', qty: 1, price: 1800, vat: region === 'EU' ? 21 : 0 },
          { desc: 'Landing page UX/UI design', qty: 1, price: 1800, vat: region === 'EU' ? 21 : 0 },
        ],
        notes: 'Converted from approved estimate EST-014. Thank you for approving the scope.',
      },
    });
    setConverted(true);
  };

  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 980 }}>
      <ScreenHead eyebrow="Estimates" title="Convert approved work into an invoice"
        sub="For service businesses, the useful path often starts before an invoice: quote, approve, convert, get paid." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <Card elevated style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, marginBottom: 24 }}>
            <div>
              <Badge tone="ok" icon="checkSmall">Approved today</Badge>
              <h2 style={{ margin: '14px 0 6px', fontSize: 24, fontWeight: 620, letterSpacing: '-0.025em' }}>Estimate EST-014</h2>
              <div style={{ fontSize: 14, color: 'var(--muted)' }}>Northwind Coffee · Website refresh</div>
            </div>
            <div className="num" style={{ fontSize: 28, fontWeight: 650, color: 'var(--brand)' }}>{fmtMoney(3600, region)}</div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              ['Brand strategy sprint', fmtMoney(1800, region)],
              ['Landing page UX/UI design', fmtMoney(1800, region)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontSize: 14, fontWeight: 530 }}>{label}</span>
                <span className="num" style={{ fontSize: 14 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <Button icon="invoice" onClick={convert}>{converted ? 'Converted' : 'Convert to invoice'}</Button>
            {converted && <Button variant="outline" iconRight="arrowRight" onClick={() => go('build')}>Review invoice</Button>}
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>What transfers</div>
          {['Client profile', 'Line items', 'Currency and terms', 'Approval audit trail'].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <span style={{ color: 'var(--ok)' }}><Icon name="checkSmall" size={15} /></span>
              <span style={{ fontSize: 13.5 }}>{item}</span>
            </div>
          ))}
          {converted && (
            <div style={{ marginTop: 16, padding: '13px 14px', background: 'var(--ok-soft)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>
              Invoice draft created with the approved scope. The user lands in the builder only if they want to make changes.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function RecurringSetup({ store, update, region, go }) {
  const [frequency, setFrequency] = useStateC('Monthly');
  const [start, setStart] = useStateC('2026-06-30');
  const [active, setActive] = useStateC(!!store.invoice.recurring);

  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 920 }}>
      <ScreenHead eyebrow="Recurring invoices" title="Turn repeat billing into a schedule"
        sub="Retainers and subscriptions should not require rebuilding the same invoice every month." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <Card>
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Template"><Input value={`Invoice #${store.invoice.number || '0001'} · ${store.client?.name || 'Meridian Studio'}`} onChange={() => {}} prefix={<Icon name="invoice" size={16} />} /></Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Frequency"><Select value={frequency} onChange={setFrequency} options={['Weekly', 'Monthly', 'Quarterly', 'Yearly']} /></Field>
              <Field label="First send date"><Input value={start} onChange={setStart} mono /></Field>
            </div>
            <ToggleRow icon="mail" title="Send automatically" desc="Email the invoice on each scheduled date" on={true} onChange={() => {}} />
            <Divider />
            <ToggleRow icon="clock" title="Reminders on by default" desc="Nudge before due and after overdue" on={true} onChange={() => {}} />
            <Divider />
            <ToggleRow icon="link" title="Keep payment link active" desc="Use saved payment preferences each cycle" on={true} onChange={() => {}} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
              <Button variant="outline" onClick={() => go('invoicesHome')}>Cancel</Button>
              <Button icon="recurring" onClick={() => {
                update({ invoice: { ...store.invoice, recurring: { frequency, start } } });
                setActive(true);
              }}>{active ? 'Schedule active' : 'Activate schedule'}</Button>
            </div>
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Upcoming invoices</div>
          {['2026-06-30', '2026-07-30', '2026-08-30'].map((date, i) => (
            <div key={date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--line)' : 'none' }}>
              <span style={{ width: 26, height: 26, borderRadius: 99, display: 'grid', placeItems: 'center', background: active ? 'var(--ok-soft)' : 'var(--surface-3)', color: active ? 'var(--ok)' : 'var(--faint)' }}>
                <Icon name={active ? 'checkSmall' : 'clock'} size={14} />
              </span>
              <div>
                <div className="num" style={{ fontSize: 13.5, fontWeight: 560 }}>{date}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{frequency} cycle · {active ? 'scheduled' : 'preview'}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function ExpenseCapture({ store, update, region, go }) {
  const [stage, setStage] = useStateC('empty');
  const attached = stage === 'attached';
  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 960 }}>
      <ScreenHead eyebrow="Expenses" title="Capture a receipt and bill it back"
        sub="Expenses become useful when they connect to a client, project or invoice instead of sitting in a shoebox." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <Card style={{ padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
            <button onClick={() => setStage('scanned')}
              style={{ minHeight: 118, borderRadius: 'var(--r-md)', border: '1.5px dashed var(--line-strong)', background: stage === 'empty' ? 'var(--surface-2)' : 'var(--brand-softer)', color: stage === 'empty' ? 'var(--muted)' : 'var(--brand-strong)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <span style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
                <Icon name={stage === 'empty' ? 'camera' : 'receipt'} size={30} />
                <span style={{ fontSize: 12.5, fontWeight: 560 }}>{stage === 'empty' ? 'Scan receipt' : 'Receipt scanned'}</span>
              </span>
            </button>
            <div style={{ display: 'grid', gap: 13 }}>
              <Field label="Merchant"><Input value={stage === 'empty' ? '' : 'Figma'} onChange={() => {}} placeholder="Merchant" /></Field>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                <Field label="Amount"><Input value={stage === 'empty' ? '' : '48.00'} onChange={() => {}} prefix={REGIONS[region].symbol} mono /></Field>
                <Field label="Category"><Select value="Software" onChange={() => {}} options={['Software', 'Travel', 'Meals', 'Office']} /></Field>
              </div>
              <Field label="Attach to"><Select value={`Invoice #${store.invoice.number || '0001'}`} onChange={() => {}} options={[`Invoice #${store.invoice.number || '0001'}`, 'Client only', 'Unassigned']} /></Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <Button variant="outline" icon="camera" onClick={() => setStage('scanned')}>Rescan</Button>
                <Button icon="link" disabled={stage === 'empty'} onClick={() => setStage('attached')}>{attached ? 'Attached' : 'Attach to invoice'}</Button>
              </div>
            </div>
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Invoice impact</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: attached ? 'var(--ok-soft)' : 'var(--surface-3)', color: attached ? 'var(--ok)' : 'var(--faint)' }}>
              <Icon name={attached ? 'checkSmall' : 'receipt'} size={18} />
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 560 }}>{attached ? 'Expense attached' : 'Waiting for attachment'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Figma · Software · {fmtMoney(48, region)}</div>
            </div>
          </div>
          <Meter pct={attached ? 100 : stage === 'scanned' ? 68 : 18} height={7} />
          <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.5, color: 'var(--muted)' }}>
            {attached ? 'The expense can be included as a billable line item or kept as an internal cost for reporting.' : 'Scanning extracts merchant, category and amount before the user decides where it belongs.'}
          </div>
          {attached && <Button variant="outline" size="sm" iconRight="arrowRight" onClick={() => go('build')} style={{ marginTop: 14 }}>Review invoice</Button>}
        </Card>
      </div>
    </div>
  );
}

function MoneyDashboard({ region }) {
  const [receiptOpen, setReceiptOpen] = useStateC(false);
  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>
      <ScreenHead eyebrow="Money" title="Payments, receipts and cashflow"
        sub="After the first invoice is sent, the product promise becomes visibility: what got paid, what is late, and what will land next." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 18 }}>
        <ProductStat label="Available soon" value={fmtMoney(4250, region)} tone="var(--ok)" icon="bank" />
        <ProductStat label="Overdue" value={fmtMoney(2800, region)} tone="var(--bad)" icon="alert" />
        <ProductStat label="Expected next 30d" value={fmtMoney(7900, region)} icon="clock" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, alignItems: 'start' }}>
        <Card pad={false}>
          {[
            ['Meridian Studio', 'Invoice #US-0007 paid', '+1450', 'Paid'],
            ['Holt & Vane', 'Invoice #GB-0008 overdue', '+2800', 'Overdue'],
            ['Northwind Coffee', 'Approved estimate', '+3600', 'Approved'],
          ].map(([client, detail, amount, status], i) => (
            <button key={client} onClick={() => status === 'Paid' && setReceiptOpen(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', border: 'none', borderBottom: i < 2 ? '1px solid var(--line)' : 'none', background: 'transparent', cursor: status === 'Paid' ? 'pointer' : 'default', textAlign: 'left' }}>
              <Monogram name={client} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 560 }}>{client}</div>
                <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{detail}</div>
              </div>
              <StatusBadge status={status} />
              <span className="num" style={{ width: 86, textAlign: 'right', fontSize: 14.5, fontWeight: 560 }}>{amount}</span>
            </button>
          ))}
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: receiptOpen ? 'var(--ok-soft)' : 'var(--brand-soft)', color: receiptOpen ? 'var(--ok)' : 'var(--brand)' }}>
              <Icon name={receiptOpen ? 'checkSmall' : 'bank'} size={19} />
            </span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{receiptOpen ? 'Receipt ready' : 'Payment detail'}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Bank match + receipt archive</div>
            </div>
          </div>
          {receiptOpen ? (
            <div style={{ display: 'grid', gap: 10 }}>
              <Row l="Invoice" v="#US-0007" />
              <Row l="Paid by" v="Meridian Studio" />
              <Row l="Deposit" v={fmtMoney(1450, region)} />
              <Row l="Matched" v="Automatically" />
              <Button variant="outline" icon="download">Download receipt</Button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Click the paid transaction to open the receipt and reconciliation detail.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ClientDirectory({ region, go }) {
  const clients = SUGGESTED_CLIENTS;
  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 900 }}>
      <ScreenHead eyebrow="Clients" title="Client profiles remember the billing work"
        sub="The first invoice gets faster because the second invoice does not ask for the same client, currency or tax details again."
        right={<Button icon="plus" onClick={() => go('client')}>Add client</Button>} />
      <div style={{ display: 'grid', gap: 12 }}>
        {clients.map((client) => (
          <Card key={client.email} hover style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '16px 18px' }}>
            <Monogram name={client.name} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 560 }}>{client.name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{client.email} · {client.country}</div>
            </div>
            <Badge tone="brand" size="sm">{REGIONS[region].code}</Badge>
            <Button variant="outline" size="sm" iconRight="arrowRight" onClick={() => go('build')}>Invoice</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ProductStat, InvoiceCommandCenter, EstimatesFlow, RecurringSetup,
  ExpenseCapture, MoneyDashboard, ClientDirectory,
});
