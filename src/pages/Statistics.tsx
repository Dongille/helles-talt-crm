import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useOrders } from '../hooks/useOrders';
import { format, parseISO, subDays, subMonths, isAfter, getMonth, getYear } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { Order } from '../types';

const GREEN = '#2d7a3a';
const BLUE  = '#3b82f6'; // regionanalys
const GRAY  = '#d1d5db';

type Period = '30d' | '3m' | '6m' | '12m' | 'all';

const PERIOD_OPTS: { value: Period; label: string }[] = [
  { value: '30d', label: 'Senaste 30 dagarna' },
  { value: '3m',  label: '3 månader' },
  { value: '6m',  label: '6 månader' },
  { value: '12m', label: '12 månader' },
  { value: 'all', label: 'Alla tider' },
];

const orderValue = (o: Order): number => {
  const sub = o.items.reduce(
    (s, i) =>
      s +
      i.quantity * i.unitPrice +
      (i.includesMontage ? i.quantity * i.montageUnitPrice : 0) +
      (i.includesDishwashing ? i.quantity * 10 : 0),
    0,
  );
  return sub * (1 - o.discountPercent / 100);
};

const fmt    = (n: number) => Math.round(n).toLocaleString('sv-SE');
const fmtPct = (n: number) => `${Math.round(n)} %`;

// ── Shared UI ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center', color: '#ccc', fontSize: 13 }}>
      Ingen data ännu
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
      <div style={{ padding: '13px 20px', borderBottom: '1px solid #f0f0f0' }}>
        <h3 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h3>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
      {items.map(({ label, color }) => (
        <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#555' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block', flexShrink: 0 }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function HBar({
  label, value, max, color = GREEN, suffix = '', labelWidth = 110,
}: {
  label: string; value: number; max: number; color?: string; suffix?: string; labelWidth?: number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{ width: labelWidth, fontSize: 12, color: '#555', flexShrink: 0, textAlign: 'right' }}>{label}</div>
      <div style={{ flex: 1, background: '#f0f0f0', borderRadius: 4, height: 16, overflow: 'hidden' }}>
        <div style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <div style={{ width: 72, fontSize: 12, fontWeight: 600, color: '#333', flexShrink: 0 }}>
        {value > 0 ? `${fmt(value)}${suffix}` : <span style={{ color: '#ddd' }}>–</span>}
      </div>
    </div>
  );
}

function DualBar({
  label, v1, v2, max, c1 = GREEN, c2 = GRAY,
}: {
  label: string; v1: number; v2: number; max: number; c1?: string; c2?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div style={{ width: 32, fontSize: 11, color: '#888', textAlign: 'right', flexShrink: 0, textTransform: 'capitalize' }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ background: '#f0f0f0', borderRadius: 3, height: 9, overflow: 'hidden' }}>
          <div style={{ width: `${max > 0 ? (v1 / max) * 100 : 0}%`, height: '100%', background: c1, borderRadius: 3 }} />
        </div>
        {v2 > 0 && (
          <div style={{ background: '#f0f0f0', borderRadius: 3, height: 9, overflow: 'hidden' }}>
            <div style={{ width: `${max > 0 ? (v2 / max) * 100 : 0}%`, height: '100%', background: c2, borderRadius: 3 }} />
          </div>
        )}
      </div>
      <div style={{ width: 28, fontSize: 11, color: '#555', flexShrink: 0, textAlign: 'right' }}>
        {v1 > 0 ? v1 : <span style={{ color: '#e8e8e8' }}>0</span>}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Statistics() {
  const { orders } = useOrders();
  const [period, setPeriod] = useState<Period>('all');

  const now = new Date();

  const cutoff = useMemo<Date | null>(() => {
    if (period === 'all') return null;
    if (period === '30d') return subDays(now, 30);
    if (period === '3m')  return subMonths(now, 3);
    if (period === '6m')  return subMonths(now, 6);
    return subMonths(now, 12);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const filtered = useMemo(() =>
    orders.filter(o => cutoff ? isAfter(parseISO(o.createdAt), cutoff) : true),
  [orders, cutoff]);

  const bookings = filtered.filter(o => o.status === 'bokning');

  // ── 1. KPI ────────────────────────────────────────────────────────────────
  const totalRequests     = filtered.length;
  const totalBookings     = bookings.length;
  const convRate          = totalRequests > 0 ? (totalBookings / totalRequests) * 100 : 0;
  const totalBookingValue = bookings.reduce((s, o) => s + orderValue(o), 0);
  const avgBookingValue   = totalBookings > 0 ? totalBookingValue / totalBookings : 0;

  const kpiCards = [
    { label: 'Förfrågningar',        value: String(totalRequests),          sub: 'totalt antal' },
    { label: 'Bokningar',            value: String(totalBookings),          sub: 'totalt antal' },
    { label: 'Ordervärde bokningar', value: `${fmt(totalBookingValue)} kr`, sub: 'exkl. moms' },
    { label: 'Snitt per bokning',    value: `${fmt(avgBookingValue)} kr`,   sub: 'exkl. moms' },
    { label: 'Konverteringsgrad',    value: fmtPct(convRate),               sub: 'förfrågan → bokning' },
  ];

  // ── 2. Månadsslots (används av konvertering & säsong) ─────────────────────
  const monthSlots = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, 11 - i);
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM', { locale: sv }) };
  });

  // ── 3. Top 10 produkter ───────────────────────────────────────────────────
  const productMap: Record<string, { name: string; category: string; count: number; revenue: number }> = {};
  bookings.forEach(o => {
    o.items.forEach(i => {
      if (!productMap[i.productId]) productMap[i.productId] = { name: i.productName, category: i.category, count: 0, revenue: 0 };
      productMap[i.productId].count += i.quantity;
      productMap[i.productId].revenue +=
        (i.quantity * i.unitPrice + (i.includesMontage ? i.quantity * i.montageUnitPrice : 0)) *
        (1 - o.discountPercent / 100);
    });
  });
  const top10        = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  const maxProdCount = Math.max(...top10.map(p => p.revenue), 1);

  // ── 4. Regionanalys ───────────────────────────────────────────────────────
  const gbgBook = bookings.filter(o => o.region === 'Göteborg');
  const skaBook = bookings.filter(o => o.region === 'Skaraborg');
  const gbgVal  = gbgBook.reduce((s, o) => s + orderValue(o), 0);
  const skaVal  = skaBook.reduce((s, o) => s + orderValue(o), 0);
  const gbgAvg  = gbgBook.length > 0 ? gbgVal / gbgBook.length : 0;
  const skaAvg  = skaBook.length > 0 ? skaVal / skaBook.length : 0;

  // ── 5. Säsongsanalys ──────────────────────────────────────────────────────
  const currentYear = getYear(now);
  const prevYear    = currentYear - 1;
  const MONTH_NAMES = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), 'MMM', { locale: sv }));

  const seasonCur  = Array<number>(12).fill(0);
  const seasonPrev = Array<number>(12).fill(0);
  bookings.forEach(o => {
    const d = parseISO(o.eventDate);
    const m = getMonth(d);
    if (getYear(d) === currentYear)   seasonCur[m]++;
    else if (getYear(d) === prevYear) seasonPrev[m]++;
  });
  const maxSeason     = Math.max(...seasonCur, ...seasonPrev, 1);
  const hasSeasonData = seasonCur.some(v => v > 0) || seasonPrev.some(v => v > 0);
  const hasPrevSeason = seasonPrev.some(v => v > 0);

  // ── 6. Förfrågningar & konvertering ──────────────────────────────────────
  const convByMonth = monthSlots.map(({ key, label }) => ({
    label,
    req:  filtered.filter(o => format(parseISO(o.createdAt), 'yyyy-MM') === key).length,
    book: bookings.filter(o => format(parseISO(o.createdAt), 'yyyy-MM') === key).length,
  }));
  const maxConv = Math.max(...convByMonth.map(m => m.req), 1);

  // ── Pill style ────────────────────────────────────────────────────────────
  const pill = (active: boolean) => ({
    padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' as const,
    fontSize: 12, fontWeight: 500 as const,
    background: active ? 'white' : 'transparent',
    color: active ? GREEN : '#666',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header & period filter ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'serif', fontSize: 26, fontWeight: 700, color: GREEN, margin: 0 }}>Statistik</h2>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Analys av bokningar och förfrågningar</p>
        </div>
        <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: 10, padding: 3, gap: 2 }}>
          {PERIOD_OPTS.map(o => (
            <button key={o.value} onClick={() => setPeriod(o.value)} style={pill(period === o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 1. KPI-kort ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {kpiCards.map(({ label, value, sub, valueColor }: { label: string; value: string; sub: string; valueColor?: string }) => (
          <div key={label} style={{ background: 'white', borderRadius: 14, border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '16px 18px' }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</p>
            <p style={{ margin: '6px 0 2px', fontSize: 22, fontWeight: 700, color: valueColor ?? '#111111' }}>{value}</p>
            <p style={{ margin: 0, fontSize: 11, color: '#bbb' }}>{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row: Top 10 + Regionanalys ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* 3. Top 10 produkter */}
        <Card title="Populäraste produkterna – topp 10">
          {top10.length === 0 ? <EmptyState /> : (
            <div>
              {top10.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: i < 3 ? GREEN : '#ccc', flexShrink: 0, textAlign: 'right' }}>
                    #{i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{p.name}</div>
                    <div style={{ background: '#f0f0f0', borderRadius: 3, height: 7 }}>
                      <div style={{ width: `${(p.revenue / maxProdCount) * 100}%`, height: '100%', background: i < 3 ? GREEN : '#9ca3af', borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#333' }}>{fmt(p.revenue)} kr</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{p.count} st</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 4. Regionanalys */}
        <Card title="Regionanalys">
          {bookings.length === 0 ? <EmptyState /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Antal bokningar</p>
                <HBar label="Göteborg"  value={gbgBook.length} max={Math.max(gbgBook.length, skaBook.length, 1)} color={GREEN} suffix=" st" />
                <HBar label="Skaraborg" value={skaBook.length} max={Math.max(gbgBook.length, skaBook.length, 1)} color={BLUE}  suffix=" st" />
              </div>
              <div>
                <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Ordervärde (kr)</p>
                <HBar label="Göteborg"  value={gbgVal} max={Math.max(gbgVal, skaVal, 1)} color={GREEN} />
                <HBar label="Skaraborg" value={skaVal} max={Math.max(gbgVal, skaVal, 1)} color={BLUE} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Gbg – snitt', value: gbgAvg, color: GREEN },
                  { label: 'Ska – snitt', value: skaAvg, color: BLUE  },
                ].map(r => (
                  <div key={r.label} style={{ background: '#f9f9f9', borderRadius: 10, padding: '12px 14px' }}>
                    <p style={{ margin: 0, fontSize: 11, color: '#aaa' }}>{r.label}</p>
                    <p style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: r.value > 0 ? r.color : '#ccc' }}>
                      {r.value > 0 ? `${fmt(r.value)} kr` : '–'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ── 5. Säsongsanalys ── */}
      <Card title="Säsongsanalys – bokningar per eventmånad">
        {!hasSeasonData ? <EmptyState /> : (
          <>
            <Legend items={[
              { label: String(currentYear), color: GREEN },
              ...(hasPrevSeason ? [{ label: String(prevYear), color: GRAY }] : []),
            ]} />
            {MONTH_NAMES.map((name, i) => (
              <DualBar
                key={name}
                label={name}
                v1={seasonCur[i]}
                v2={hasPrevSeason ? seasonPrev[i] : 0}
                max={maxSeason}
                c1={GREEN}
                c2={GRAY}
              />
            ))}
          </>
        )}
      </Card>

      {/* ── 6. Förfrågningar & konvertering ── */}
      <Card title="Förfrågningar & konvertering per månad">
        {filtered.length === 0 ? <EmptyState /> : (
          <>
            <Legend items={[
              { label: 'Förfrågningar (inkl. bokningar)', color: GRAY  },
              { label: 'Bokningar',                       color: GREEN },
            ]} />
            {convByMonth.map(m => (
              <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{ width: 30, fontSize: 11, color: '#888', textAlign: 'right', flexShrink: 0, textTransform: 'capitalize' }}>{m.label}</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ background: '#f0f0f0', borderRadius: 3, height: 9, overflow: 'hidden' }}>
                    <div style={{ width: `${(m.req / maxConv) * 100}%`, height: '100%', background: GRAY, borderRadius: 3 }} />
                  </div>
                  <div style={{ background: '#f0f0f0', borderRadius: 3, height: 9, overflow: 'hidden' }}>
                    <div style={{ width: `${(m.book / maxConv) * 100}%`, height: '100%', background: GREEN, borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ width: 28, fontSize: 11, color: '#555', flexShrink: 0, textAlign: 'right' }}>
                  {m.req > 0 ? m.req : <span style={{ color: '#e8e8e8' }}>–</span>}
                </div>
              </div>
            ))}
          </>
        )}
      </Card>

    </div>
  );
}
