import type { Order } from '../../types';
import { calculateOrder } from '../../utils/calculations';

// Swedish price format: 3 500,00
function fmt(amount: number): string {
  const [i, d] = amount.toFixed(2).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + ',' + d;
}

function esc(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadLogoBase64(): Promise<string> {
  try {
    const res = await fetch('/logo.webp');
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

export async function generateAndPrint(
  order: Order,
  type: 'offert' | 'bekräftelse'
): Promise<void> {
  // Open the window SYNCHRONOUSLY before any awaits so mobile browsers
  // recognise it as originating from a direct user gesture (not blocked).
  const win = window.open('', '_blank');

  const calc = calculateOrder(order);
  const logo = await loadLogoBase64();
  const isOffert = type === 'offert';

  // ── 1. Mixed-case title ──────────────────────────────────────
  const docTitle = isOffert ? 'Offert' : 'Bekr\u00e4ftelse';
  const today = new Date().toLocaleDateString('sv-SE');

  // ── Offertens giltighet ─────────────────────────────────────
  const validityLabel = (() => {
    if (!isOffert) return '';
    if (order.quoteValidityDays === 'custom' && order.quoteValidityCustomDate)
      return esc(order.quoteValidityCustomDate);
    const days = typeof order.quoteValidityDays === 'number' ? order.quoteValidityDays : 14;
    return `${days} dagar`;
  })();

  const addr = [
    order.address,
    [order.postalCode, order.city].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .map(esc)
    .join(', ');

  // ── 3. Two info blocks ──────────────────────────────────────
  const infoRow = (label: string, value: string) =>
    `<tr><td class="lbl">${label}</td><td>${value}</td></tr>`;

  // Block 1: date + validity
  const infoBlock1 = [
    infoRow('Offertdatum:', today),
    ...(isOffert && validityLabel ? [infoRow('Offertens giltighet:', validityLabel)] : []),
    ...(!isOffert ? [infoRow('Bekr\u00e4ftelsedatum:', today)] : []),
  ].join('');

  // Block 2: customer details
  const infoBlock2 = [
    infoRow('Kundnamn:', esc(`${order.firstName} ${order.lastName}`)),
    ...(addr ? [infoRow('Adress:', addr)] : []),
    ...(order.phone ? [infoRow('Telefon:', esc(order.phone))] : []),
    ...(order.email ? [infoRow('E-post:', esc(order.email))] : []),
    ...(order.eventDate ? [infoRow('Eventdatum:', esc(order.eventDate))] : []),
  ].join('');

  // ── Package contents lookup ──────────────────────────────────
  const PACKAGE_CONTENTS: Record<string, string[]> = {
    'pak-4x6-enkelt':   ['T\u00e4lt 4x6 m'],
    'pak-4x8-enkelt':   ['T\u00e4lt 4x8 m'],
    'pak-4x10-enkelt':  ['T\u00e4lt 4x10 m'],
    'pak-4x6-standard': ['T\u00e4lt 4x6 m', 'Montage'],
    'pak-4x8-standard': ['T\u00e4lt 4x8 m', 'Montage'],
    'pak-4x10-standard':['T\u00e4lt 4x10 m', 'Montage'],
    'pak-4x6-premium':  ['T\u00e4lt 4x6 m', 'Montage', '36 klappstolar', '6 bord'],
    'pak-4x8-premium':  ['T\u00e4lt 4x8 m', 'Montage', '48 klappstolar', '8 bord'],
    'pak-4x10-premium': ['T\u00e4lt 4x10 m', 'Montage', '60 klappstolar', '10 bord'],
  };

  // ── Article rows ────────────────────────────────────────────
  const montageRowLabel = (_category: string) => 'Montage';

  const articleRows = order.items
    .map(item => {
      const name = esc(item.productName) + (item.colorVariant ? ` \u2013 ${esc(item.colorVariant)}` : '');
      const lineTotal = item.quantity * item.unitPrice;
      const montageTotal = item.quantity * item.montageUnitPrice;
      const pkgContents = PACKAGE_CONTENTS[item.productId] ?? [];
      const pkgRows = pkgContents
        .map(line => `<tr class="sub"><td class="sub-indent">\u21b3 ${line}</td><td colspan="3"></td></tr>`)
        .join('');
      const subCompRows = item.subComponents
        ? Object.entries(item.subComponents)
            .filter(([, q]) => q > 0)
            .map(([label, q]) => `<tr class="sub"><td class="sub-indent">\u21b3 ${esc(label)}: ${q}</td><td colspan="3"></td></tr>`)
            .join('')
        : '';
      return `
        <tr>
          <td>${name}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${fmt(item.unitPrice)}</td>
          <td class="num">${fmt(lineTotal)}</td>
        </tr>
        ${pkgRows}
        ${subCompRows}
        ${item.includesMontage && pkgContents.length === 0 ? `
        <tr class="sub">
          <td class="sub-indent">\u21b3 ${montageRowLabel(item.category)}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${fmt(item.montageUnitPrice)}</td>
          <td class="num">${fmt(montageTotal)}</td>
        </tr>` : ''}
        ${item.includesDishwashing ? `
        <tr class="sub">
          <td class="sub-indent">\u21b3 Diskning</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${fmt(10)}</td>
          <td class="num">${fmt(item.quantity * 10)}</td>
        </tr>` : ''}`;
    })
    .join('');

  // ── Service table — always shown, simplified names ──────────
  const serviceRows = (() => {
    if (order.selfPickup)
      return `
      <tr>
        <td>Kunden h\u00e4mtar</td>
        <td>${addr}</td>
        <td>${esc(order.deliveryDate || '')}</td>
        <td class="num">${esc(order.deliveryDate ? (order.deliveryTime || 'Flexibel') : '')}</td>
      </tr>
      <tr>
        <td>Kunden \u00e5terl\u00e4mnar</td>
        <td>${addr}</td>
        <td>${esc(order.pickupDate || '')}</td>
        <td class="num">${esc(order.pickupDate ? (order.pickupTime || 'Flexibel') : '')}</td>
      </tr>`;
    return `
      <tr>
        <td>Leverans &amp; montage</td>
        <td>${addr}</td>
        <td>${esc(order.deliveryDate || '')}</td>
        <td class="num">${esc(order.deliveryDate ? (order.deliveryTime || 'Flexibel') : '')}</td>
      </tr>
      <tr>
        <td>Leverans &amp; nedmontage</td>
        <td>${addr}</td>
        <td>${esc(order.pickupDate || '')}</td>
        <td class="num">${esc(order.pickupDate ? (order.pickupTime || 'Flexibel') : '')}</td>
      </tr>`;
  })();

  // ── Price summary ───────────────────────────────────────────
  const discountRow =
    calc.discountAmount > 0
      ? `<tr>
           <td class="lbl">Rabatt ${order.discountPercent}%</td>
           <td class="num red">- ${fmt(calc.discountAmount)}</td>
         </tr>` : '';

  const depositRows =
    order.depositPaid && order.depositAmount > 0
      ? `<tr>
           <td class="lbl">F\u00f6rskott betalt</td>
           <td class="num">- ${fmt(order.depositAmount)}</td>
         </tr>
         <tr>
           <td class="lbl bold">Kvar att betala</td>
           <td class="num bold">${fmt(calc.remainingAmount)}</td>
         </tr>` : '';

  // ── 5. Notes content (yta + free-text) ─────────────────────
  const ytaLine = order.groundType && order.groundType !== 'Ej angivet'
    ? `<div class="notes-yta">Yta f\u00f6r montage av t\u00e4lt: <strong>${esc(order.groundType)}</strong></div>`
    : '';
  const notesContent = ytaLine || order.notes
    ? `${ytaLine}${order.notes ? `<div class="notes-text">${esc(order.notes)}</div>` : '<div class="notes-space"></div>'}`
    : '<div class="notes-space"></div>';

  /* ============================================================
     HTML document
  ============================================================ */
  const html = `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<title>${docTitle} \u2013 ${esc(order.lastName)} ${esc(order.firstName)}</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #1a1a1a; background: white; }
@media print {
  @page { size: A4; margin: 18mm 20mm; }
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
.wrap { max-width: 760px; margin: 0 auto; padding: 24px; position: relative; }
.logo { position: absolute; top: 0; right: 0; width: 160px; }
.doc-title { font-size: 13pt; font-weight: bold; color: #111111; line-height: 1; padding-bottom: 5px; }

/* ── 2. Dividers — 2px, all green ── */
hr.div  { border: none; border-top: 2px solid #4a9a5e; margin: 8px 0; }
hr.tdiv { border: none; border-top: 0.8px solid #aaa; margin: 4px 0; }

/* ── Info tables ── */
.info { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
.info td { padding: 3px 0; font-size: 8.5pt; border-bottom: 0.5px solid #ddd; vertical-align: top; }
.info td.lbl { width: 150px; color: #666; }

/* ── Article / service tables ── */
.tbl { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
.tbl th { font-size: 8.5pt; font-weight: bold; text-align: left; padding-bottom: 5px; border-bottom: 2px solid #4a9a5e; }
.tbl th.num, .tbl td.num { text-align: right; }
.tbl td { font-size: 8.5pt; padding: 4px 0; border-bottom: 0.5px solid #ebebeb; vertical-align: top; }
.tbl tr.sub td { font-style: italic; color: #555; font-size: 8pt; padding: 3px 0; }
.tbl tr.sub td.sub-indent { padding-left: 14px; }

/* ── Totals ── */
.totals-outer { display: flex; justify-content: flex-end; margin: 6px 0 10px; }
.totals-block { width: 265px; }
.ttbl { width: 100%; border-collapse: collapse; }
.ttbl td { padding: 2px 0; font-size: 8.5pt; }
.ttbl td.lbl { color: #666; }
.ttbl td.num { text-align: right; }
.ttbl td.bold { font-weight: bold; }
.ttbl td.red { color: #dc2626; }

/* ── Grand total box — green border, black text ── */
.grand-box {
  display: flex; justify-content: space-between; align-items: center;
  background: transparent; color: #111111;
  border: 2px solid #4a9a5e;
  padding: 6px 10px;
  font-weight: bold; font-size: 9.5pt;
  margin: 4px 0;
  border-radius: 2px;
}

/* ── 5. Notes ── */
.notes-head { font-weight: bold; font-size: 9pt; margin-bottom: 4px; margin-top: 2px; }
.notes-yta  { font-size: 8.5pt; color: #444; margin-bottom: 4px; }
.notes-text { font-size: 8.5pt; line-height: 1.5; }
.notes-space { height: 64px; }

/* ── Terms ── */
.terms { background: #f4f4f4; padding: 10px; border-radius: 3px; font-size: 8pt; color: #555; line-height: 1.65; margin-bottom: 6px; }

/* ── Signoff ── */
.signoff { font-weight: bold; font-size: 9pt; margin: 6px 0 4px; }

/* ── Footer ── */
.footer { display: flex; align-items: flex-end; }
.footer-col { flex: 1; font-size: 7.5pt; color: #555; line-height: 1.75; }
.ce { border: 1.5px solid #444; padding: 2px 7px; font-weight: bold; font-size: 9pt; letter-spacing: 1px; color: #444; }
</style>
</head>
<body>
<div class="wrap">

  <!-- Logo: absolute top-right -->
  ${logo ? `<img class="logo" src="${logo}" alt="Helles T\u00e4lt" />` : ''}

  <!-- Title sits directly above first divider, no extra space -->
  <div class="doc-title">${docTitle}</div>
  <hr class="div" style="margin-top:0;">

  <!-- 3. BLOCK 1: Datum + giltighet -->
  <table class="info"><tbody>${infoBlock1}</tbody></table>
  <hr class="div">

  <!-- 3. BLOCK 2: Kunduppgifter -->
  <table class="info"><tbody>${infoBlock2}</tbody></table>

  <div style="height:14px;"></div>

  ${order.items.length > 0 ? `
  <!-- ARTIKELTABELL -->
  <table class="tbl">
    <thead><tr>
      <th>Artiklar</th>
      <th class="num" style="width:38px">Antal</th>
      <th class="num" style="width:88px">\u00c0-pris</th>
      <th class="num" style="width:88px">Total</th>
    </tr></thead>
    <tbody>${articleRows}</tbody>
  </table>
  <div style="height:14px;"></div>
  ` : ''}

  <!-- TJ\u00c4NSTETABELL — alltid obligatorisk -->
  <table class="tbl">
    <thead><tr>
      <th style="width:25%">Tj\u00e4nster</th>
      <th style="width:45%">Plats</th>
      <th style="width:15%">Datum</th>
      <th class="num" style="width:15%">Tid</th>
    </tr></thead>
    <tbody>${serviceRows}</tbody>
  </table>
  <hr class="div">

  <!-- PRISSUMMERING -->
  <div class="totals-outer">
    <div class="totals-block">
      <table class="ttbl">
        <tr><td class="lbl">Total f\u00f6re moms</td><td class="num">${fmt(calc.netAmount)}</td></tr>
        <tr><td class="lbl">Moms 25&nbsp;%</td><td class="num">${fmt(calc.vatAmount)}</td></tr>
        ${discountRow}
      </table>
      <hr class="tdiv">
      <div class="grand-box">
        <span>Att betala (inkl. moms)</span>
        <span>${fmt(calc.totalAmount)}</span>
      </div>
      ${depositRows ? `<table class="ttbl">${depositRows}</table>` : ''}
    </div>
  </div>

  <!-- NOTERINGAR (yta + fritext) -->
  <div class="notes-head">NOTERINGAR</div>
  ${notesContent}
  <hr class="div">

  <!-- VILLKOR -->
  <div class="terms">
    <div>Hyresvillkor: Se bifogat hyresavtal.</div>
    <div>Betalningsvillkor: Fakturering 14 dagar med 8% dr\u00f6jsm\u00e5lsr\u00e4nta.</div>
  </div>

  <!-- SIGNOFF -->
  <div class="signoff">V\u00e4nliga h\u00e4lsningar / Best regards</div>
  <hr class="div">

  <!-- SIDF\u00d6T -->
  <div class="footer">
    <div class="footer-col">
      <div>Helles T\u00e4lt AB</div>
      <div>info@hellestalt.com</div>
      <div>Bolshedens industriv\u00e4g 38, 427 50, G\u00f6teborg</div>
    </div>
    <!-- 7. Gilbert: telefon f\u00f6re e-post -->
    <div class="footer-col">
      <div>Gilbert Persson</div>
      <div>+46 76 834 03 02</div>
      <div>gilbert@hellestalt.com</div>
    </div>
    <div><div class="ce">CE</div></div>
  </div>

</div>
<script>
  window.onload = function () { window.print(); };
</script>
</body>
</html>`;

  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    // Fallback for browsers that blocked the pre-opened window
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
}
