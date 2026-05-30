// screens-a.jsx — Dashboard (empty state), Guided Setup, Client Add
const { useState: useStateA, useEffect: useEffectA } = React;

/* ============================================================
   Shared flow chrome
============================================================ */
function ScreenHead({ eyebrow, title, sub, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 9 }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontSize: 27, fontWeight: 600, letterSpacing: '-0.025em', color: 'var(--ink)' }}>{title}</h1>
        {sub && <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--muted)', maxWidth: 560, lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

function FlowFooter({ onBack, onNext, nextLabel, nextIcon, nextDisabled, hint, backLabel }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      marginTop: 28, paddingTop: 22, borderTop: '1px solid var(--line)',
    }}>
      <div>{onBack && <Button variant="ghost" icon="arrowLeft" onClick={onBack}>{backLabel || 'Back'}</Button>}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {hint && <span style={{ fontSize: 13, color: 'var(--muted)' }}>{hint}</span>}
        {onNext && <Button size="lg" iconRight={nextIcon || 'arrowRight'} onClick={onNext} disabled={nextDisabled}>{nextLabel || 'Continue'}</Button>}
      </div>
    </div>
  );
}

function LogoUpload({ business, onChange }) {
  const inputId = 'business-logo-upload';
  const storeLogo = (fileName, sourceDataUrl) => {
    const img = new Image();
    img.onload = () => {
      const maxSide = 720;
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onChange({
        logo: true,
        logoData: sourceDataUrl,
        logoPdfData: canvas.toDataURL('image/jpeg', 0.9),
        logoName: fileName,
        logoError: '',
      });
    };
    img.onerror = () => onChange({ logo: true, logoData: sourceDataUrl, logoPdfData: '', logoName: fileName, logoError: '' });
    img.src = sourceDataUrl;
  };
  const upload = (file) => {
    if (!file) return;
    const validType = ['image/jpeg', 'image/png'].includes(file.type);
    if (!validType || file.size > 5 * 1024 * 1024) {
      onChange({ logoError: 'Use JPG, JPEG or PNG under 5MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => storeLogo(file.name, reader.result);
    reader.readAsDataURL(file);
  };
  const clearLogo = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onChange({ logo: false, logoData: '', logoPdfData: '', logoName: '', logoError: '' });
  };
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <input id={inputId} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }}
        onChange={(e) => upload(e.target.files && e.target.files[0])} />
      <label htmlFor={inputId}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files && e.dataTransfer.files[0]); }}
        style={{ minHeight: 118, borderRadius: 'var(--r-md)', border: '2px solid var(--brand-press)', background: 'var(--surface)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 18, padding: '20px 22px', color: 'var(--ink)' }}>
        {business.logoData ? (
          <span style={{ width: 64, height: 64, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: 'none' }}>
            <img src={business.logoData} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </span>
        ) : (
          <span style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', flex: 'none', color: 'var(--brand-press)' }}><Icon name="upload" size={34} /></span>
        )}
        <span style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 18, fontWeight: 620, textDecoration: business.logoData ? 'none' : 'underline', textUnderlineOffset: 5, color: 'var(--brand-press)' }}>
            {business.logoData ? 'Replace logo' : 'Upload file'}
          </span>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>{business.logoName || 'JPG, JPEG, PNG, less than 5MB'}</span>
        </span>
        {business.logoData && (
          <button type="button" onClick={clearLogo}
            style={{ marginLeft: 'auto', height: 34, padding: '0 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-2)',
              background: 'var(--surface-2)', color: 'var(--ink-2)', fontSize: 12.5, fontWeight: 540, cursor: 'pointer' }}>
            Remove
          </button>
        )}
      </label>
      {business.logoError && <div style={{ fontSize: 12, color: 'var(--bad)' }}>{business.logoError}</div>}
    </div>
  );
}

function PaymentMethodMark({ method, selected }) {
  if (method === 'PayPal') {
    return (
      <span aria-label="PayPal" style={{ display: 'inline-flex', alignItems: 'baseline', fontSize: 15, fontWeight: 760, letterSpacing: '-0.025em', lineHeight: 1 }}>
        <span style={{ color: selected ? '#003087' : 'var(--ink-2)' }}>Pay</span>
        <span style={{ color: selected ? '#0070ba' : 'var(--ink-2)' }}>Pal</span>
      </span>
    );
  }
  if (method === 'Apple Pay') {
    return (
      <span aria-label="Apple Pay" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: selected ? 'var(--ink)' : 'var(--ink-2)', lineHeight: 1 }}>
        <svg width="15" height="18" viewBox="0 0 18 22" aria-hidden="true" style={{ display: 'block', flex: 'none' }}>
          <path fill="currentColor" d="M14.3 11.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.6.8-3.3.8s-1.8-.8-2.9-.8c-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9.2.8 1.1 1.7 2.4 2.9 2.3 1.1 0 1.6-.7 2.9-.7 1.4 0 1.8.7 3 .7 1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.2-2.5 1.2-2.6-.1-.1-2.7-1.1-2.7-3.8zM12.1 4.9c.6-.8 1.1-1.8.9-2.9-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.8.9.1 1.9-.5 2.6-1.3z" />
        </svg>
        <span style={{ fontSize: 15, fontWeight: 680, letterSpacing: '-0.02em' }}>Pay</span>
      </span>
    );
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <Icon name={method === 'Card' ? 'wallet' : 'bank'} size={16} />
      <span>{method}</span>
    </span>
  );
}

/* ============================================================
   1 — DASHBOARD EMPTY STATE
============================================================ */
function DashboardEmpty({ go, region, emptyState, onTour }) {
  const r = REGIONS[region];
  const paths = [
    { icon: 'invoice', title: 'Send your first invoice', desc: 'Get paid for work you’ve already done.', primary: true, cta: 'Start invoice' },
    { icon: 'download', title: 'Download a real PDF', desc: 'Export the finished invoice locally.', cta: 'Available after build', target: 'setup', locked: true },
    { icon: 'shield', title: 'Browser workspace', desc: 'Saved on this device. No account or cloud sync.', cta: 'No sign-in', target: 'setup', locked: true },
  ];

  if (emptyState === 'tasks') {
    return (
      <div style={{ animation: 'fadeUp .4s ease both' }}>
        <ScreenHead eyebrow="Welcome to Andras" title="Let’s get you paid"
          sub="Three things stand between you and your first payment. The first one is the only one that matters today." />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, maxWidth: 720 }}>
          {paths.map((p, i) => (
            <Card key={i} hover={!p.locked} onClick={() => !p.locked && go(p.primary ? 'setup' : p.target)}
              style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 22px',
                borderColor: p.primary ? 'var(--brand)' : 'var(--line)',
                background: p.primary ? 'var(--brand-softer)' : 'var(--surface)',
                cursor: p.locked ? 'default' : 'pointer', opacity: p.primary ? 1 : 0.9 }}>
              <div style={{ width: 46, height: 46, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', flex: 'none',
                background: p.primary ? 'var(--brand)' : 'var(--surface-3)', color: p.primary ? 'var(--on-brand)' : 'var(--muted)' }}>
                <Icon name={p.icon} size={23} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 580, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{p.title}</div>
                <div style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: 2 }}>{p.desc}</div>
              </div>
              {p.primary
                ? <Button onClick={() => go('setup')} iconRight="arrowRight">{p.cta}</Button>
                : <Badge tone="neutral" size="sm">{p.cta}</Badge>}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 'hero' (default)
  return (
    <div style={{ animation: 'fadeUp .4s ease both' }}>
      <ScreenHead eyebrow="Welcome to Andras"
        title="You’re set up to get paid"
        sub="Andras handles the compliance, math and formatting. You bring the work. Let’s send your first invoice — it takes about two minutes." />
      <Card elevated style={{ padding: 0, overflow: 'hidden', maxWidth: 880 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr' }}>
          <div style={{ padding: '40px 40px 44px' }}>
            <Badge tone="brand" icon="sparkle">First invoice</Badge>
            <h2 style={{ margin: '18px 0 10px', fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.12 }}>
              Send a correct, professional invoice
            </h2>
            <p style={{ margin: '0 0 26px', fontSize: 15, color: 'var(--muted)', lineHeight: 1.55 }}>
              We’ll collect only what this invoice needs — your details, your client, the line items — and check it for {r.taxName} and payment errors before it goes out.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button size="lg" icon="invoice" onClick={() => go('setup')}>Send your first invoice</Button>
              <Button size="lg" variant="outline" icon="sparkle" onClick={onTour || (() => go('setup'))}>Free guided tour</Button>
            </div>
            <div style={{ display: 'flex', gap: 22, marginTop: 28 }}>
              {[['clock', '~2 min'], ['shield', `${r.taxName} checked`], ['bolt', 'Smart defaults']].map(([ic, tx]) => (
                <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--ink-2)' }}>
                  <span style={{ color: 'var(--brand)' }}><Icon name={ic} size={17} /></span>{tx}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 18, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12.8, color: 'var(--muted)', background: 'var(--brand-softer)', border: '1px solid var(--brand-soft)', borderRadius: 'var(--r-md)', maxWidth: 430 }}>
              <span style={{ color: 'var(--brand)', flex: 'none', marginTop: 1 }}><Icon name="shield" size={16} /></span>
              <span><b style={{ color: 'var(--ink)', fontWeight: 580 }}>Browser workspace.</b> Your draft is saved on this device only. No account, no cloud sync.</span>
            </div>
          </div>
          {/* invoice glance */}
          <div style={{ background: 'var(--surface-2)', borderLeft: '1px solid var(--line)', padding: 30, display: 'grid', placeItems: 'center' }}>
            <div style={{ width: '100%', maxWidth: 280, background: 'var(--surface)', borderRadius: 'var(--r-md)', boxShadow: 'var(--sh-3)', padding: 22, transform: 'rotate(-1.4deg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                <Logo size={20} withWordmark={false} />
                <div style={{ textAlign: 'right' }}>
                  <div className="eyebrow" style={{ fontSize: 9 }}>Invoice</div>
                  <div className="num" style={{ fontSize: 13, fontWeight: 600 }}>#0001</div>
                </div>
              </div>
              {[68, 52, 80].map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ height: 7, width: w + '%', background: 'var(--line-2)', borderRadius: 99 }} />
                  <div style={{ height: 7, width: 28, background: 'var(--line)', borderRadius: 99 }} />
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>Total due</span>
                <span className="num" style={{ fontSize: 17, fontWeight: 600, color: 'var(--brand)' }}>{r.symbol}—</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 16, maxWidth: 880 }}>
        {[['download', 'Real PDF export', 'Download and share yourself'], ['shield', 'Browser workspace', 'Saved on this device'], ['globe', 'Country-aware setup', 'Prefixes, currency and tax defaults']].map(([ic, t, d]) => (
          <Card key={t} style={{ padding: '18px 18px', opacity: 0.92 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ color: 'var(--brand)' }}><Icon name={ic} size={20} /></span>
              <Badge tone="brand" size="sm">MVP</Badge>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 560 }}>{t}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{d}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   2 — GUIDED SETUP
============================================================ */
function SetupSection({ icon, title, desc, done, open, onToggle, children, locked }) {
  return (
    <Card pad={false} style={{ overflow: 'hidden', borderColor: open ? 'var(--line-2)' : 'var(--line)' }}>
      <button onClick={onToggle} disabled={locked}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 15, padding: '18px 20px',
          background: 'transparent', border: 'none', cursor: locked ? 'default' : 'pointer', textAlign: 'left' }}>
        <span style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', flex: 'none',
          background: done ? 'var(--ok-soft)' : 'var(--brand-soft)', color: done ? 'var(--ok)' : 'var(--brand-strong)' }}>
          {done ? <Icon name="checkSmall" size={20} stroke={2.4} /> : <Icon name={icon} size={20} />}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 560, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 9 }}>
            {title}{done && <Badge tone="ok" size="sm" icon="checkSmall">Done</Badge>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 1 }}>{desc}</div>
        </div>
        <span style={{ color: 'var(--faint)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
          <Icon name="chevDown" size={20} />
        </span>
      </button>
      {open && <div style={{ padding: '4px 20px 22px', animation: 'fadeIn .25s ease both' }}>{children}</div>}
    </Card>
  );
}

function GuidedSetup({ store, update, region, go, setupLayout }) {
  const r = REGIONS[region];
  const b = store.business;
  const setB = (patch) => update({
    business: { ...store.business, ...patch },
    ...(patch.country ? { invoice: { ...store.invoice, number: invoiceNumberForCountry(store.invoice.number, patch.country), currency: defaultCurrencyForCountry(patch.country, region) } } : {}),
  });
  const paymentRail = paymentRailForCountry(b.country, region);
  const [open, setOpen] = useStateA('biz');

  const bizDone = !!(b.name && b.address);
  const taxDone = b.taxRegistered === false || !!b.taxId;
  const bankDone = !!(b.accountName && b.iban);
  const allDone = bizDone && taxDone && bankDone;
  const steps = ['biz', 'tax', 'bank'];
  const focusIdx = steps.indexOf(open);

  const advance = (next) => {
    if (setupLayout === 'focus') {
      const i = steps.indexOf(open);
      setOpen(steps[Math.min(i + 1, steps.length - 1)]);
    } else {
      setOpen(next);
    }
  };

  const Body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SetupSection icon="building" title="Business profile" desc="Your name and address as they’ll appear on the invoice"
        done={bizDone} open={open === 'biz'} locked={setupLayout === 'focus' && open !== 'biz'}
        onToggle={() => setOpen(open === 'biz' ? '' : 'biz')}>
        <div style={{ display: 'grid', gap: 18, alignItems: 'start' }}>
          <LogoUpload business={b} onChange={setB} />
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Business name" required>
              <Input value={b.name} onChange={(v) => setB({ name: v })} placeholder="e.g. Atlas Design Co." />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="You operate as">
                <Select value={b.type} onChange={(v) => setB({ type: v })}
                  options={['Sole proprietor / freelancer', 'Small team / LLC', 'Limited company']} />
              </Field>
              <Field label="Country" hint={`Invoice numbers use ${invoicePrefixForCountry(b.country)}-0001 style. Default currency: ${defaultCurrencyForCountry(b.country, region)}.`}>
                <Select value={b.country} onChange={(v) => setB({ country: v })} options={ALL_COUNTRY_OPTIONS} />
              </Field>
            </div>
            <Field label="Business address" required hint="Appears in the invoice header for both parties’ records.">
              <Input value={b.address} onChange={(v) => setB({ address: v })} placeholder="Street, city, postal code" />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onClick={() => advance('tax')} disabled={!bizDone} iconRight="arrowRight" size="sm">Save & continue</Button>
        </div>
      </SetupSection>

      <SetupSection icon="shield" title={`Tax status — ${r.taxName}`} desc={`We only apply ${r.taxName} if you tell us you’re registered`}
        done={taxDone} open={open === 'tax'} locked={setupLayout === 'focus' && focusIdx < 1}
        onToggle={() => setOpen(open === 'tax' ? '' : 'tax')}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[[true, `I’m ${r.taxName}-registered`], [false, `Not registered`]].map(([val, label]) => (
            <button key={String(val)} onClick={() => setB({ taxRegistered: val, taxId: val ? b.taxId : '' })}
              style={{ flex: 1, padding: '14px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left',
                border: '1.5px solid ' + (b.taxRegistered === val ? 'var(--brand)' : 'var(--line-2)'),
                background: b.taxRegistered === val ? 'var(--brand-softer)' : 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 18, height: 18, borderRadius: 99, border: '2px solid ' + (b.taxRegistered === val ? 'var(--brand)' : 'var(--line-strong)'), display: 'grid', placeItems: 'center' }}>
                  {b.taxRegistered === val && <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--brand)' }} />}
                </span>
                <span style={{ fontSize: 14, fontWeight: 540 }}>{label}</span>
              </div>
            </button>
          ))}
        </div>
        {b.taxRegistered === true && (
          <Field label={`${r.taxIdName} number`} required hint={`We’ll validate the format and add ${r.taxName} to taxable lines automatically.`} style={{ animation: 'fadeIn .2s ease both' }}>
            <Input value={b.taxId} onChange={(v) => setB({ taxId: v })} placeholder={r.taxIdPlaceholder} mono />
          </Field>
        )}
        {b.taxRegistered === false && (
          <div style={{ display: 'flex', gap: 10, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--ink-2)', animation: 'fadeIn .2s ease both' }}>
            <span style={{ color: 'var(--muted)', flex: 'none' }}><Icon name="info" size={18} /></span>
            <span>No {r.taxName} will be added. Your invoice will note “{r.taxName} not applicable”. You can change this any time in Settings.</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <Button onClick={() => advance('bank')} disabled={!taxDone} iconRight="arrowRight" size="sm">Save & continue</Button>
        </div>
      </SetupSection>

      <SetupSection icon="bank" title="Payment details" desc={`Where clients send money — your ${paymentRail.label}`}
        done={bankDone} open={open === 'bank'} locked={setupLayout === 'focus' && focusIdx < 2}
        onToggle={() => setOpen(open === 'bank' ? '' : 'bank')}>
        <div style={{ display: 'grid', gap: 12 }}>
          <Field label="Account holder" required>
            <Input value={b.accountName} onChange={(v) => setB({ accountName: v })} placeholder={b.name || 'Account holder name'} />
          </Field>
          <Field label={paymentRail.label} required hint={paymentRail.helper}>
            <Input value={b.iban} onChange={(v) => setB({ iban: v })}
              placeholder={paymentRail.placeholder} mono prefix={<Icon name="bank" size={16} />} />
          </Field>
          <div>
            <div style={{ fontSize: 13, fontWeight: 540, color: 'var(--ink-2)', marginBottom: 8 }}>Also let clients pay by</div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {paymentRail.methods.map((m) => {
                const activeMethods = (b.methods || ['Card']).filter((method) => paymentRail.methods.includes(method));
                const on = (activeMethods.length ? activeMethods : ['Card']).includes(m);
                return (
                  <button key={m} onClick={() => {
                    const cur = activeMethods.length ? activeMethods : ['Card'];
                    setB({ methods: on ? cur.filter((x) => x !== m) : [...cur, m] });
                  }} style={{ minHeight: 38, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 'var(--r-pill)', cursor: 'pointer', fontSize: 13, fontWeight: 530,
                    border: '1.5px solid ' + (on ? 'var(--brand)' : 'var(--line-2)'), background: on ? 'var(--brand-softer)' : 'var(--surface)', color: on ? 'var(--brand-strong)' : 'var(--ink-2)' }}>
                    <span style={{ width: 16, height: 16, display: 'grid', placeItems: 'center', flex: 'none', color: on ? 'var(--brand)' : 'var(--faint)' }}>
                      {on ? <Icon name="checkSmall" size={14} stroke={2.6} /> : <Icon name="plus" size={13} stroke={2.4} />}
                    </span>
                    <PaymentMethodMark method={m} selected={on} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </SetupSection>
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 760 }}>
      <ScreenHead eyebrow="Step 1 of 4 · Setup"
        title="Set up your business"
        sub="This is a one-time setup. We ask for the minimum your first invoice needs — and nothing blocks you from continuing."
        right={<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ReadinessRing pct={Math.round(((bizDone + taxDone + bankDone) / 3) * 100)} size={48} />
          <div style={{ fontSize: 12.5, color: 'var(--muted)', maxWidth: 110, lineHeight: 1.3 }}>setup complete</div>
        </div>} />

      {/* smart defaults banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 16px', marginBottom: 18,
        background: 'var(--brand-softer)', border: '1px solid var(--brand-soft)', borderRadius: 'var(--r-md)' }}>
        <span style={{ color: 'var(--brand)', flex: 'none' }}><Icon name="sparkle" size={19} /></span>
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
          <b style={{ color: 'var(--ink)', fontWeight: 580 }}>Smart defaults applied.</b> Based on {b.country || r.label}, we’ve preset your currency to <span className="num">{defaultCurrencyForCountry(b.country, region)}</span>, terms to <b>{r.defaultTerms}</b>{region === 'EU' ? `, and ${r.taxName} to 21%` : ''}. Change anything below.
        </div>
      </div>

      {Body}

      <FlowFooter onBack={() => go('dashboard')} backLabel="Dashboard"
        onNext={() => go('client')} nextLabel={allDone ? 'Continue to client' : 'Continue anyway'}
        hint={allDone ? 'Looks complete' : 'You can finish setup later — nothing is blocked'} />
    </div>
  );
}

/* ============================================================
   3 — CLIENT ADD
============================================================ */
function ClientAdd({ store, update, region, go }) {
  const [draft, setDraft] = useStateA({ name: '', email: '', company: '', address: '', country: defaultCountryForRegion(region) });
  const selected = store.client;

  const saveManual = () => { if (draft.name && draft.email) update({ client: { ...draft } }); };

  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 760 }}>
      <ScreenHead eyebrow="Step 2 of 4 · Client" title="Who are you invoicing?"
        sub="Enter the recipient details that should appear on this invoice. No contacts are imported and nothing is shared with Andras." />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--brand-softer)', border: '1px solid var(--brand-soft)', borderRadius: 'var(--r-md)', marginBottom: 18, maxWidth: 680 }}>
        <span style={{ color: 'var(--brand)', flex: 'none' }}><Icon name="shield" size={18} /></span>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.45 }}>
          <b style={{ color: 'var(--ink)', fontWeight: 580 }}>Browser workspace.</b> Client details are used for the invoice PDF and saved on this device only.
        </div>
      </div>

      <Card style={{ animation: 'fadeIn .2s ease both' }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Client / contact name" required><Input value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Client name" /></Field>
            <Field label="Billing email" required hint="Shown in the draft email copy"><Input value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} placeholder="billing@company.com" /></Field>
          </div>
          <Field label="Company" optional><Input value={draft.company} onChange={(v) => setDraft({ ...draft, company: v })} placeholder="Client company" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 12 }}>
            <Field label="Billing address" optional><Input value={draft.address} onChange={(v) => setDraft({ ...draft, address: v })} placeholder="Street, city, postal code" /></Field>
            <Field label="Country" hint={`${invoicePrefixForCountry(draft.country)} country prefix`}><Select value={draft.country} onChange={(v) => setDraft({ ...draft, country: v })} options={ALL_COUNTRY_OPTIONS} /></Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={saveManual} disabled={!(draft.name && draft.email)} icon="plus">Save client</Button>
          </div>
        </div>
      </Card>

      {selected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginTop: 16, padding: '13px 16px', background: 'var(--ok-soft)', borderRadius: 'var(--r-md)', animation: 'fadeIn .25s ease both' }}>
          <span style={{ color: 'var(--ok)' }}><Icon name="checkSmall" size={19} stroke={2.4} /></span>
          <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>Invoicing <b style={{ color: 'var(--ink)' }}>{selected.name}</b> at <span className="num">{selected.email}</span></span>
        </div>
      )}

      <FlowFooter onBack={() => go('setup')} onNext={() => go('build')} nextLabel="Build the invoice"
        nextDisabled={!(selected && selected.email)} hint={selected ? null : 'Select or add a client to continue'} />
    </div>
  );
}

Object.assign(window, { ScreenHead, FlowFooter, DashboardEmpty, GuidedSetup, ClientAdd });
