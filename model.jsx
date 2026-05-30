// model.jsx — Andras shared data model, formatting, and completeness logic
// Exports to window.

const REGIONS = {
  US: {
    label: 'United States',
    currency: 'USD', symbol: '$', code: 'USD',
    taxName: 'Sales Tax', taxIdName: 'EIN', taxIdPlaceholder: '12-3456789',
    bankFieldName: 'Routing & Account', defaultTaxRate: 0,
    legalLine: 'W-9 on file', countryOptions: ['United States', 'Canada'],
    defaultTerms: 'Net 30',
  },
  EU: {
    label: 'European Union',
    currency: 'EUR', symbol: '€', code: 'EUR',
    taxName: 'VAT', taxIdName: 'VAT ID', taxIdPlaceholder: 'DE123456789',
    bankFieldName: 'IBAN', defaultTaxRate: 21,
    legalLine: 'Reverse-charge eligible', countryOptions: ['Germany', 'Netherlands', 'France', 'Ireland', 'Spain'],
    defaultTerms: 'Net 14',
  },
  GE: {
    label: 'Georgia',
    currency: 'GEL', symbol: '₾', code: 'GEL',
    taxName: 'დღგ', taxIdName: 'საიდენტიფიკაციო კოდი', taxIdPlaceholder: '123456789',
    bankFieldName: 'IBAN', defaultTaxRate: 18,
    legalLine: 'Georgia VAT rules', countryOptions: ['Georgia'],
    defaultTerms: 'Net 15',
  },
};

const COUNTRY_DATA = 'AF|Afghanistan,AL|Albania,DZ|Algeria,AD|Andorra,AO|Angola,AG|Antigua and Barbuda,AR|Argentina,AM|Armenia,AU|Australia,AT|Austria,AZ|Azerbaijan,BS|Bahamas,BH|Bahrain,BD|Bangladesh,BB|Barbados,BY|Belarus,BE|Belgium,BZ|Belize,BJ|Benin,BT|Bhutan,BO|Bolivia,BA|Bosnia and Herzegovina,BW|Botswana,BR|Brazil,BN|Brunei,BG|Bulgaria,BF|Burkina Faso,BI|Burundi,CV|Cabo Verde,KH|Cambodia,CM|Cameroon,CA|Canada,CF|Central African Republic,TD|Chad,CL|Chile,CN|China,CO|Colombia,KM|Comoros,CG|Congo,CD|Congo (DRC),CR|Costa Rica,CI|Cote d Ivoire,HR|Croatia,CU|Cuba,CY|Cyprus,CZ|Czechia,DK|Denmark,DJ|Djibouti,DM|Dominica,DO|Dominican Republic,EC|Ecuador,EG|Egypt,SV|El Salvador,GQ|Equatorial Guinea,ER|Eritrea,EE|Estonia,SZ|Eswatini,ET|Ethiopia,FJ|Fiji,FI|Finland,FR|France,GA|Gabon,GM|Gambia,GE|Georgia,DE|Germany,GH|Ghana,GR|Greece,GD|Grenada,GT|Guatemala,GN|Guinea,GW|Guinea-Bissau,GY|Guyana,HT|Haiti,HN|Honduras,HU|Hungary,IS|Iceland,IN|India,ID|Indonesia,IR|Iran,IQ|Iraq,IE|Ireland,IL|Israel,IT|Italy,JM|Jamaica,JP|Japan,JO|Jordan,KZ|Kazakhstan,KE|Kenya,KI|Kiribati,KP|North Korea,KR|South Korea,KW|Kuwait,KG|Kyrgyzstan,LA|Laos,LV|Latvia,LB|Lebanon,LS|Lesotho,LR|Liberia,LY|Libya,LI|Liechtenstein,LT|Lithuania,LU|Luxembourg,MG|Madagascar,MW|Malawi,MY|Malaysia,MV|Maldives,ML|Mali,MT|Malta,MH|Marshall Islands,MR|Mauritania,MU|Mauritius,MX|Mexico,FM|Micronesia,MD|Moldova,MC|Monaco,MN|Mongolia,ME|Montenegro,MA|Morocco,MZ|Mozambique,MM|Myanmar,NA|Namibia,NR|Nauru,NP|Nepal,NL|Netherlands,NZ|New Zealand,NI|Nicaragua,NE|Niger,NG|Nigeria,MK|North Macedonia,NO|Norway,OM|Oman,PK|Pakistan,PW|Palau,PS|Palestine,PA|Panama,PG|Papua New Guinea,PY|Paraguay,PE|Peru,PH|Philippines,PL|Poland,PT|Portugal,QA|Qatar,RO|Romania,RU|Russia,RW|Rwanda,KN|Saint Kitts and Nevis,LC|Saint Lucia,VC|Saint Vincent and the Grenadines,WS|Samoa,SM|San Marino,ST|Sao Tome and Principe,SA|Saudi Arabia,SN|Senegal,RS|Serbia,SC|Seychelles,SL|Sierra Leone,SG|Singapore,SK|Slovakia,SI|Slovenia,SB|Solomon Islands,SO|Somalia,ZA|South Africa,SS|South Sudan,ES|Spain,LK|Sri Lanka,SD|Sudan,SR|Suriname,SE|Sweden,CH|Switzerland,SY|Syria,TW|Taiwan,TJ|Tajikistan,TZ|Tanzania,TH|Thailand,TL|Timor-Leste,TG|Togo,TO|Tonga,TT|Trinidad and Tobago,TN|Tunisia,TR|Turkey,TM|Turkmenistan,TV|Tuvalu,UG|Uganda,UA|Ukraine,AE|United Arab Emirates,GB|United Kingdom,US|United States,UY|Uruguay,UZ|Uzbekistan,VU|Vanuatu,VA|Vatican City,VE|Venezuela,VN|Vietnam,YE|Yemen,ZM|Zambia,ZW|Zimbabwe';
const FALLBACK_COUNTRIES = COUNTRY_DATA.split(',').map((entry) => {
  const [code, name] = entry.split('|');
  return { code, name };
});

const COUNTRY_RECORDS = (() => {
  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    const regions = Intl.supportedValuesOf ? Intl.supportedValuesOf('region') : [];
    const countries = regions
      .map((code) => ({ code, name: names.of(code) || code }))
      .filter((country) => country.name && /^[A-Z]{2}$/.test(country.code))
      .sort((a, b) => a.name.localeCompare(b.name));
    return countries.length > 100 ? countries : FALLBACK_COUNTRIES;
  } catch (error) {
    return FALLBACK_COUNTRIES;
  }
})();

const ALL_COUNTRY_OPTIONS = COUNTRY_RECORDS.map((country) => ({ value: country.name, label: country.name }));
const DEFAULT_COUNTRY_BY_REGION = { US: 'United States', EU: 'Germany', GE: 'Georgia' };

const CURRENCY_RECORDS = [
  { code: 'USD', name: 'US dollar', symbol: '$', countryCode: 'US' },
  { code: 'EUR', name: 'Euro', symbol: '€', countryCode: 'EU' },
  { code: 'GBP', name: 'British pound', symbol: '£', countryCode: 'GB' },
  { code: 'CAD', name: 'Canadian dollar', symbol: 'C$', countryCode: 'CA' },
  { code: 'AUD', name: 'Australian dollar', symbol: 'A$', countryCode: 'AU' },
  { code: 'NZD', name: 'New Zealand dollar', symbol: 'NZ$', countryCode: 'NZ' },
  { code: 'CHF', name: 'Swiss franc', symbol: 'CHF', countryCode: 'CH' },
  { code: 'JPY', name: 'Japanese yen', symbol: '¥', countryCode: 'JP' },
  { code: 'CNY', name: 'Chinese yuan', symbol: '¥', countryCode: 'CN' },
  { code: 'INR', name: 'Indian rupee', symbol: '₹', countryCode: 'IN' },
  { code: 'BRL', name: 'Brazilian real', symbol: 'R$', countryCode: 'BR' },
  { code: 'MXN', name: 'Mexican peso', symbol: 'MX$', countryCode: 'MX' },
  { code: 'GEL', name: 'Georgian lari', symbol: '₾', countryCode: 'GE' },
  { code: 'TRY', name: 'Turkish lira', symbol: '₺', countryCode: 'TR' },
  { code: 'AED', name: 'UAE dirham', symbol: 'د.إ', countryCode: 'AE' },
  { code: 'SGD', name: 'Singapore dollar', symbol: 'S$', countryCode: 'SG' },
  { code: 'SEK', name: 'Swedish krona', symbol: 'kr', countryCode: 'SE' },
  { code: 'NOK', name: 'Norwegian krone', symbol: 'kr', countryCode: 'NO' },
  { code: 'DKK', name: 'Danish krone', symbol: 'kr', countryCode: 'DK' },
  { code: 'PLN', name: 'Polish zloty', symbol: 'zł', countryCode: 'PL' },
  { code: 'CZK', name: 'Czech koruna', symbol: 'Kč', countryCode: 'CZ' },
  { code: 'ZAR', name: 'South African rand', symbol: 'R', countryCode: 'ZA' },
];
const CURRENCY_OPTIONS = CURRENCY_RECORDS.map((currency) => ({ value: currency.code, label: `${currency.code} · ${currency.name}` }));
const DEFAULT_CURRENCY_BY_COUNTRY = {
  US: 'USD', CA: 'CAD', GB: 'GBP', IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR',
  BE: 'EUR', PT: 'EUR', AT: 'EUR', FI: 'EUR', GE: 'GEL', AU: 'AUD', NZ: 'NZD', CH: 'CHF', JP: 'JPY',
  CN: 'CNY', IN: 'INR', BR: 'BRL', MX: 'MXN', TR: 'TRY', AE: 'AED', SG: 'SGD', SE: 'SEK', NO: 'NOK',
  DK: 'DKK', PL: 'PLN', CZ: 'CZK', ZA: 'ZAR',
};
const INVOICE_ACCENTS = [
  { id: 'forest', name: 'Forest', hex: '#384D48' },
  { id: 'moss', name: 'Moss', hex: '#679436' },
  { id: 'teal', name: 'Teal', hex: '#587B7F' },
  { id: 'ink', name: 'Ink', hex: '#1F2041' },
  { id: 'clay', name: 'Clay', hex: '#B86B4B' },
];
const INVOICE_COPY = {
  en: {
    label: 'English',
    invoiceTitle: 'Invoice',
    billedTo: 'Billed to',
    issued: 'Issued',
    due: 'Due',
    terms: 'Terms',
    currency: 'Currency',
    description: 'Description',
    qty: 'Qty',
    price: 'Price',
    unitPrice: 'Unit price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    totalDue: 'Total due',
    paymentDetails: 'Payment details',
    payTo: 'Pay to',
    acceptedMethods: 'Accepted methods',
    notes: 'Notes',
    generatedBy: 'Generated by Andras',
    yourBusiness: 'Your business',
    businessAddress: 'Business address',
    clientName: 'Client name',
    clientDetails: 'Client details',
    noLineItems: 'No line items yet',
    noLineItemsAction: 'No line items yet - click to add them',
    notApplicable: 'Not applicable',
    bankTransfer: 'Bank transfer',
    paymentInstructions: 'Payment instructions included',
    payOnline: 'Pay online',
    yourAccount: 'your account',
    defaultNotes: 'Thank you for your business. Please reference the invoice number with your payment.',
  },
  ka: {
    label: 'ქართული',
    invoiceTitle: 'ანგარიშ-ფაქტურა',
    billedTo: 'მიმღები',
    issued: 'გამოწერის თარიღი',
    due: 'გადახდის ვადა',
    terms: 'პირობები',
    currency: 'ვალუტა',
    description: 'აღწერა',
    qty: 'რაოდ.',
    price: 'ფასი',
    unitPrice: 'ერთეულის ფასი',
    amount: 'თანხა',
    subtotal: 'შუალედური ჯამი',
    totalDue: 'გადასახდელი თანხა',
    paymentDetails: 'გადახდის დეტალები',
    payTo: 'გადახდა',
    acceptedMethods: 'გადახდის მეთოდები',
    notes: 'შენიშვნები',
    generatedBy: 'გენერირებულია Andras-ით',
    yourBusiness: 'თქვენი ბიზნესი',
    businessAddress: 'ბიზნესის მისამართი',
    clientName: 'კლიენტის სახელი',
    clientDetails: 'კლიენტის დეტალები',
    noLineItems: 'ჯერ არ არის სერვისები',
    noLineItemsAction: 'ჯერ არ არის სერვისები - დააჭირეთ დასამატებლად',
    notApplicable: 'არ გამოიყენება',
    bankTransfer: 'საბანკო გადარიცხვა',
    paymentInstructions: 'გადახდის ინსტრუქცია დამატებულია',
    payOnline: 'ონლაინ გადახდა',
    yourAccount: 'თქვენი ანგარიში',
    defaultNotes: 'გმადლობთ თანამშრომლობისთვის. გადახდისას მიუთითეთ ინვოისის ნომერი.',
  },
};
const IBAN_COUNTRY_CODES = new Set('AD AE AL AT AZ BA BE BG BH BR CH CR CY CZ DE DK DO EE EG ES FI FO FR GB GE GI GL GR GT HR HU IE IL IQ IS IT JO KW KZ LB LC LI LT LU LV MC MD ME MK MR MT MU NL NO PK PL PS PT QA RO RS SA SC SE SI SK SM ST SV TL TN TR UA VA VG XK'.split(' '));
const SEPA_COUNTRY_CODES = new Set('AD AT BE BG CH CY CZ DE DK EE ES FI FR GB GI GR HR HU IE IS IT LI LT LU LV MC MT NL NO PL PT RO SE SI SK SM VA'.split(' '));

function defaultCountryForRegion(region) {
  return DEFAULT_COUNTRY_BY_REGION[region] || 'United States';
}

function countryRecordFromName(countryName) {
  return COUNTRY_RECORDS.find((country) => country.name === countryName)
    || COUNTRY_RECORDS.find((country) => country.name.toLowerCase() === String(countryName || '').toLowerCase())
    || COUNTRY_RECORDS.find((country) => country.code === String(countryName || '').toUpperCase())
    || { code: String(countryName || 'XX').slice(0, 2).toUpperCase(), name: countryName || 'Unknown' };
}

function invoicePrefixForCountry(countryName) {
  return countryRecordFromName(countryName).code;
}

function currencyRecord(code) {
  return CURRENCY_RECORDS.find((currency) => currency.code === code) || CURRENCY_RECORDS[0];
}

function invoiceAccentRecord(id) {
  return INVOICE_ACCENTS.find((accent) => accent.id === id) || INVOICE_ACCENTS[0];
}

function defaultInvoiceLanguage(region) {
  return region === 'GE' ? 'ka' : 'en';
}

function invoiceLanguage(invoice, region) {
  const language = invoice && invoice.language;
  return INVOICE_COPY[language] ? language : defaultInvoiceLanguage(region);
}

function invoiceCopy(invoice, region) {
  return INVOICE_COPY[invoiceLanguage(invoice, region)] || INVOICE_COPY.en;
}

function invoiceTermsLabel(terms, invoice, region) {
  if (invoiceLanguage(invoice, region) !== 'ka') return terms || '-';
  if (terms === 'Due on receipt') return 'გადახდა მიღებისთანავე';
  const days = parseInt(String(terms || '').replace(/\D/g, ''), 10);
  return days ? `${days} დღე` : (terms || '-');
}

function defaultCurrencyForCountry(countryName, region) {
  const countryCode = invoicePrefixForCountry(countryName || defaultCountryForRegion(region));
  return DEFAULT_CURRENCY_BY_COUNTRY[countryCode] || (REGIONS[region] || REGIONS.US).code;
}

function paymentRailForCountry(countryName, region) {
  const country = countryRecordFromName(countryName || defaultCountryForRegion(region));
  const code = country.code;
  if (code === 'US') {
    return {
      label: 'Routing & account',
      placeholder: '021000021 · 1234567890',
      methods: ['Card', 'ACH', 'Apple Pay', 'PayPal'],
      helper: 'Encrypted and shown only to clients you invoice.',
    };
  }
  if (code === 'GB') {
    return {
      label: 'Sort code & account',
      placeholder: '04-00-04 · 12345678',
      methods: ['Card', 'Bank transfer', 'Apple Pay', 'PayPal'],
      helper: 'Encrypted and shown only to clients you invoice.',
    };
  }
  if (code === 'CA') {
    return {
      label: 'Transit, institution & account',
      placeholder: '12345 · 001 · 1234567',
      methods: ['Card', 'Interac', 'Apple Pay', 'PayPal'],
      helper: 'Encrypted and shown only to clients you invoice.',
    };
  }
  if (code === 'AU') {
    return {
      label: 'BSB & account',
      placeholder: '062-000 · 12345678',
      methods: ['Card', 'Bank transfer', 'Apple Pay', 'PayPal'],
      helper: 'Encrypted and shown only to clients you invoice.',
    };
  }
  if (IBAN_COUNTRY_CODES.has(code)) {
    return {
      label: 'IBAN',
      placeholder: `${code}00 0000 0000 0000 0000 00`,
      methods: ['Card', SEPA_COUNTRY_CODES.has(code) ? 'SEPA transfer' : 'Bank transfer', 'Apple Pay', 'PayPal'],
      helper: 'Encrypted and shown only to clients you invoice.',
    };
  }
  return {
    label: 'Bank account',
    placeholder: 'Bank name · account number',
    methods: ['Card', 'Bank transfer', 'Apple Pay', 'PayPal'],
    helper: 'Encrypted and shown only to clients you invoice.',
  };
}

function flagUrlForCountryCode(countryCode) {
  const code = String(countryCode || 'US').toLowerCase();
  return `https://cdn.jsdelivr.net/gh/HatScripts/circle-flags/flags/${code}.svg`;
}

function invoiceSequenceFromNumber(number) {
  const match = String(number || '').match(/(\d+)$/);
  return match ? match[1] : '0001';
}

function invoiceYearFromNumber(number) {
  const match = String(number || '').match(/(?:^|-)((?:19|20)\d{2})(?:-|$)/);
  return match ? match[1] : String(new Date().getFullYear());
}

function invoiceNumberForCountry(number, countryName) {
  const year = invoiceYearFromNumber(number);
  const sequence = invoiceSequenceFromNumber(number).padStart(4, '0');
  return `INV-${year}-${sequence}`;
}

function normalizeInvoiceNumberInput(input, countryName) {
  const clean = String(input || '').toUpperCase().replace(/\s/g, '');
  return /^\d+$/.test(clean) ? invoiceNumberForCountry(clean, countryName) : clean;
}

function invoiceNumberDetails(number, countryName) {
  const year = invoiceYearFromNumber(number);
  const match = String(number || '').trim().match(/^INV-((?:19|20)\d{2})-(\d{3,})$/i);
  const matchesStandard = !!match && Number(match[2]) > 0;
  return {
    expectedPrefix: 'INV',
    expectedFormat: `INV-${year}-0001`,
    year: match ? match[1] : year,
    sequence: invoiceSequenceFromNumber(number).padStart(4, '0'),
    prefix: match ? 'INV' : '',
    hasCountryPrefix: false,
    hasStandardPrefix: !!match,
    matchesStandard,
    matchesCountry: matchesStandard,
  };
}

function nextInvoiceNumber(number, countryName) {
  const next = Number(invoiceSequenceFromNumber(number)) + 1;
  return invoiceNumberForCountry(String(next).padStart(4, '0'), countryName);
}

function dueDateForTerms(terms, issueDate = '2026-05-30') {
  const days = terms === 'Due on receipt' ? 0 : parseInt(String(terms || '').replace(/\D/g, ''), 10) || 0;
  const due = new Date(issueDate);
  due.setDate(due.getDate() + days);
  return due.toISOString().slice(0, 10);
}

function fmtMoney(amount, region, opts = {}) {
  const r = REGIONS[region] || REGIONS.US;
  const currency = opts.currency ? currencyRecord(opts.currency) : null;
  const n = Number(amount || 0);
  const s = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (opts.noSymbol) return s;
  if (opts.pdfSafe && currency) return `${currency.code} ${s}`;
  return (currency ? currency.symbol : r.symbol) + s;
}

function lineTotal(item) {
  return (Number(item.qty) || 0) * (Number(item.price) || 0);
}

function computeTotals(invoice, region) {
  const items = invoice.items || [];
  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const tax = items.reduce((s, i) => s + lineTotal(i) * (Number(i.vat) || 0) / 100, 0);
  return { subtotal, tax, total: subtotal + tax };
}

// The single source of truth for "what's missing".
// Each check: { id, label, detail, ok, severity:'block'|'warn', step }
function computeChecks(store, region) {
  const b = store.business, c = store.client, inv = store.invoice;
  const r = REGIONS[region] || REGIONS.US;
  const paymentRail = paymentRailForCountry(b.country, region);
  const items = inv.items || [];
  const hasRealItem = items.some((i) => i.desc && (Number(i.qty) || 0) > 0 && (Number(i.price) || 0) > 0);
  const numberInfo = invoiceNumberDetails(inv.number, b.country || defaultCountryForRegion(region));
  const checks = [
    { id: 'biz', label: 'Business name & address', detail: 'Shown on the invoice header', ok: !!(b.name && b.address), severity: 'block', step: 'setup' },
    { id: 'tax', label: `${r.taxIdName} / tax status`, detail: b.taxRegistered ? `Registered — ${r.taxName} will be applied` : 'Marked not registered', ok: !!(b.taxRegistered === false || b.taxId), severity: 'warn', step: 'setup' },
    { id: 'bank', label: `Payment details (${paymentRail.label})`, detail: 'So the client knows where to pay', ok: !!(b.accountName && b.iban), severity: 'block', step: 'setup' },
    { id: 'client', label: 'Client & email', detail: c ? `${c.name} · ${c.email}` : 'No client selected', ok: !!(c && c.email), severity: 'block', step: 'client' },
    { id: 'items', label: 'At least one line item', detail: hasRealItem ? `${items.filter(i=>i.desc).length} item(s)` : 'Add a description, qty and price', ok: hasRealItem, severity: 'block', step: 'build' },
    { id: 'number', label: 'Sequential invoice number', detail: inv.number ? `#${inv.number} · expected ${numberInfo.expectedFormat} style` : 'Auto-generated', ok: numberInfo.matchesStandard && !store.numberClash, severity: 'block', step: 'build' },
    { id: 'due', label: 'Due date & terms', detail: inv.terms || '—', ok: !!inv.terms, severity: 'warn', step: 'build' },
  ];
  return checks;
}

function readiness(store, region) {
  const checks = computeChecks(store, region);
  const done = checks.filter((c) => c.ok).length;
  return Math.round((done / checks.length) * 100);
}

function canSend(store, region) {
  return computeChecks(store, region).filter((c) => c.severity === 'block' && !c.ok).length === 0;
}

// Seed data
function freshInvoice(region, countryName) {
  const r = REGIONS[region] || REGIONS.US;
  const country = countryName || defaultCountryForRegion(region);
  const currency = defaultCurrencyForCountry(country, region);
  const language = defaultInvoiceLanguage(region);
  return {
    number: invoiceNumberForCountry('0001', country),
    issueDate: '2026-05-30',
    dueDate: dueDateForTerms(r.defaultTerms),
    currency,
    terms: r.defaultTerms,
    language,
    items: [{ desc: '', qty: 1, price: '', vat: r.defaultTaxRate }],
    accent: 'forest',
    notes: INVOICE_COPY[language].defaultNotes,
    paymentLink: true,
    emailSubject: '',
    emailBody: '',
  };
}

const SUGGESTED_CLIENTS = [];

Object.assign(window, {
  REGIONS, fmtMoney, lineTotal, computeTotals, computeChecks, readiness, canSend,
  freshInvoice, SUGGESTED_CLIENTS, COUNTRY_RECORDS, ALL_COUNTRY_OPTIONS,
  CURRENCY_RECORDS, CURRENCY_OPTIONS, currencyRecord, INVOICE_ACCENTS, invoiceAccentRecord, INVOICE_COPY, defaultInvoiceLanguage, invoiceLanguage, invoiceCopy, invoiceTermsLabel, defaultCurrencyForCountry, paymentRailForCountry, flagUrlForCountryCode,
  defaultCountryForRegion, countryRecordFromName, invoicePrefixForCountry,
  invoiceSequenceFromNumber, invoiceYearFromNumber, invoiceNumberForCountry, normalizeInvoiceNumberInput, invoiceNumberDetails, nextInvoiceNumber, dueDateForTerms,
});
