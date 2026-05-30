// ui.jsx — Andras UI primitives + icon set
// Exports to window at the bottom.
const { useState, useRef, useEffect } = React;

/* ----------------------------------------------------------
   ICONS — Hugeicons Stroke Rounded
---------------------------------------------------------- */
const HUGEICON_NAMES = {
  home: 'home-01',
  invoice: 'invoice-01',
  clients: 'user-group',
  money: 'dollar-01',
  settings: 'settings-01',
  plus: 'add-01',
  arrowRight: 'arrow-right-01',
  arrowLeft: 'arrow-left-01',
  check: 'checkmark-circle-01',
  checkSmall: 'tick-02',
  chevDown: 'arrow-down-01',
  chevRight: 'arrow-right-01',
  close: 'cancel-01',
  building: 'building-03',
  bank: 'bank',
  receipt: 'receipt-dollar',
  shield: 'shield-01',
  mail: 'mail-01',
  link: 'link-01',
  download: 'download-01',
  edit: 'edit-02',
  sparkle: 'sparkles',
  clock: 'clock-01',
  alert: 'alert-02',
  info: 'information-circle',
  doc: 'document-attachment',
  camera: 'camera-01',
  search: 'search-01',
  globe: 'globe-02',
  bolt: 'zap',
  upload: 'upload-01',
  copy: 'copy-01',
  trash: 'delete-01',
  dot: 'circle-small',
  star: 'star',
  recurring: 'repeat',
  wallet: 'wallet-01',
  filter: 'filter',
};

function Icon({ name, size = 20, style, className }) {
  const iconName = HUGEICON_NAMES[name];
  if (!iconName) return null;
  return (
    <i
      className={`hgi-stroke hgi-${iconName}${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: size,
        display: 'inline-grid',
        placeItems: 'center',
        lineHeight: 1,
        flex: 'none',
        ...style,
      }}
    />
  );
}

/* ----------------------------------------------------------
   LOGO
---------------------------------------------------------- */
function Logo({ size = 26, withWordmark = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="assets/andras-logo.png" alt="" width={size} height={size}
        style={{ width: size, height: size, display: 'block', objectFit: 'contain', flex: 'none' }} />
      {withWordmark && (
        <span style={{ fontSize: size * 0.72, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
          Andras
        </span>
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   BUTTON
---------------------------------------------------------- */
function Button({ children, variant = 'primary', size = 'md', icon, iconRight, full, onClick, disabled, style, type }) {
  const sizes = {
    sm: { h: 34, px: 12, fs: 13.5, gap: 7 },
    md: { h: 42, px: 17, fs: 14.5, gap: 8 },
    lg: { h: 50, px: 24, fs: 16, gap: 10 },
  }[size];
  const variants = {
    primary: { background: 'var(--brand)', color: 'var(--on-brand)', border: '1px solid transparent', boxShadow: 'var(--sh-2)' },
    strong:  { background: 'var(--ink)', color: 'var(--surface)', border: '1px solid transparent', boxShadow: 'var(--sh-2)' },
    ghost:   { background: 'transparent', color: 'var(--ink-2)', border: '1px solid transparent' },
    outline: { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line-2)', boxShadow: 'var(--sh-1)' },
    soft:    { background: 'var(--brand-soft)', color: 'var(--brand-strong)', border: '1px solid transparent' },
    danger:  { background: 'var(--bad-soft)', color: 'var(--bad)', border: '1px solid transparent' },
  }[variant];
  const [hover, setHover] = useState(false);
  return (
    <button type={type || 'button'} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        height: sizes.h, padding: `0 ${sizes.px}px`, fontSize: sizes.fs, fontWeight: 540,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: sizes.gap,
        borderRadius: 'var(--r-sm)', cursor: disabled ? 'not-allowed' : 'pointer',
        width: full ? '100%' : 'auto', opacity: disabled ? 0.5 : 1,
        transition: 'transform .12s ease, filter .15s ease, box-shadow .15s ease, background .15s ease',
        transform: hover && !disabled ? 'translateY(-1px)' : 'none',
        filter: hover && !disabled && (variant === 'primary' || variant === 'strong') ? 'brightness(1.06)' : 'none',
        letterSpacing: '-0.005em', whiteSpace: 'nowrap',
        ...variants, ...style,
        ...(hover && !disabled && variant === 'outline' ? { borderColor: 'var(--line-strong)', background: 'var(--surface-2)' } : {}),
        ...(hover && !disabled && variant === 'ghost' ? { background: 'var(--surface-3)', color: 'var(--ink)' } : {}),
        ...(hover && !disabled && variant === 'soft' ? { background: 'var(--brand-softer)' } : {}),
      }}>
      {icon && <Icon name={icon} size={sizes.fs + 3} stroke={1.9} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sizes.fs + 3} stroke={1.9} />}
    </button>
  );
}

function IconButton({ name, onClick, label, size = 38, active, style }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} aria-label={label} title={label}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: size, height: size, display: 'grid', placeItems: 'center',
        borderRadius: 'var(--r-sm)', cursor: 'pointer',
        border: '1px solid ' + (active ? 'var(--line-2)' : 'transparent'),
        background: active ? 'var(--surface-2)' : (hover ? 'var(--surface-3)' : 'transparent'),
        color: active ? 'var(--ink)' : 'var(--muted)', transition: 'all .14s ease', ...style,
      }}>
      <Icon name={name} size={size * 0.5} />
    </button>
  );
}

/* ----------------------------------------------------------
   BADGE / PILL
---------------------------------------------------------- */
function Badge({ children, tone = 'neutral', icon, size = 'md' }) {
  const tones = {
    neutral: { bg: 'var(--surface-3)', fg: 'var(--ink-2)' },
    brand:   { bg: 'var(--brand-soft)', fg: 'var(--brand-strong)' },
    indigo:  { bg: '#EEF2FF', fg: '#3730A3' },
    ok:      { bg: 'var(--ok-soft)', fg: 'var(--ok)' },
    warn:    { bg: 'var(--warn-soft)', fg: 'var(--warn-ink)' },
    bad:     { bg: 'var(--bad-soft)', fg: 'var(--bad)' },
  }[tone];
  const s = size === 'sm' ? { fs: 11, px: 7, h: 20, gap: 4 } : { fs: 12, px: 9, h: 24, gap: 5 };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: s.gap, height: s.h, padding: `0 ${s.px}px`,
      background: tones.bg, color: tones.fg, borderRadius: 'var(--r-pill)',
      fontSize: s.fs, fontWeight: 560, letterSpacing: '0.005em', lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      {icon && <Icon name={icon} size={s.fs + 2} stroke={2} />}
      {children}
    </span>
  );
}

/* ----------------------------------------------------------
   CARD
---------------------------------------------------------- */
function Card({ children, style, pad, hover, onClick, elevated }) {
  const [h, setH] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hover && setH(true)} onMouseLeave={() => hover && setH(false)}
      style={{
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)',
        boxShadow: elevated ? 'var(--sh-3)' : 'var(--sh-1)',
        padding: pad === false ? 0 : (pad || 'var(--d-pad)'),
        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...(h ? { transform: 'translateY(-2px)', boxShadow: 'var(--sh-3)', borderColor: 'var(--line-2)' } : {}),
        ...style,
      }}>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------
   FORM FIELDS
---------------------------------------------------------- */
function Field({ label, hint, children, required, optional, error, style }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 540, color: 'var(--ink-2)', letterSpacing: '-0.005em' }}>{label}</span>
          {required && <span style={{ color: 'var(--bad)', fontSize: 13 }}>*</span>}
          {optional && <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>optional</span>}
        </div>
      )}
      {children}
      {hint && !error && <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{hint}</span>}
      {error && <span style={{ fontSize: 12, color: 'var(--bad)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="alert" size={13} stroke={2} />{error}</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, prefix, suffix, mono, invalid, type, style, onFocus, onBlur }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 'var(--d-control)',
      background: 'var(--surface)', borderRadius: 'var(--r-sm)',
      border: '1px solid ' + (invalid ? 'var(--bad)' : focus ? 'var(--brand)' : 'var(--line-2)'),
      boxShadow: focus ? '0 0 0 3.5px var(--brand-ring)' : 'none',
      transition: 'border-color .14s ease, box-shadow .14s ease', overflow: 'hidden', ...style,
    }}>
      {prefix && <span style={{ paddingLeft: 12, color: 'var(--muted)', fontSize: 14, display: 'flex', alignItems: 'center' }}>{prefix}</span>}
      <input
        type={type || 'text'} value={value} placeholder={placeholder}
        onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={(e) => { setFocus(true); onFocus && onFocus(e); }}
        onBlur={(e) => { setFocus(false); onBlur && onBlur(e); }}
        className={mono ? 'num' : ''}
        style={{
          flex: 1, height: '100%', border: 'none', outline: 'none', background: 'transparent',
          padding: `0 ${prefix ? 8 : 13}px`, fontSize: 14.5, color: 'var(--ink)', minWidth: 0,
        }}
      />
      {suffix && <span style={{ paddingRight: 12, color: 'var(--muted)', fontSize: 13.5 }}>{suffix}</span>}
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea value={value} placeholder={placeholder} rows={rows}
      onChange={(e) => onChange && onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{
        background: 'var(--surface)', borderRadius: 'var(--r-sm)', resize: 'vertical',
        border: '1px solid ' + (focus ? 'var(--brand)' : 'var(--line-2)'),
        boxShadow: focus ? '0 0 0 3.5px var(--brand-ring)' : 'none',
        transition: 'border-color .14s ease, box-shadow .14s ease',
        padding: '11px 13px', fontSize: 14.5, color: 'var(--ink)', outline: 'none',
        lineHeight: 1.5, width: '100%', ...style,
      }} />
  );
}

function Select({ value, onChange, options, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative', ...style }}>
      <select value={value} onChange={(e) => onChange && onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', width: '100%', height: 'var(--d-control)',
          background: 'var(--surface)', borderRadius: 'var(--r-sm)',
          border: '1px solid ' + (focus ? 'var(--brand)' : 'var(--line-2)'),
          boxShadow: focus ? '0 0 0 3.5px var(--brand-ring)' : 'none',
          padding: '0 36px 0 13px', fontSize: 14.5, color: 'var(--ink)', outline: 'none', cursor: 'pointer',
          transition: 'border-color .14s ease, box-shadow .14s ease',
        }}>
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--muted)' }}>
        <Icon name="chevDown" size={17} />
      </span>
    </div>
  );
}

/* ----------------------------------------------------------
   TOGGLE / SWITCH
---------------------------------------------------------- */
function Switch({ on, onChange, size = 'md' }) {
  const w = size === 'sm' ? 36 : 44, h = size === 'sm' ? 21 : 25, k = h - 6;
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      style={{
        width: w, height: h, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
        background: on ? 'var(--brand)' : 'var(--line-strong)', transition: 'background .18s ease', padding: 0, flex: 'none',
      }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? w - k - 3 : 3, width: k, height: k, borderRadius: 999,
        background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .18s cubic-bezier(.3,1.4,.5,1)',
      }} />
    </button>
  );
}

/* ----------------------------------------------------------
   AVATAR / MONOGRAM
---------------------------------------------------------- */
function Monogram({ name, size = 38, tone }) {
  const initials = (name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const hues = [256, 162, 286, 26, 78, 200];
  const hue = tone ?? hues[(name || '').length % hues.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 'var(--r-sm)', flex: 'none',
      display: 'grid', placeItems: 'center', fontSize: size * 0.38, fontWeight: 600,
      background: `oklch(0.94 0.04 ${hue})`, color: `oklch(0.45 0.12 ${hue})`,
      letterSpacing: '0.01em',
    }}>{initials}</div>
  );
}

/* ----------------------------------------------------------
   READINESS RING (the signature meter)
---------------------------------------------------------- */
function ReadinessRing({ pct, size = 44, stroke = 4.5, showLabel = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = pct >= 100 ? 'var(--ok)' : pct >= 60 ? 'var(--brand)' : pct >= 30 ? 'var(--warn)' : 'var(--bad)';
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.3,1,.4,1), stroke .3s ease' }} />
      </svg>
      {showLabel && (
        <div className="num" style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: size * 0.26, fontWeight: 600, color: tone,
        }}>{pct}</div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   PROGRESS BAR
---------------------------------------------------------- */
function Meter({ pct, height = 8, tone }) {
  const color = tone || (pct >= 100 ? 'var(--ok)' : pct >= 60 ? 'var(--brand)' : pct >= 30 ? 'var(--warn)' : 'var(--bad)');
  return (
    <div style={{ height, background: 'var(--line)', borderRadius: 999, overflow: 'hidden', width: '100%' }}>
      <div style={{ width: pct + '%', height: '100%', background: color, borderRadius: 999, transition: 'width .6s cubic-bezier(.3,1,.4,1), background .3s ease' }} />
    </div>
  );
}

/* ----------------------------------------------------------
   TOOLTIP-ish callout used by case-study mode
---------------------------------------------------------- */
function Divider({ vertical, style }) {
  return <div style={vertical
    ? { width: 1, alignSelf: 'stretch', background: 'var(--line)', ...style }
    : { height: 1, width: '100%', background: 'var(--line)', ...style }} />;
}

Object.assign(window, {
  Icon, Logo, Button, IconButton, Badge, Card, Field, Input, Textarea, Select,
  Switch, Monogram, ReadinessRing, Meter, Divider,
});
