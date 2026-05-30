// screens-b.jsx — Invoice Builder, Completeness Check, Preview, Send, Success
const { useState: useStateB } = React;

/* ============================================================
   Real PDF export (dependency-free, single-page invoice PDF)
============================================================ */
function pdfEscape(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '-');
}

function htmlEscape(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const GEORGIAN_FONT_STACK = "'SF Georgian','Noto Sans Georgian','Poppins',Arial,sans-serif";
const LATIN_INVOICE_FONT_STACK = "'Poppins',Arial,sans-serif";

function invoiceFontStack(lang) {
  return lang === 'ka' ? GEORGIAN_FONT_STACK : LATIN_INVOICE_FONT_STACK;
}

function rgbForPdf(name, fallback) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const hex = value.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hex) return [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)].map((n) => (n / 255).toFixed(3));
  const rgb = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])].map((n) => (n / 255).toFixed(3));
  return [56, 77, 72].map((n) => (n / 255).toFixed(3));
}

function pdfRgbFromHex(hex, fallback = '#384D48') {
  const value = String(hex || fallback).match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!value) return rgbForPdf('--brand', fallback);
  return [parseInt(value[1], 16), parseInt(value[2], 16), parseInt(value[3], 16)].map((n) => (n / 255).toFixed(3));
}

function wrapPdfText(text, maxChars) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function pdfJpegFromDataUrl(dataUrl) {
  if (!String(dataUrl || '').startsWith('data:image/jpeg;base64,')) return null;
  const binary = atob(dataUrl.split(',')[1] || '');
  let width = 0;
  let height = 0;
  for (let i = 2; i < binary.length - 9;) {
    if (binary.charCodeAt(i) !== 0xff) { i += 1; continue; }
    const marker = binary.charCodeAt(i + 1);
    const length = (binary.charCodeAt(i + 2) << 8) + binary.charCodeAt(i + 3);
    if (marker >= 0xc0 && marker <= 0xc3) {
      height = (binary.charCodeAt(i + 5) << 8) + binary.charCodeAt(i + 6);
      width = (binary.charCodeAt(i + 7) << 8) + binary.charCodeAt(i + 8);
      break;
    }
    i += 2 + Math.max(length, 2);
  }
  return width && height ? { binary, width, height } : null;
}

function invoicePdfFileName(store) {
  const inv = (store && store.invoice) || {};
  return `Invoice-${String(inv.number || 'draft').replace(/[^\w-]/g, '')}.pdf`;
}

function buildInvoiceHtmlElement(store, region) {
  const r = REGIONS[region] || REGIONS.US;
  const inv = store.invoice || freshInvoice(region);
  const copy = invoiceCopy(inv, region);
  const lang = invoiceLanguage(inv, region);
  const b = store.business || {};
  const c = store.client || {};
  const accent = invoiceAccentRecord(inv.accent);
  const totals = computeTotals(inv, region);
  const items = (inv.items || []).filter((item) => item.desc);
  const taxRegistered = b.taxRegistered === true;
  const paymentRail = paymentRailForCountry(b.country, region);
  const methods = (b.methods || []).join(' / ');
  const logo = b.logoData
    ? `<img src="${b.logoData}" alt="" style="max-width:62px;max-height:48px;object-fit:contain;display:block;" />`
    : `<div style="width:42px;height:42px;border-radius:14px;background:${accent.hex};color:#fff;display:grid;place-items:center;font-size:18px;font-weight:700;">${htmlEscape((b.name || 'A')[0].toUpperCase())}</div>`;
  const itemRows = items.length ? items.map((item) => {
    const desc = taxRegistered && Number(item.vat) > 0 ? `${item.desc} - ${r.taxName} ${item.vat}%` : item.desc;
    return `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #E1E8D5;vertical-align:top;">
          <div style="font-weight:500;color:#1E2019;">${htmlEscape(desc)}</div>
        </td>
        <td style="padding:16px 0;border-bottom:1px solid #E1E8D5;vertical-align:top;text-align:right;color:#394032;">${htmlEscape(item.qty || 0)}</td>
        <td style="padding:16px 0;border-bottom:1px solid #E1E8D5;vertical-align:top;text-align:right;color:#394032;">${htmlEscape(fmtMoney(item.price, region, { currency: inv.currency }))}</td>
        <td style="padding:16px 0;border-bottom:1px solid #E1E8D5;vertical-align:top;text-align:right;font-weight:600;color:#1E2019;">${htmlEscape(fmtMoney(lineTotal(item), region, { currency: inv.currency }))}</td>
      </tr>`;
  }).join('') : `
      <tr>
        <td colspan="4" style="padding:28px 0;border-bottom:1px solid #E1E8D5;text-align:center;color:#9AA18D;">${htmlEscape(copy.noLineItems)}</td>
      </tr>`;

  const node = document.createElement('div');
  node.style.cssText = 'width:794px;min-height:1123px;background:#fff;pointer-events:none;';
  node.innerHTML = `
    <section lang="${htmlEscape(lang)}" style="width:794px;min-height:1123px;background:#fff;color:#1E2019;font-family:${invoiceFontStack(lang)};padding:0;box-sizing:border-box;">
      <div style="height:10px;background:${accent.hex};"></div>
      <div style="padding:58px 64px 44px;box-sizing:border-box;">
        <header style="display:flex;align-items:flex-start;justify-content:space-between;gap:32px;margin-bottom:46px;">
          <div style="display:flex;align-items:center;gap:16px;min-width:0;">
            ${logo}
            <div>
              <div style="font-size:15px;font-weight:600;letter-spacing:-.01em;color:#1E2019;">${htmlEscape(b.name || copy.yourBusiness)}</div>
              <div style="font-size:11px;line-height:1.45;color:#69705F;margin-top:4px;max-width:250px;">${htmlEscape(b.address || copy.businessAddress)}</div>
            </div>
          </div>
          <div style="text-align:right;min-width:180px;">
            <div style="font-size:36px;line-height:1.15;font-weight:650;letter-spacing:-.03em;color:#1E2019;">${htmlEscape(copy.invoiceTitle)}</div>
            <div style="margin-top:12px;font-size:12px;font-weight:600;color:${accent.hex};letter-spacing:.08em;text-transform:uppercase;">#${htmlEscape(inv.number || 'draft')}</div>
          </div>
        </header>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:34px;margin-bottom:40px;">
          <div style="border-top:1px solid #D0DBC2;padding-top:18px;">
            <div style="font-size:10px;font-weight:700;color:#69705F;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px;">${htmlEscape(copy.billedTo)}</div>
            <div style="font-size:17px;font-weight:600;letter-spacing:-.01em;">${htmlEscape(c.name || copy.clientName)}</div>
            <div style="font-size:12px;line-height:1.65;color:#69705F;margin-top:6px;">
              ${htmlEscape([c.company, c.email, c.address].filter(Boolean).join(' • ') || copy.clientDetails)}
            </div>
          </div>
          <div style="border-top:1px solid #D0DBC2;padding-top:18px;">
            <div style="display:grid;grid-template-columns:1fr auto;gap:9px;font-size:12px;color:#69705F;">
              <span>${htmlEscape(copy.issued)}</span><strong style="color:#1E2019;font-weight:500;">${htmlEscape(inv.issueDate || '-')}</strong>
              <span>${htmlEscape(copy.due)}</span><strong style="color:#1E2019;font-weight:600;">${htmlEscape(inv.dueDate || '-')}</strong>
              <span>${htmlEscape(copy.terms)}</span><strong style="color:#1E2019;font-weight:500;">${htmlEscape(invoiceTermsLabel(inv.terms, inv, region))}</strong>
              <span>${htmlEscape(copy.currency)}</span><strong style="color:#1E2019;font-weight:500;">${htmlEscape(inv.currency || r.code)}</strong>
            </div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:12px;">
          <thead>
            <tr>
              <th style="text-align:left;padding:0 0 12px;border-bottom:2px solid #1E2019;font-size:10px;color:#69705F;letter-spacing:.13em;text-transform:uppercase;">${htmlEscape(copy.description)}</th>
              <th style="text-align:right;padding:0 0 12px;border-bottom:2px solid #1E2019;font-size:10px;color:#69705F;letter-spacing:.13em;text-transform:uppercase;width:58px;">${htmlEscape(copy.qty)}</th>
              <th style="text-align:right;padding:0 0 12px;border-bottom:2px solid #1E2019;font-size:10px;color:#69705F;letter-spacing:.13em;text-transform:uppercase;width:112px;">${htmlEscape(copy.price)}</th>
              <th style="text-align:right;padding:0 0 12px;border-bottom:2px solid #1E2019;font-size:10px;color:#69705F;letter-spacing:.13em;text-transform:uppercase;width:120px;">${htmlEscape(copy.amount)}</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;margin-bottom:36px;">
            <div style="width:270px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;color:#69705F;margin-bottom:10px;">
              <span>${htmlEscape(copy.subtotal)}</span><span style="color:#1E2019;font-weight:500;">${htmlEscape(fmtMoney(totals.subtotal, region, { currency: inv.currency }))}</span>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:12px;color:#69705F;margin-bottom:14px;">
              <span>${htmlEscape(r.taxName)}</span><span style="color:#1E2019;font-weight:500;">${htmlEscape(taxRegistered ? fmtMoney(totals.tax, region, { currency: inv.currency }) : copy.notApplicable)}</span>
            </div>
            <div style="height:1px;background:#D0DBC2;margin-bottom:16px;"></div>
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:18px;">
              <span style="font-size:14px;font-weight:600;color:#1E2019;">${htmlEscape(copy.totalDue)}</span>
              <span style="font-size:24px;font-weight:700;letter-spacing:-.025em;color:${accent.hex};">${htmlEscape(fmtMoney(totals.total, region, { currency: inv.currency }))}</span>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:18px;margin-top:24px;">
          <div style="background:#F3F6EB;border:1px solid #E1E8D5;border-radius:18px;padding:22px 24px;">
            <div style="font-size:10px;font-weight:700;color:${accent.hex};letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">${htmlEscape(copy.paymentDetails)}</div>
            <div style="font-size:14px;font-weight:600;color:#1E2019;">${htmlEscape(copy.payTo)} ${htmlEscape(b.accountName || b.name || copy.yourAccount)}</div>
            <div style="font-size:12px;line-height:1.55;color:#69705F;margin-top:8px;">${htmlEscape(paymentRail.label)}: ${htmlEscape(b.iban || '-')}</div>
            ${taxRegistered ? `<div style="font-size:12px;color:#69705F;margin-top:3px;">${htmlEscape(r.taxIdName)}: ${htmlEscape(b.taxId || '-')}</div>` : ''}
          </div>
          <div style="background:#fff;border:1px solid #E1E8D5;border-radius:18px;padding:22px 24px;">
            <div style="font-size:10px;font-weight:700;color:#69705F;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px;">${htmlEscape(copy.acceptedMethods)}</div>
            <div style="font-size:13px;line-height:1.55;color:#394032;">${htmlEscape(methods || copy.bankTransfer)}</div>
            ${inv.paymentLink ? `<div style="margin-top:12px;font-size:11px;font-weight:600;color:${accent.hex};">${htmlEscape(copy.paymentInstructions)}</div>` : ''}
          </div>
        </div>

        ${inv.notes ? `
          <div style="margin-top:28px;border-top:1px solid #E1E8D5;padding-top:18px;">
            <div style="font-size:10px;font-weight:700;color:#69705F;letter-spacing:.14em;text-transform:uppercase;margin-bottom:8px;">${htmlEscape(copy.notes)}</div>
            <div style="font-size:12px;line-height:1.65;color:#394032;">${htmlEscape(inv.notes)}</div>
          </div>` : ''}

        <footer style="display:flex;justify-content:space-between;align-items:center;margin-top:46px;padding-top:16px;border-top:1px solid #E1E8D5;font-size:10.5px;color:#69705F;">
          <span>${htmlEscape(copy.generatedBy)}</span>
          <span>${htmlEscape(r.code)} · ${htmlEscape(inv.currency || r.code)}</span>
        </footer>
      </div>
    </section>`;
  return node;
}

function createInvoiceCaptureLayer(node) {
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    'width:794px',
    'height:1123px',
    'overflow:hidden',
    'background:#fff',
    'pointer-events:none',
    'z-index:2147483647',
    'box-shadow:none',
  ].join(';');
  layer.appendChild(node);
  document.body.appendChild(layer);
  return layer;
}

function promiseTimeout(ms, message) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

function buildInvoicePdfPayload(store, region) {
  const pageW = 595.28, pageH = 841.89;
  const margin = 48;
  const brand = rgbForPdf('--brand', '#384D48');
  const ink = rgbForPdf('--ink', '#1E2019');
  const muted = rgbForPdf('--muted', '#69705F');
  const line = rgbForPdf('--line-2', '#D0DBC2');
  const surface = rgbForPdf('--surface-2', '#F3F6EB');
  const r = REGIONS[region] || REGIONS.US;
  const inv = store.invoice || freshInvoice(region);
  const accent = invoiceAccentRecord(inv.accent);
  const invoiceBrand = pdfRgbFromHex(accent.hex);
  const b = store.business || {};
  const c = store.client || {};
  const totals = computeTotals(inv, region);
  const items = (inv.items || []).filter((item) => item.desc);
  const taxRegistered = b.taxRegistered === true;
  const paymentRail = paymentRailForCountry(b.country, region);
  const logoImage = pdfJpegFromDataUrl(b.logoPdfData);
  const commands = [];
  const yPdf = (y) => pageH - y;

  const color = (rgb) => commands.push(`${rgb.join(' ')} rg`);
  const stroke = (rgb) => commands.push(`${rgb.join(' ')} RG`);
  const rect = (x, y, w, h, rgb) => { color(rgb); commands.push(`${x} ${yPdf(y + h)} ${w} ${h} re f`); };
  const image = (name, x, y, w, h) => commands.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${x.toFixed(2)} ${yPdf(y + h).toFixed(2)} cm /${name} Do Q`);
  const lineTo = (x1, y1, x2, y2, rgb) => { stroke(rgb); commands.push(`0.75 w ${x1} ${yPdf(y1)} m ${x2} ${yPdf(y2)} l S`); };
  const text = (value, x, y, size = 11, font = 'F1', rgb = ink, align = 'left') => {
    const approx = pdfEscape(value).length * size * 0.5;
    const tx = align === 'right' ? x - approx : x;
    color(rgb);
    commands.push(`BT /${font} ${size} Tf 1 0 0 1 ${tx.toFixed(2)} ${yPdf(y).toFixed(2)} Tm (${pdfEscape(value)}) Tj ET`);
  };
  const wrappedText = (value, x, y, maxChars, size = 10, font = 'F1', rgb = muted, lineH = 13) => {
    wrapPdfText(value, maxChars).forEach((ln, i) => text(ln, x, y + (i * lineH), size, font, rgb));
    return y + (wrapPdfText(value, maxChars).length * lineH);
  };

  rect(0, 0, pageW, 8, invoiceBrand);
  let titleX = margin;
  if (logoImage) {
    const logoW = 62;
    const logoH = Math.min(42, logoW * (logoImage.height / logoImage.width));
    image('Logo', margin, 42, logoW, logoH);
    titleX = margin + logoW + 18;
  }
  text('Invoice', titleX, 68, 29, 'F2', ink);
  text(`#${inv.number || 'draft'}`, pageW - margin, 56, 11, 'F1', muted, 'right');
  text(`Issued ${inv.issueDate || '-'}`, pageW - margin, 75, 10.5, 'F1', muted, 'right');
  text(`Due ${inv.dueDate || '-'}`, pageW - margin, 93, 10.5, 'F1', muted, 'right');
  text(inv.terms || '', pageW - margin, 111, 10.5, 'F1', muted, 'right');

  text('FROM', margin, 126, 9, 'F2', muted);
  text('BILLED TO', pageW / 2 + 8, 126, 9, 'F2', muted);
  text(b.name || 'Your business', margin, 148, 12, 'F2', ink);
  text(c.name || 'Client name', pageW / 2 + 8, 148, 12, 'F2', ink);
  wrappedText(b.address || 'Business address', margin, 168, 32, 10, 'F1', muted);
  wrappedText([c.company, c.email, c.address].filter(Boolean).join(' ') || 'Client details', pageW / 2 + 8, 168, 34, 10, 'F1', muted);

  lineTo(margin, 226, pageW - margin, 226, line);
  text('DESCRIPTION', margin, 260, 9, 'F2', muted);
  text('QTY', pageW - 250, 260, 9, 'F2', muted, 'right');
  text('PRICE', pageW - 145, 260, 9, 'F2', muted, 'right');
  text('AMOUNT', pageW - margin, 260, 9, 'F2', muted, 'right');
  lineTo(margin, 272, pageW - margin, 272, ink);

  let y = 302;
  if (!items.length) {
    text('No line items yet', margin, y, 11, 'F1', muted);
    y += 30;
  } else {
    items.forEach((item) => {
      const desc = taxRegistered && Number(item.vat) > 0 ? `${item.desc} - ${r.taxName} ${item.vat}%` : item.desc;
      const lines = wrapPdfText(desc, 42);
      lines.forEach((ln, i) => text(ln, margin, y + (i * 13), 10.5, 'F1', ink));
      text(item.qty || 0, pageW - 250, y, 10.5, 'F1', ink, 'right');
      text(fmtMoney(item.price, region, { currency: inv.currency, pdfSafe: true }), pageW - 145, y, 10.5, 'F1', ink, 'right');
      text(fmtMoney(lineTotal(item), region, { currency: inv.currency, pdfSafe: true }), pageW - margin, y, 10.5, 'F2', ink, 'right');
      y += Math.max(30, lines.length * 14 + 8);
      lineTo(margin, y - 10, pageW - margin, y - 10, line);
    });
  }

  y += 20;
  const totalsX = pageW - 245;
  text('Subtotal', totalsX, y, 10.5, 'F1', muted);
  text(fmtMoney(totals.subtotal, region, { currency: inv.currency, pdfSafe: true }), pageW - margin, y, 10.5, 'F1', ink, 'right');
  y += 20;
  text(r.taxName, totalsX, y, 10.5, 'F1', muted);
  text(taxRegistered ? fmtMoney(totals.tax, region, { currency: inv.currency, pdfSafe: true }) : 'Not applicable', pageW - margin, y, 10.5, 'F1', ink, 'right');
  y += 14;
  lineTo(totalsX, y, pageW - margin, y, line);
  y += 22;
  text('Total due', totalsX, y, 13, 'F2', ink);
  text(fmtMoney(totals.total, region, { currency: inv.currency, pdfSafe: true }), pageW - margin, y, 13, 'F2', invoiceBrand, 'right');

  y += 34;
  rect(margin, y, pageW - margin * 2, 68, surface);
  text(`Pay to ${b.accountName || b.name || 'your account'}`, margin + 18, y + 24, 11, 'F2', ink);
  wrappedText(`${paymentRail.label}: ${b.iban || '-'}${taxRegistered ? ` - ${r.taxIdName} ${b.taxId}` : ''}`, margin + 18, y + 43, 78, 9.5, 'F1', muted, 12);
  if (inv.paymentLink) text('Pay invoice link enabled', pageW - margin - 18, y + 24, 9.5, 'F2', invoiceBrand, 'right');

  if (inv.notes) {
    y += 96;
    text('NOTES', margin, y, 9, 'F2', muted);
    wrappedText(inv.notes, margin, y + 18, 88, 10, 'F1', ink, 13);
  }
  text('Generated by Andras', margin, 806, 9, 'F1', muted);
  text(r.code, pageW - margin, 806, 9, 'F1', muted, 'right');

  const content = commands.join('\n');
  const xObjects = logoImage ? ' /XObject << /Logo 7 0 R >>' : '';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >>${xObjects} >> /Contents 4 0 R >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  if (logoImage) {
    objects.push(`<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.binary.length} >>\nstream\n${logoImage.binary}\nendstream`);
  }
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;

  const fileName = invoicePdfFileName(store);
  return { fileName, pdf };
}

async function downloadInvoicePdf(store, region) {
  const fileName = invoicePdfFileName(store);
  if (window.html2pdf) {
    const node = buildInvoiceHtmlElement(store, region);
    const layer = createInvoiceCaptureLayer(node);
    const cleanupTimer = setTimeout(() => layer.remove(), 15000);
    try {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 1200)),
        ]);
      }
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await Promise.race([
        window.html2pdf()
        .set({
          margin: 0,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            letterRendering: true,
            width: 794,
            height: 1123,
            windowWidth: 794,
            windowHeight: 1123,
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all', 'css'] },
        })
        .from(node)
        .save(),
        promiseTimeout(12000, 'PDF render timed out'),
      ]);
      window.lastInvoicePdfFilename = fileName;
      window.lastInvoicePdfRenderer = 'html2pdf-poppins';
      return fileName;
    } catch (error) {
      console.warn('Falling back to compact PDF export', error);
    } finally {
      clearTimeout(cleanupTimer);
      layer.remove();
    }
  } else {
    console.warn('HTML PDF renderer unavailable; using compact PDF export');
  }

  const { pdf } = buildInvoicePdfPayload(store, region);
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  window.lastInvoicePdfFilename = fileName;
  window.lastInvoicePdfBytes = pdf.length;
  window.lastInvoicePdfRenderer = 'fallback';
  return fileName;
}

function pdfToBase64(pdf) {
  return btoa(unescape(encodeURIComponent(pdf)));
}

function PdfDownloadLink({ store, region, children = 'PDF', size = 'md', full, style }) {
  const sizeMap = {
    sm: { h: 34, fs: 13.5, px: 12 },
    md: { h: 42, fs: 14.5, px: 17 },
    lg: { h: 50, fs: 16, px: 24 },
  }[size] || { h: 42, fs: 14.5, px: 17 };
  return (
    <a href="#download-pdf" role="button"
      onClick={async (event) => { event.preventDefault(); await downloadInvoicePdf(store, region); }}
      style={{
        height: sizeMap.h, padding: `0 ${sizeMap.px}px`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        width: full ? '100%' : 'auto',
        borderRadius: 'var(--r-sm)', border: '1px solid var(--line-2)', background: 'var(--surface)', color: 'var(--ink)',
        boxShadow: 'var(--sh-1)', textDecoration: 'none', fontSize: sizeMap.fs, fontWeight: 540, whiteSpace: 'nowrap',
        ...style,
      }}>
      <Icon name="download" size={sizeMap.fs + 3} />{children}
    </a>
  );
}

function CurrencyPicker({ value, onChange }) {
  const [open, setOpen] = useStateB(false);
  const selected = currencyRecord(value);
  const hideBrokenFlag = (event) => {
    event.currentTarget.style.visibility = 'hidden';
  };
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', height: 'var(--d-control)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-2)', background: 'var(--surface)',
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', cursor: 'pointer', fontSize: 14.5, color: 'var(--ink)' }}>
        <img src={flagUrlForCountryCode(selected.countryCode)} alt="" onError={hideBrokenFlag} style={{ width: 24, height: 24, borderRadius: 99, flex: 'none' }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</span>
        <span className="num" style={{ color: 'var(--muted)' }}>{selected.code}</span>
        <Icon name="chevDown" size={16} />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 30, maxHeight: 270, overflowY: 'auto',
          border: '1px solid var(--line-2)', borderRadius: 'var(--r-md)', background: 'var(--surface)', boxShadow: 'var(--sh-3)', padding: 5 }}>
          {CURRENCY_RECORDS.map((currency) => (
            <button key={currency.code} onClick={() => { onChange(currency.code); setOpen(false); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', border: 'none', borderRadius: 'var(--r-sm)', background: currency.code === value ? 'var(--brand-softer)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
              <img src={flagUrlForCountryCode(currency.countryCode)} alt="" onError={hideBrokenFlag} style={{ width: 24, height: 24, borderRadius: 99, flex: 'none' }} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 540 }}>{currency.name}</span>
              <span className="num" style={{ fontSize: 12.5, color: 'var(--muted)' }}>{currency.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceStylePicker({ value, onChange }) {
  const selected = invoiceAccentRecord(value);
  return (
    <div style={{ display: 'grid', gap: 9 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {INVOICE_ACCENTS.map((accent) => {
          const on = selected.id === accent.id;
          return (
            <button key={accent.id} onClick={() => onChange(accent.id)}
              title={accent.name}
              style={{ height: 34, minWidth: 34, padding: '0 10px 0 6px', borderRadius: 'var(--r-pill)', display: 'flex', alignItems: 'center', gap: 7,
                border: '1.5px solid ' + (on ? accent.hex : 'var(--line-2)'), background: on ? 'var(--surface)' : 'var(--surface-2)',
                color: 'var(--ink-2)', cursor: 'pointer', fontSize: 12.5, fontWeight: 540 }}>
              <span style={{ width: 20, height: 20, borderRadius: 99, background: accent.hex, boxShadow: 'inset 0 0 0 1px oklch(0 0 0 / .12)', display: 'grid', placeItems: 'center', color: '#fff', flex: 'none' }}>
                {on && <Icon name="checkSmall" size={12} stroke={3} />}
              </span>
              {accent.name}
            </button>
          );
        })}
      </div>
      <div style={{ height: 28, borderRadius: 'var(--r-sm)', background: `linear-gradient(90deg, ${selected.hex} 0 32%, var(--surface-2) 32% 100%)`, border: '1px solid var(--line)' }} />
    </div>
  );
}

function InvoiceLanguagePicker({ value, onChange }) {
  const current = INVOICE_COPY[value] ? value : 'en';
  return (
    <div style={{ maxWidth: 260, fontFamily: current === 'ka' ? "'SF Georgian','Noto Sans Georgian',var(--font-ui)" : 'var(--font-ui)' }}>
      <Select value={current} onChange={onChange}
        options={[
          { value: 'en', label: INVOICE_COPY.en.label },
          { value: 'ka', label: INVOICE_COPY.ka.label },
        ]} />
    </div>
  );
}

/* ============================================================
   Live Readiness rail (the signature element)
============================================================ */
function ReadinessRail({ store, region, go, compact }) {
  const checks = computeChecks(store, region);
  const pct = readiness(store, region);
  const blockers = checks.filter((c) => c.severity === 'block' && !c.ok).length;
  return (
    <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <ReadinessRing pct={pct} size={56} stroke={5.5} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 580 }}>Invoice readiness</div>
            <div style={{ fontSize: 12.5, color: blockers ? 'var(--warn-ink)' : 'var(--ok)' }}>
              {blockers ? `${blockers} thing${blockers > 1 ? 's' : ''} left before finishing` : 'Ready to download'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {checks.map((c) => (
            <button key={c.id} onClick={() => c.step !== 'build' && go(c.step === 'setup' ? 'setup' : c.step === 'client' ? 'client' : 'build')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 'var(--r-sm)', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width: 20, height: 20, borderRadius: 99, flex: 'none', display: 'grid', placeItems: 'center',
                background: c.ok ? 'var(--ok-soft)' : c.severity === 'block' ? 'var(--bad-soft)' : 'var(--warn-soft)',
                color: c.ok ? 'var(--ok)' : c.severity === 'block' ? 'var(--bad)' : 'var(--warn-ink)' }}>
                {c.ok ? <Icon name="checkSmall" size={13} stroke={3} /> : <Icon name={c.severity === 'block' ? 'close' : 'alert'} size={12} stroke={2.6} />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12.8, fontWeight: 520, color: c.ok ? 'var(--ink-2)' : 'var(--ink)', display: 'block' }}>{c.label}</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.detail}</span>
              </span>
            </button>
          ))}
        </div>
      </Card>
      {!compact && (
        <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, padding: '0 4px', display: 'flex', gap: 8 }}>
          <span style={{ color: 'var(--faint)', flex: 'none' }}><Icon name="info" size={15} /></span>
          Setup folds into this invoice — fix anything by jumping back, then return here. Nothing blocks you until you finish the PDF.
        </div>
      )}
    </div>
  );
}

/* ============================================================
   4 — INVOICE BUILDER
============================================================ */
function InvoiceBuilder({ store, update, region, go, showRail }) {
  const r = REGIONS[region];
  const inv = store.invoice;
  const copy = invoiceCopy(inv, region);
  const accent = invoiceAccentRecord(inv.accent);
  const setInv = (patch) => update({ invoice: { ...store.invoice, ...patch } });
  const totals = computeTotals(inv, region);
  const taxRegistered = store.business.taxRegistered === true;
  const invoiceCountry = store.business.country || defaultCountryForRegion(region);
  const numberInfo = invoiceNumberDetails(inv.number, invoiceCountry);

  const setItem = (idx, patch) => {
    const items = inv.items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    setInv({ items });
  };
  const addItem = () => setInv({ items: [...inv.items, { desc: '', qty: 1, price: '', vat: taxRegistered ? r.defaultTaxRate : 0 }] });
  const delItem = (idx) => setInv({ items: inv.items.filter((_, i) => i !== idx) });

  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>
      <ScreenHead eyebrow="Step 3 of 4 · Build" title="Build the invoice"
        sub="Line items, dates and currency. The math, tax and formatting are handled for you." />
      <div style={{ display: 'grid', gridTemplateColumns: showRail ? 'minmax(0,1fr) 300px' : 'minmax(0,1fr)', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* meta */}
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
              <Field label="Invoice no." hint={`Industry-standard sequential format: ${numberInfo.expectedFormat}.`}>
                <Input value={inv.number}
                  onChange={(v) => setInv({ number: normalizeInvoiceNumberInput(v, invoiceCountry) })}
                  onBlur={() => setInv({ number: invoiceNumberForCountry(inv.number, invoiceCountry) })}
                  mono prefix="#" invalid={!numberInfo.matchesStandard} />
              </Field>
              <Field label="Issue date"><Input value={inv.issueDate} onChange={(v) => setInv({ issueDate: v })} mono /></Field>
              <Field label="Payment terms">
                <Select value={inv.terms} onChange={(v) => {
                  setInv({ terms: v, dueDate: dueDateForTerms(v, inv.issueDate) });
                }} options={['Due on receipt', 'Net 7', 'Net 14', 'Net 30', 'Net 60']} />
              </Field>
              <Field label="Currency" hint={`${currencyRecord(inv.currency).code} · ${currencyRecord(inv.currency).symbol}`}>
                <CurrencyPicker value={inv.currency} onChange={(currency) => setInv({ currency })} />
              </Field>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 220px', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'grid', gap: 14 }}>
                <Field label="Invoice style" hint="Client-facing accent for the PDF and preview.">
                  <InvoiceStylePicker value={inv.accent} onChange={(accent) => setInv({ accent })} />
                </Field>
                <Field label="Invoice language" hint="Controls the labels used in the preview and PDF.">
                  <InvoiceLanguagePicker value={invoiceLanguage(inv, region)} onChange={(language) => {
                    const currentDefault = INVOICE_COPY[invoiceLanguage(inv, region)].defaultNotes;
                    const nextDefault = INVOICE_COPY[language].defaultNotes;
                    setInv({ language, notes: inv.notes === currentDefault ? nextDefault : inv.notes });
                  }} />
                </Field>
              </div>
              <div style={{ border: '1px solid var(--line)', borderRadius: 'var(--r-md)', background: 'var(--surface)', overflow: 'hidden', boxShadow: 'var(--sh-1)' }}>
                <div style={{ height: 6, background: accent.hex }} />
                <div style={{ padding: 14, display: 'grid', gap: 10 }}>
                  <div style={{ height: 9, width: '44%', background: 'var(--ink)', borderRadius: 99 }} />
                  <div style={{ height: 7, width: '82%', background: 'var(--line-2)', borderRadius: 99 }} />
                  <div style={{ height: 7, width: '64%', background: 'var(--line)', borderRadius: 99 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 }}>
                    <span style={{ height: 7, width: 50, background: 'var(--line-2)', borderRadius: 99 }} />
                    <span style={{ height: 12, width: 58, background: accent.hex, borderRadius: 99 }} />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* line items */}
          <Card pad={false}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px' + (taxRegistered ? ' 86px' : '') + ' 110px 34px', gap: 10, padding: '14px 18px 10px', alignItems: 'center' }}>
              {[copy.description, copy.qty, copy.unitPrice, ...(taxRegistered ? [r.taxName] : []), copy.amount, ''].map((h, i) => (
                <div key={i} className="eyebrow" style={{ fontSize: 10.5, textAlign: i === 0 ? 'left' : (i === (taxRegistered ? 4 : 3) ? 'right' : 'center') }}>{h}</div>
              ))}
            </div>
            <Divider />
            {inv.items.map((it, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px' + (taxRegistered ? ' 86px' : '') + ' 110px 34px', gap: 10, padding: '11px 18px', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
                <Input value={it.desc} onChange={(v) => setItem(idx, { desc: v })} placeholder="What are you billing for?" style={{ height: 40 }} />
                <Input value={it.qty} onChange={(v) => setItem(idx, { qty: v.replace(/[^\d.]/g, '') })} mono style={{ height: 40, textAlign: 'center' }} />
                <Input value={it.price} onChange={(v) => setItem(idx, { price: v.replace(/[^\d.]/g, '') })} mono prefix={currencyRecord(inv.currency).symbol} placeholder="0.00" style={{ height: 40 }} />
                {taxRegistered && (
                  <Select value={String(it.vat)} onChange={(v) => setItem(idx, { vat: Number(v) })}
                    options={[{ value: '0', label: '0%' }, { value: '5', label: '5%' }, { value: '18', label: '18%' }, { value: '21', label: '21%' }, { value: '23', label: '23%' }]} style={{ height: 40 }} />
                )}
                <div className="num" style={{ textAlign: 'right', fontSize: 14, fontWeight: 540, color: lineTotal(it) ? 'var(--ink)' : 'var(--faint)' }}>{fmtMoney(lineTotal(it), region, { currency: inv.currency })}</div>
                <button onClick={() => delItem(idx)} disabled={inv.items.length === 1} aria-label="Remove line"
                  style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: 'none', background: 'transparent', borderRadius: 'var(--r-xs)', cursor: inv.items.length === 1 ? 'not-allowed' : 'pointer', color: 'var(--faint)', opacity: inv.items.length === 1 ? 0.3 : 1 }}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
            <button onClick={addItem} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 18px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--brand-strong)', fontSize: 13.5, fontWeight: 540, width: '100%' }}>
              <Icon name="plus" size={17} /> Add line item
            </button>
          </Card>

          {/* totals + notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
            <Field label="Notes for the client" hint="Appears at the foot of the invoice.">
              <Textarea value={inv.notes} onChange={(v) => setInv({ notes: v })} rows={4} />
            </Field>
            <Card style={{ padding: 18 }}>
              {[[copy.subtotal, totals.subtotal]].map(([l, v]) => (
                <Row key={l} l={l} v={fmtMoney(v, region, { currency: inv.currency })} />
              ))}
              {taxRegistered && <Row l={`${r.taxName}`} v={fmtMoney(totals.tax, region, { currency: inv.currency })} />}
              {!taxRegistered && <Row l={`${r.taxName}`} v={copy.notApplicable} muted />}
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 14, fontWeight: 580, whiteSpace: 'nowrap' }}>{copy.totalDue}</span>
                <span className="num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--brand)' }}>{fmtMoney(totals.total, region, { currency: inv.currency })}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', textAlign: 'right', marginTop: 2 }} className="num">{inv.currency} · due {inv.dueDate}</div>
            </Card>
          </div>
        </div>

        {showRail && <ReadinessRail store={store} region={region} go={go} />}
      </div>

      <FlowFooter onBack={() => go('client')} onNext={() => go('check')} nextLabel="Review & check" nextIcon="shield" />
    </div>
  );
}
function Row({ l, v, muted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{l}</span>
      <span className="num" style={{ fontSize: 13.5, color: muted ? 'var(--faint)' : 'var(--ink)' }}>{v}</span>
    </div>
  );
}

/* ============================================================
   5 — SMART COMPLETENESS CHECK
============================================================ */
function CompletenessCheck({ store, region, go }) {
  const checks = computeChecks(store, region);
  const pct = readiness(store, region);
  const blockers = checks.filter((c) => c.severity === 'block' && !c.ok);
  const warns = checks.filter((c) => c.severity === 'warn' && !c.ok);
  const passed = checks.filter((c) => c.ok);
  const ready = blockers.length === 0;

  const stepOf = (s) => (s === 'setup' ? 'setup' : s === 'client' ? 'client' : 'build');

  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 720 }}>
      <ScreenHead eyebrow="Step 4 of 4 · Check" title="Smart completeness check"
        sub="Before you share the PDF, Andras checks the invoice for compliance, payment and formatting errors." />

      <Card elevated style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '22px 24px',
          background: ready ? 'var(--ok-soft)' : 'var(--warn-soft)' }}>
          <ReadinessRing pct={pct} size={60} stroke={6} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {ready ? 'This invoice is ready to download' : `${blockers.length} issue${blockers.length > 1 ? 's' : ''} to fix before download`}
            </div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 2 }}>
              {ready ? 'All required checks pass. Optional suggestions are listed below.' : 'We’ve linked each issue to the exact step that fixes it.'}
            </div>
          </div>
          {ready && <Badge tone="ok" icon="shield">Verified</Badge>}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {blockers.length > 0 && (
          <CheckGroup title="Must fix" tone="bad" items={blockers} go={go} stepOf={stepOf} action />
        )}
        {warns.length > 0 && (
          <CheckGroup title="Worth a look" tone="warn" items={warns} go={go} stepOf={stepOf} action />
        )}
        <CheckGroup title={`Passed (${passed.length})`} tone="ok" items={passed} go={go} stepOf={stepOf} />
      </div>

      <FlowFooter onBack={() => go('build')} onNext={() => go('preview')} nextLabel="Preview invoice" nextIcon="doc"
        nextDisabled={!ready} hint={ready ? 'All clear' : 'Resolve the must-fix items to continue'} />
    </div>
  );
}

function CheckGroup({ title, tone, items, go, stepOf, action }) {
  const c = { bad: 'var(--bad)', warn: 'var(--warn-ink)', ok: 'var(--ok)' }[tone];
  const bg = { bad: 'var(--bad-soft)', warn: 'var(--warn-soft)', ok: 'var(--ok-soft)' }[tone];
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: c }} />
        <span className="eyebrow" style={{ color: c, whiteSpace: 'nowrap' }}>{title}</span>
      </div>
      <Card pad={false}>
        {items.map((it, i) => (
          <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 18px', borderBottom: i < items.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <span style={{ width: 26, height: 26, borderRadius: 99, flex: 'none', display: 'grid', placeItems: 'center', background: bg, color: c }}>
              {tone === 'ok' ? <Icon name="checkSmall" size={15} stroke={3} /> : <Icon name={tone === 'bad' ? 'close' : 'alert'} size={14} stroke={2.4} />}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 530 }}>{it.label}</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{it.detail}</div>
            </div>
            {action && <Button size="sm" variant="outline" onClick={() => go(stepOf(it.step))}>Fix</Button>}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ============================================================
   6 — PREVIEW (with edit hotspots)
============================================================ */
function Preview({ store, region, go, onFinish }) {
  const r = REGIONS[region];
  const inv = store.invoice, b = store.business, c = store.client || {};
  const copy = invoiceCopy(inv, region);
  const lang = invoiceLanguage(inv, region);
  const accent = invoiceAccentRecord(inv.accent);
  const totals = computeTotals(inv, region);
  const taxRegistered = b.taxRegistered === true;
  const paymentRail = paymentRailForCountry(b.country, region);
  const [hot, setHot] = useStateB(null);

  const Hot = ({ id, target, children, style }) => (
    <div onClick={() => go(target)} onMouseEnter={() => setHot(id)} onMouseLeave={() => setHot(null)}
      style={{ position: 'relative', cursor: 'pointer', borderRadius: 6, transition: 'background .15s',
        outline: hot === id ? '2px solid var(--brand)' : '2px solid transparent', outlineOffset: 3,
        background: hot === id ? 'var(--brand-softer)' : 'transparent', ...style }}>
      {children}
      {hot === id && <span style={{ position: 'absolute', top: -11, right: -8, zIndex: 2 }}><Badge tone="brand" size="sm" icon="edit">Edit</Badge></span>}
    </div>
  );

  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 820 }}>
      <ScreenHead eyebrow="Preview" title="This is what your client sees"
        sub="Hover any section to jump back and edit it. The PDF and payment page use this exact layout."
        right={<div style={{ display: 'flex', gap: 9 }}>
          <PdfDownloadLink store={store} region={region}>PDF</PdfDownloadLink>
        </div>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', placeItems: 'center' }}>
        {/* the document */}
        <div lang={lang} style={{ width: '100%', maxWidth: 720, background: 'var(--surface)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-3)', border: '1px solid var(--line)', overflow: 'hidden', fontFamily: lang === 'ka' ? "'SF Georgian','Noto Sans Georgian',var(--font-ui)" : 'var(--font-ui)' }}>
          <div style={{ height: 6, background: accent.hex }} />
          <div style={{ padding: '40px 44px 44px' }}>
            {/* header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
              <Hot id="logo" target="setup">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 4 }}>
                  {b.logoData
                    ? <span style={{ width: 54, height: 44, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', overflow: 'hidden', flex: 'none' }}>
                        <img src={b.logoData} alt={`${b.name || 'Business'} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </span>
                    : b.logo
                    ? <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--brand)', color: 'var(--on-brand)', display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700 }}>{(b.name || 'A')[0].toUpperCase()}</div>
                    : <Logo size={26} withWordmark={false} />}
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{b.name || copy.yourBusiness}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>{b.address || copy.businessAddress}</div>
                  </div>
                </div>
              </Hot>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.2 }}>{copy.invoiceTitle}</div>
                <Hot id="num" target="build" style={{ display: 'inline-block', marginTop: 4 }}>
                  <div className="num" style={{ fontSize: 13, color: 'var(--ink-2)', padding: '0 4px' }}>#{inv.number}</div>
                </Hot>
              </div>
            </div>

            {/* parties */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 32 }}>
              <Hot id="client" target="client">
                <div style={{ padding: 4 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>{copy.billedTo}</div>
                  <div style={{ fontSize: 14.5, fontWeight: 560 }}>{c.name || copy.clientName}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{c.company || ''}{c.company ? <br/> : null}{c.email}<br/>{c.address}</div>
                </div>
              </Hot>
              <div style={{ padding: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--muted)' }}>{copy.issued}</span><span className="num">{inv.issueDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: 'var(--muted)' }}>{copy.due}</span><span className="num" style={{ fontWeight: 560 }}>{inv.dueDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>{copy.terms}</span><span style={{ whiteSpace: 'nowrap' }}>{invoiceTermsLabel(inv.terms, inv, region)}</span>
                </div>
              </div>
            </div>

            {/* items */}
            <Hot id="items" target="build">
              <div style={{ padding: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 100px 100px', gap: 10, padding: '0 0 9px', borderBottom: '1.5px solid var(--ink)' }}>
                  {[copy.description, copy.qty, copy.price, copy.amount].map((h, i) => (
                    <div key={h} className="eyebrow" style={{ fontSize: 10, textAlign: i === 0 ? 'left' : 'right' }}>{h}</div>
                  ))}
                </div>
                {inv.items.filter((i) => i.desc).map((it, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 100px 100px', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--line)', fontSize: 13.5 }}>
                    <div>{it.desc}{taxRegistered && Number(it.vat) > 0 && <span style={{ color: 'var(--muted)', fontSize: 12 }}> · {r.taxName} {it.vat}%</span>}</div>
                    <div className="num" style={{ textAlign: 'right' }}>{it.qty}</div>
                    <div className="num" style={{ textAlign: 'right' }}>{fmtMoney(it.price, region, { currency: inv.currency })}</div>
                    <div className="num" style={{ textAlign: 'right', fontWeight: 540 }}>{fmtMoney(lineTotal(it), region, { currency: inv.currency })}</div>
                  </div>
                ))}
                {inv.items.filter((i) => i.desc).length === 0 && (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--faint)', fontSize: 13 }}>{copy.noLineItemsAction}</div>
                )}
              </div>
            </Hot>

            {/* totals */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <div style={{ width: 240 }}>
                <Row l={copy.subtotal} v={fmtMoney(totals.subtotal, region, { currency: inv.currency })} />
                {taxRegistered ? <Row l={r.taxName} v={fmtMoney(totals.tax, region, { currency: inv.currency })} /> : <Row l={r.taxName} v="—" muted />}
                <Divider style={{ margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap' }}>{copy.totalDue}</span>
                  <span className="num" style={{ fontSize: 19, fontWeight: 600, color: accent.hex }}>{fmtMoney(totals.total, region, { currency: inv.currency })}</span>
                </div>
              </div>
            </div>

            {/* pay + notes */}
            <div style={{ marginTop: 30, padding: '16px 18px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ color: accent.hex, flex: 'none' }}><Icon name="bank" size={22} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 560 }}>{copy.payTo} {b.accountName || b.name || copy.yourAccount}</div>
                <div className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>{paymentRail.label}: {b.iban || '—'}{taxRegistered ? ` · ${r.taxIdName} ${b.taxId}` : ''}</div>
              </div>
              {inv.paymentLink && <Badge tone="brand" icon="link">{copy.payOnline}</Badge>}
            </div>
            {inv.notes && <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>{inv.notes}</div>}
          </div>
        </div>
      </div>

      <FlowFooter onBack={() => go('check')} onNext={onFinish || (() => { downloadInvoicePdf(store, region); go('success'); })} nextLabel="Finish & download" nextIcon="download" />
    </div>
  );
}

/* ============================================================
   7 — SEND FLOW
============================================================ */
function SendFlow({ store, update, region, go, onSend }) {
  const r = REGIONS[region];
  const inv = store.invoice, c = store.client || {};
  const totals = computeTotals(inv, region);
  const setInv = (patch) => update({ invoice: { ...store.invoice, ...patch } });

  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>
      <ScreenHead eyebrow="Finish" title="Download your invoice" sub="Andras prepares a real PDF you can save, print, or attach to any email client." />
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 22, alignItems: 'start' }}>
        <Card>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 'var(--r-md)' }}>
              <span style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bad-soft)', color: 'var(--bad)', display: 'grid', placeItems: 'center', flex: 'none' }}><Icon name="doc" size={20} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 540 }} className="num">Invoice-{inv.number}.pdf</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Attached automatically · 1 page</div>
              </div>
              <Badge tone="ok" size="sm" icon="checkSmall">Attached</Badge>
              <PdfDownloadLink store={store} region={region} size="sm">PDF</PdfDownloadLink>
            </div>
            <div style={{ padding: '16px 18px', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', background: 'var(--surface)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <Row l="Invoice" v={`#${inv.number}`} />
                <Row l="Client" v={c.name || 'Client'} />
                <Row l="Due date" v={inv.dueDate} />
                <Row l="Total" v={fmtMoney(totals.total, region, { currency: inv.currency })} />
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
                The PDF includes your business details, client details, line items, tax, total, notes and payment instructions.
              </div>
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Payment options</div>
            <ToggleRow icon="link" title="Payment instructions" desc="Adds your bank and payment methods to the PDF" on={inv.paymentLink} onChange={(v) => setInv({ paymentLink: v })} />
            <Divider style={{ margin: '12px 0' }} />
            <ToggleRow icon="recurring" title="Recurring invoices" desc="Coming later with accounts and saved clients" on={false} onChange={() => {}} />
            <Divider style={{ margin: '12px 0' }} />
            <ToggleRow icon="clock" title="Payment reminders" desc="Coming later with email delivery and tracking" on={false} onChange={() => {}} />
          </Card>
          <Card style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Total due</span>
              <span className="num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--brand)' }}>{fmtMoney(totals.total, region, { currency: inv.currency })}</span>
            </div>
            <div className="num" style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 14 }}>to {c.name} · due {inv.dueDate}</div>
            <Button full size="lg" icon="download" onClick={onSend}>Finish & download PDF</Button>
            <PdfDownloadLink store={store} region={region} full size="md" style={{ marginTop: 10 }}>Download only</PdfDownloadLink>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, fontSize: 11.5, color: 'var(--muted)' }}>
              <Icon name="shield" size={14} /> Verified & {r.taxName}-checked
            </div>
          </Card>
        </div>
      </div>
      <FlowFooter onBack={() => go('preview')} />
    </div>
  );
}
function ToggleRow({ icon, title, desc, on, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: on ? 'var(--brand)' : 'var(--faint)', flex: 'none' }}><Icon name={icon} size={20} /></span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 540 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
      </div>
      <Switch on={on} onChange={onChange} size="sm" />
    </div>
  );
}

/* ============================================================
   8 — SUCCESS DASHBOARD
============================================================ */
function Success({ store, region, go, resetFlow, elapsed }) {
  const r = REGIONS[region];
  const inv = store.invoice, c = store.client || {};
  const totals = computeTotals(inv, region);
  const next = [
    { icon: 'download', title: 'Download the PDF', desc: 'Keep the invoice file and attach it to your email.', cta: 'Download', download: true },
    { icon: 'invoice', title: 'Create another invoice', desc: 'Reuse your business setup and start a fresh draft.', cta: 'New invoice', action: resetFlow },
    { icon: 'home', title: 'Back to workspace', desc: 'Return to the local dashboard without creating an account.', cta: 'Home', target: 'dashboard' },
  ];
  return (
    <div style={{ animation: 'fadeUp .35s ease both', maxWidth: 880 }}>
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ width: 'min(240px, 100%)', aspectRatio: '1 / 1', margin: '0 auto 18px', display: 'grid', placeItems: 'center', animation: 'fadeUp .35s ease both' }}>
          <img src="assets/success-handshake-illustration.png?v=success-handshake-1" alt="Invoice ready handshake illustration"
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600, letterSpacing: '-0.025em' }}>Invoice #{inv.number} is ready</h1>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--muted)' }}>
          {fmtMoney(totals.total, region, { currency: inv.currency })} prepared for {c.name} at <span className="num">{c.email}</span>
        </p>
        {elapsed && <div style={{ marginTop: 14, display: 'inline-flex' }}><Badge tone="indigo" icon="bolt">First invoice prepared in {elapsed}</Badge></div>}
      </div>

      {/* status tracker */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Monogram name={c.name} size={40} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 560 }}>{c.name} · #{inv.number}</div>
              <div className="num" style={{ fontSize: 12.5, color: 'var(--muted)' }}>{fmtMoney(totals.total, region, { currency: inv.currency })} · due {inv.dueDate}</div>
            </div>
          </div>
          <Badge tone="ok" icon="checkSmall">Ready</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[['Ready', true], ['Downloaded', true], ['Shared', false], ['Paid', false]].map(([label, done], i, arr) => (
            <React.Fragment key={label}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 26, height: 26, borderRadius: 99, display: 'grid', placeItems: 'center', flex: 'none',
                  background: done ? 'var(--ok)' : 'var(--surface-3)', color: done ? 'var(--on-brand)' : 'var(--faint)',
                  border: done ? 'none' : '1.5px solid var(--line-2)' }}>
                  {done ? <Icon name="checkSmall" size={14} stroke={3} /> : <Icon name="dot" size={16} />}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 520, color: done ? 'var(--ink)' : 'var(--muted)' }}>{label}</span>
              </div>
              {i < arr.length - 1 && <div style={{ flex: 1, height: 2, background: arr[i + 1][1] ? 'var(--ok)' : 'var(--line-2)', margin: '0 6px', marginBottom: 20 }} />}
            </React.Fragment>
          ))}
        </div>
      </Card>

      <div className="eyebrow" style={{ marginBottom: 11 }}>Recommended next</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {next.map((n) => (
          <Card key={n.title} hover onClick={() => n.action ? n.action() : (n.target && go(n.target))} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ color: 'var(--brand)' }}><Icon name={n.icon} size={22} /></span>
            <div style={{ fontSize: 14.5, fontWeight: 560, marginTop: 4 }}>{n.title}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', flex: 1, lineHeight: 1.45 }}>{n.desc}</div>
            {n.download
              ? <PdfDownloadLink store={store} region={region} variant="outline" size="sm" style={{ marginTop: 6, alignSelf: 'flex-start' }}>Download</PdfDownloadLink>
              : <Button variant="outline" size="sm" iconRight="arrowRight" onClick={() => n.action ? n.action() : go(n.target)} style={{ marginTop: 6, alignSelf: 'flex-start' }}>{n.cta}</Button>}
          </Card>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
        <Button variant="ghost" icon="arrowRight" onClick={resetFlow}>Create another invoice</Button>
      </div>
    </div>
  );
}

Object.assign(window, {
  ReadinessRail, InvoiceBuilder, CompletenessCheck, Preview, SendFlow, Success, Row,
  buildInvoicePdfPayload, buildInvoiceHtmlElement, createInvoiceCaptureLayer, downloadInvoicePdf,
});
