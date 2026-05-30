// app.jsx — Andras shell: navigation, state machine, timer, tweaks, case-study overlay
const { useState: useS, useEffect: useE, useRef: useR } = React;

const FLOW = ['setup', 'client', 'build', 'check', 'preview', 'send'];
const PRODUCT_TITLES = {
  dashboard: 'Home',
  invoicesHome: 'Invoices',
  estimatesHome: 'Estimates',
  clientsHome: 'Clients',
  moneyHome: 'Money',
  expensesHome: 'Expenses',
  recurringSetup: 'Recurring',
  settings: 'Settings',
  success: 'Invoice ready',
};

const ROUTES = [
  'dashboard', 'invoicesHome', 'estimatesHome', 'clientsHome', 'moneyHome', 'expensesHome', 'recurringSetup',
  'settings', 'setup', 'client', 'build', 'check', 'preview', 'send', 'success',
];

function routeFromHash() {
  const route = (window.location.hash || '').replace(/^#\/?/, '');
  return ROUTES.includes(route) ? route : 'dashboard';
}

const CASE_NOTES = {
  dashboard: { metric: 'Activation entry point', body: 'Single, unmissable primary action. We measure click-through to setup and resist competing CTAs that dilute activation.' },
  setup:     { metric: 'Setup completion rate · Drop-off by step', body: 'Progressive disclosure + smart regional defaults cut fields by ~40%. Nothing blocks “Continue”, so we don’t lose users who want to finish setup later.' },
  client:    { metric: 'Time to first invoice', body: 'Manual entry stays focused on invoice-critical fields only. Users add a real recipient without needing an account or contact import.' },
  build:     { metric: 'Validation error rate', body: 'The live Readiness rail surfaces issues as they happen, not at the end. Errors get fixed in context before they ever become a failed send.' },
  check:     { metric: 'First invoice send rate · Validation error rate', body: 'A correctness gate that’s helpful, not punishing: every blocker links to its fix. We separate must-fix (block) from worth-a-look (warn).' },
  preview:   { metric: 'Invoice edit / reopen rate', body: 'Edit hotspots let users correct in place instead of restarting. Confidence here reduces post-send reopens and credit notes.' },
  send:      { metric: 'PDF download rate', body: 'The MVP closes with a real PDF export. Users can attach it anywhere without account or sender-domain setup.' },
  success:   { metric: 'Time to first invoice (closed)', body: 'The flow closes once the invoice PDF is ready, with a simple path to download or start another draft.' },
};

const TOUR_STEPS = [
  {
    screen: 'setup',
    icon: 'building',
    title: 'Set up the business once',
    body: 'Add business details, logo, country, tax status and payout details. The tour is free and you can skip it any time.',
  },
  {
    screen: 'client',
    icon: 'clients',
    title: 'Add the real recipient',
    body: 'Enter only the client details needed for this invoice. No contacts are imported and nothing is shared with Andras.',
  },
  {
    screen: 'build',
    icon: 'invoice',
    title: 'Build and personalize the invoice',
    body: 'Currency, sequential invoice numbers, line items and invoice style all update the client-facing PDF.',
  },
  {
    screen: 'check',
    icon: 'shield',
    title: 'Fix issues before sharing',
    body: 'The readiness check separates true blockers from warnings and links each issue back to the right step.',
  },
  {
    screen: 'preview',
    icon: 'doc',
    title: 'Preview the client experience',
    body: 'The PDF, payment block and edit hotspots make the invoice feel safe to download before anything is shared.',
  },
  {
    screen: 'send',
    icon: 'mail',
    title: 'Download the PDF',
    body: 'The final step produces the invoice file. No email provider, domain, or account setup is required.',
  },
];

function CaseOverlay({ screen, on }) {
  if (!on) return null;
  const n = CASE_NOTES[screen];
  if (!n) return null;
  return (
    <div style={{ position: 'fixed', right: 22, bottom: 22, width: 340, zIndex: 60, animation: 'fadeUp .3s ease both' }}>
      <div style={{ background: 'var(--ink)', color: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: '16px 18px', boxShadow: 'var(--sh-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--brand)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="bolt" size={14} /></span>
          <span className="kbd-mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(0.8 0.03 256)' }}>Case study · metric</span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 580, marginBottom: 6, letterSpacing: '-0.01em' }}>{n.metric}</div>
        <div style={{ fontSize: 12.8, lineHeight: 1.5, color: 'oklch(0.86 0.01 256)' }}>{n.body}</div>
      </div>
    </div>
  );
}

function GuidedTourCoachmark({ stepIndex, onNext, onBack, onSkip }) {
  if (stepIndex === null) return null;
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, width: 380, zIndex: 80, animation: 'fadeUp .25s ease both' }}>
      <Card elevated style={{ padding: 0, overflow: 'hidden', borderColor: 'var(--brand)' }}>
        <div style={{ height: 5, background: 'var(--brand)' }} />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', flex: 'none', background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
              <Icon name={step.icon} size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="eyebrow" style={{ fontSize: 10.5 }}>Free guided tour · {stepIndex + 1} of {TOUR_STEPS.length}</div>
              <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', marginTop: 2 }}>{step.title}</div>
            </div>
            <IconButton name="close" label="Close tour" onClick={onSkip} />
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55 }}>{step.body}</p>
          <div style={{ display: 'flex', gap: 5, marginTop: 15 }}>
            {TOUR_STEPS.map((_, i) => (
              <span key={i} style={{ height: 4, flex: 1, borderRadius: 99, background: i <= stepIndex ? 'var(--brand)' : 'var(--line-2)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 16 }}>
            <Button variant="ghost" size="sm" onClick={onBack} disabled={stepIndex === 0} icon="arrowLeft">Back</Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" onClick={onSkip}>Skip</Button>
              <Button size="sm" iconRight={isLast ? 'checkSmall' : 'arrowRight'} onClick={onNext}>{isLast ? 'Finish tour' : 'Next'}</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Sidebar({ screen, go, region }) {
  const items = [
    { id: 'home', icon: 'home', label: 'Home', target: 'dashboard' },
    { id: 'invoices', icon: 'invoice', label: 'Invoice flow', target: 'invoicesHome', badge: 'flow', screens: ['invoicesHome'] },
  ];
  const inFlow = FLOW.includes(screen) || screen === 'success';
  return (
    <aside style={{ width: 232, flex: 'none', borderRight: '1px solid var(--line)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', padding: '18px 14px' }}>
      <div style={{ padding: '4px 8px 20px' }}><Logo size={24} /></div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((it) => {
          const active = (it.target === 'dashboard' && screen === 'dashboard') || (it.badge === 'flow' && inFlow) || (it.screens || []).includes(screen);
          return (
            <button key={it.id} onClick={() => it.target && go(it.target)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: active ? 'var(--brand-soft)' : 'transparent', color: active ? 'var(--brand-strong)' : 'var(--ink-2)', fontSize: 14, fontWeight: active ? 560 : 500, transition: 'background .14s' }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <Icon name={it.icon} size={19} />{it.label}
              {it.badge === 'flow' && (inFlow || active) && <span style={{ marginLeft: 'auto', width: 7, height: 7, borderRadius: 99, background: 'var(--brand)' }} />}
            </button>
          );
        })}
      </nav>
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={() => go('settings')} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer', background: screen === 'settings' ? 'var(--brand-soft)' : 'transparent', color: screen === 'settings' ? 'var(--brand-strong)' : 'var(--ink-2)', fontSize: 14, fontWeight: screen === 'settings' ? 560 : 500 }}>
          <Icon name="settings" size={19} />Settings
        </button>
        <Divider style={{ margin: '8px 0' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px' }}>
          <Monogram name="Browser Workspace" size={34} tone={256} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 540, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Browser workspace</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Saved on this device</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SettingsPage({ store, region, go, clearLocalData }) {
  const totals = computeTotals(store.invoice, region);
  const hasDraft = !!(store.business.name || store.client || totals.total || (store.invoice.items || []).some((item) => item.desc));
  const rows = [
    ['Workspace mode', 'Browser workspace'],
    ['Storage', 'Saved on this device only'],
    ['Cloud sync', 'Off'],
    ['Accounts', 'Not required'],
    ['Email sending', 'Not connected'],
  ];
  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 760 }}>
      <ScreenHead eyebrow="Settings" title="Browser workspace"
        sub="Andras keeps this MVP simple: your draft stays in this browser, and the final invoice downloads as a PDF." />

      <Card elevated style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--line)' }}>
          <span style={{ width: 42, height: 42, borderRadius: 'var(--r-md)', display: 'grid', placeItems: 'center', flex: 'none', background: 'var(--brand-soft)', color: 'var(--brand-strong)' }}>
            <Icon name="shield" size={21} />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>No account or cloud sync</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Data is stored in your browser storage on this device.</div>
          </div>
        </div>
        <div style={{ padding: 20, display: 'grid', gap: 12 }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 11, borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontSize: 13.5, color: 'var(--muted)' }}>{label}</span>
              <span style={{ fontSize: 13.5, fontWeight: 560, color: 'var(--ink)' }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em' }}>Local draft</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.45 }}>
              {hasDraft ? 'A draft is saved in this browser. Clearing it removes business, client and invoice fields from this device.' : 'No meaningful draft data is saved yet.'}
            </div>
          </div>
          <Button variant="danger" icon="trash" onClick={clearLocalData} disabled={!hasDraft}>Clear draft</Button>
        </div>
      </Card>

      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: '-0.015em' }}>Invoice setup</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, lineHeight: 1.45 }}>Return to the guided flow to edit business details, payment details, client, line items and invoice style.</div>
          </div>
          <Button variant="outline" iconRight="arrowRight" onClick={() => go('setup')}>Open setup</Button>
        </div>
      </Card>
    </div>
  );
}

function Topbar({ screen, go, region, setRegion, elapsedLive, onTour }) {
  const inFlow = FLOW.includes(screen);
  const idx = FLOW.indexOf(screen);
  return (
    <header style={{ height: 60, flex: 'none', borderBottom: '1px solid var(--line)', background: 'oklch(1 0 0 / 0.72)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 16, padding: '0 26px', position: 'sticky', top: 0, zIndex: 20 }}>
      {inFlow ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {FLOW.slice(0, 4).map((s, i) => (
            <React.Fragment key={s}>
              <button onClick={() => go(s)} style={{ display: 'flex', alignItems: 'center', gap: 7, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
                <span style={{ width: 22, height: 22, borderRadius: 99, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, flex: 'none',
                  background: i < (idx > 3 ? 4 : idx) ? 'var(--ok)' : i === idx || (idx > 3 && i === 3) ? 'var(--brand-soft)' : 'var(--surface-3)',
                  color: i < idx ? 'var(--on-brand)' : i === idx || (idx > 3 && i === 3) ? 'var(--brand-strong)' : 'var(--faint)', border: i === idx ? '1.5px solid var(--brand)' : 'none' }} className="num">
                  {i < idx ? <Icon name="checkSmall" size={13} /> : i + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: i === idx ? 560 : 500, color: i === idx ? 'var(--ink)' : 'var(--muted)' }}>
                  {['Setup', 'Client', 'Build', 'Review'][i]}
                </span>
              </button>
              {i < 3 && <span style={{ color: 'var(--line-2)' }}><Icon name="chevRight" size={15} /></span>}
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 15, fontWeight: 560, color: 'var(--ink)' }}>{PRODUCT_TITLES[screen] || 'Home'}</div>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {(inFlow || screen === 'success') && elapsedLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted)' }} className="num">
            <Icon name="clock" size={15} /> {elapsedLive}
          </div>
        )}
        <button onClick={() => setRegion(region === 'US' ? 'EU' : 'US')}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 'var(--r-pill)', border: '1px solid var(--line-2)', background: 'var(--surface)', cursor: 'pointer', fontSize: 12.5, fontWeight: 530, color: 'var(--ink-2)' }}
          title="Toggle region (demo)">
          <Icon name="globe" size={15} /> {REGIONS[region].code} · {region}
        </button>
        <span title="Your draft is stored in this browser. No account or cloud sync yet."
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 'var(--r-pill)', border: '1px solid var(--line-2)', background: 'var(--surface)', fontSize: 12.5, fontWeight: 530, color: 'var(--ink-2)' }}>
          <Icon name="shield" size={15} /> Browser workspace
        </span>
        <button onClick={onTour}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 'var(--r-pill)', border: '1px solid var(--brand)', background: 'var(--brand-soft)', cursor: 'pointer', fontSize: 12.5, fontWeight: 560, color: 'var(--brand-strong)' }}>
          <Icon name="sparkle" size={15} /> Free tour
        </button>
        <IconButton name="search" label="Search" />
      </div>
    </header>
  );
}

/* ----------------------------------------------------------
   APP
---------------------------------------------------------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "blue",
  "density": "regular",
  "fontPair": "grotesk",
  "region": "US",
  "setupLayout": "checklist",
  "emptyState": "hero",
  "showRail": true,
  "caseStudy": false
}/*EDITMODE-END*/;

const LOCAL_STORE_KEY = 'andras.invoice.local.v1';

function createInitialStore(region) {
  const country = defaultCountryForRegion(region);
  return {
    business: { name: '', type: 'Sole proprietor / freelancer', country, logo: false, logoData: '', logoPdfData: '', logoName: '', logoError: '', taxRegistered: undefined, taxId: '', address: '', accountName: '', iban: '', bankFilled: false, methods: ['Card'] },
    client: null,
    invoice: freshInvoice(region, country),
    numberClash: false,
  };
}

function loadLocalStore(region) {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORE_KEY);
    if (!stored) return createInitialStore(region);
    const parsed = JSON.parse(stored);
    const initial = createInitialStore(region);
    return {
      ...initial,
      ...parsed,
      business: { ...initial.business, ...(parsed.business || {}) },
      invoice: { ...initial.invoice, ...(parsed.invoice || {}) },
    };
  } catch (error) {
    return createInitialStore(region);
  }
}

function storeWithoutHeavyAssets(store) {
  return {
    ...store,
    business: {
      ...store.business,
      logo: false,
      logoData: '',
      logoPdfData: '',
      logoName: store.business.logoData ? '' : store.business.logoName,
      logoError: '',
    },
  };
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useS(routeFromHash);
  const [region, setRegionState] = useS(t.region);
  const [store, setStore] = useS(() => loadLocalStore(t.region));
  const [startTime, setStartTime] = useS(null);
  const [elapsed, setElapsed] = useS(null);
  const [live, setLive] = useS(null);
  const [tourStep, setTourStep] = useS(null);

  // keep region in sync with tweak
  useE(() => { setRegionState(t.region); }, [t.region]);

  // re-seed currency/terms/country when region changes
  useE(() => {
    const r = REGIONS[region];
    setStore((s) => ({
      ...s,
      business: { ...s.business, country: s.business.country || defaultCountryForRegion(region) },
      invoice: { ...s.invoice, currency: s.invoice.currency || defaultCurrencyForCountry(s.business.country || defaultCountryForRegion(region), region), terms: r.defaultTerms,
        number: invoiceNumberForCountry(s.invoice.number, s.business.country || defaultCountryForRegion(region)),
        items: s.invoice.items.map((it) => ({ ...it, vat: s.business.taxRegistered ? (region === 'EU' ? 21 : 0) : 0 })) },
    }));
  }, [region]);

  useE(() => {
    try {
      window.localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(storeWithoutHeavyAssets(store)));
    } catch (error) {
      // Keep the app usable if a browser blocks storage or an uploaded logo is too large.
    }
  }, [store]);

  // apply density + accent + font to root
  useE(() => {
    const root = document.documentElement;
    root.setAttribute('data-density', t.density);
    root.setAttribute('data-accent', t.accent);
    root.style.setProperty('--font-ui', "'Poppins', system-ui, sans-serif");
  }, [t.density, t.accent, t.fontPair]);

  // live timer
  useE(() => {
    if (!startTime || elapsed) return;
    const iv = setInterval(() => {
      const ms = Date.now() - startTime;
      const s = Math.floor(ms / 1000);
      setLive(`${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`);
    }, 1000);
    return () => clearInterval(iv);
  }, [startTime, elapsed]);

  useE(() => { const b = document.getElementById('boot'); if (b) b.remove(); }, []);

  useE(() => {
    const onHash = () => setScreen(routeFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const update = (patch) => setStore((s) => ({ ...s, ...patch }));

  const go = (next) => {
    if (next === 'setup' && !startTime && screen === 'dashboard') {
      const now = Date.now(); setStartTime(now); setLive('0m 00s');
    }
    setScreen(next);
    if (ROUTES.includes(next) && window.location.hash !== `#/${next}`) {
      window.history.pushState(null, '', `#/${next}`);
    }
    document.getElementById('scroll-area')?.scrollTo({ top: 0, behavior: 'instant' });
  };

  const startTour = () => {
    setTourStep(0);
    go(TOUR_STEPS[0].screen);
  };

  const moveTour = (delta) => {
    setTourStep((current) => {
      if (current === null) return current;
      const next = current + delta;
      if (next < 0) return current;
      if (next >= TOUR_STEPS.length) return null;
      go(TOUR_STEPS[next].screen);
      return next;
    });
  };

  const completeInvoice = ({ download = false } = {}) => {
    if (download) downloadInvoicePdf(store, region);
    if (startTime) {
      const s = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(`${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`);
    } else { setElapsed('1m 52s'); }
    go('success');
    document.getElementById('scroll-area')?.scrollTo({ top: 0 });
  };

  const resetFlow = () => {
    setStore((s) => ({ ...s, client: null, invoice: { ...freshInvoice(region, s.business.country), number: nextInvoiceNumber(s.invoice.number, s.business.country) } }));
    setStartTime(null); setElapsed(null); setLive(null);
    go('build'); setScreen('build');
  };

  const clearLocalData = () => {
    try { window.localStorage.removeItem(LOCAL_STORE_KEY); } catch (error) {}
    setStore(createInitialStore(region));
    setStartTime(null); setElapsed(null); setLive(null);
    go('dashboard');
  };

  const screenProps = { store, update, region, go, t };
  let body;
  if (screen === 'dashboard') body = <DashboardEmpty go={go} region={region} emptyState={t.emptyState} onTour={startTour} />;
  else if (screen === 'setup') body = <GuidedSetup {...screenProps} setupLayout={t.setupLayout} />;
  else if (screen === 'client') body = <ClientAdd {...screenProps} />;
  else if (screen === 'build') body = <InvoiceBuilder {...screenProps} showRail={t.showRail} />;
  else if (screen === 'check') body = <CompletenessCheck store={store} region={region} go={go} />;
  else if (screen === 'preview') body = <Preview store={store} region={region} go={go} onFinish={() => completeInvoice({ download: true })} />;
  else if (screen === 'send') body = <SendFlow {...screenProps} onSend={() => completeInvoice({ download: true })} />;
  else if (screen === 'success') body = <Success store={store} region={region} go={go} resetFlow={resetFlow} elapsed={elapsed} />;
  else if (screen === 'invoicesHome') body = <InvoiceCommandCenter store={store} update={update} region={region} go={go} />;
  else if (screen === 'estimatesHome') body = <EstimatesFlow store={store} update={update} region={region} go={go} />;
  else if (screen === 'recurringSetup') body = <RecurringSetup store={store} update={update} region={region} go={go} />;
  else if (screen === 'expensesHome') body = <ExpenseCapture store={store} update={update} region={region} go={go} />;
  else if (screen === 'moneyHome') body = <MoneyDashboard store={store} region={region} go={go} />;
  else if (screen === 'clientsHome') body = <ClientDirectory region={region} go={go} />;
  else if (screen === 'settings') body = <SettingsPage store={store} region={region} go={go} clearLocalData={clearLocalData} />;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar screen={screen} go={go} region={region} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar screen={screen} go={go} region={region} setRegion={(rg) => setTweak('region', rg)} elapsedLive={live} onTour={startTour} />
        <div id="scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '34px 40px 80px', maxWidth: 1180, margin: '0 auto' }}>{body}</div>
        </div>
      </div>

      <CaseOverlay screen={screen} on={t.caseStudy} />
      <GuidedTourCoachmark stepIndex={tourStep} onNext={() => moveTour(1)} onBack={() => moveTour(-1)} onSkip={() => setTourStep(null)} />

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakColor label="Accent" value={t.accent}
          options={['blue', 'emerald', 'violet', 'ink']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Type" value={t.fontPair} options={['grotesk', 'humanist']} onChange={(v) => setTweak('fontPair', v)} />
        <TweakRadio label="Density" value={t.density} options={['compact', 'regular', 'comfy']} onChange={(v) => setTweak('density', v)} />

        <TweakSection label="Region / compliance" />
        <TweakRadio label="Market" value={t.region} options={['US', 'EU']} onChange={(v) => setTweak('region', v)} />

        <TweakSection label="Flow variations" />
        <TweakRadio label="Empty state" value={t.emptyState} options={['hero', 'tasks']} onChange={(v) => setTweak('emptyState', v)} />
        <TweakRadio label="Setup" value={t.setupLayout} options={['checklist', 'focus']} onChange={(v) => setTweak('setupLayout', v)} />
        <TweakToggle label="Live readiness rail" value={t.showRail} onChange={(v) => setTweak('showRail', v)} />

        <TweakSection label="Presentation" />
        <TweakToggle label="Case study mode" value={t.caseStudy} onChange={(v) => setTweak('caseStudy', v)} />
        <TweakButton label="Local data" />
        <Button variant="outline" size="sm" icon="trash" onClick={clearLocalData}>Clear local draft</Button>
        <TweakButton label="Jump to a screen" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {[['dashboard','Dashboard'],['settings','Settings'],['invoicesHome','Invoices'],['estimatesHome','Estimates'],['recurringSetup','Recurring'],['expensesHome','Expenses'],['moneyHome','Money'],['clientsHome','Clients'],['setup','Setup'],['client','Client'],['build','Builder'],['check','Check'],['preview','Preview'],['send','Send'],['success','Success']].map(([id,label]) => (
            <button key={id} onClick={() => go(id)} style={{ padding: '7px 8px', fontSize: 12, borderRadius: 7, cursor: 'pointer',
              border: '1px solid var(--line-2)', background: screen === id ? 'var(--brand-soft)' : 'var(--surface)', color: screen === id ? 'var(--brand-strong)' : 'var(--ink-2)', fontWeight: 520 }}>{label}</button>
          ))}
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
