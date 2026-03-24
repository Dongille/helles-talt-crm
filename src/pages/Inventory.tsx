import { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { useOrders } from '../hooks/useOrders';
import { useAppContext } from '../context/AppContext';
import { useLogbook } from '../hooks/useLogbook';
import { PRODUCTS, type ProductDefinition } from '../data/products';
import { parseISO } from 'date-fns';

// ── Mirror of the tab/subcat structure from OrderForm D ───────────────────
const TABS = ['Paketerbjudande', 'Partytält', 'Möbler', 'Festutrustning', 'Aktiviteter'] as const;
type Tab = typeof TABS[number];

const TAB_SUBCATS: Record<Tab, string[]> = {
  'Paketerbjudande': ['Enkelt paket', 'Standard paket', 'Premium paket'],
  'Partytält':       ['Semi tält', 'Pro tält', 'Sektionstält', 'Pagodatält', 'Pop-up tält'],
  'Möbler':          ['Sittplatser', 'Bord', 'Textiler'],
  'Festutrustning':  ['Festutrustning', 'Porslin'],
  'Aktiviteter':     [],
};

const PARTYTÄLT_SUBCAT: Record<string, string> = {
  'Partytält Semi': 'Semi tält',
  'Partytält Pro':  'Pro tält',
  'Sektionstält':   'Sektionstält',
  'Pagodatält':     'Pagodatält',
  'Pop-up tält':    'Pop-up tält',
};

function getGroup(p: ProductDefinition): { tab: Tab; subcat: string } {
  if (p.category === 'Paketerbjudanden')
    return { tab: 'Paketerbjudande', subcat: p.name.split(' ')[0] + ' paket' };
  if (p.category === 'Partytält')
    return { tab: 'Partytält', subcat: PARTYTÄLT_SUBCAT[p.subcategory ?? ''] ?? '' };
  if (p.category === 'Möbler – Stolar & Bänkset') return { tab: 'Möbler', subcat: 'Sittplatser' };
  if (p.category === 'Möbler – Bord & Ståbord')   return { tab: 'Möbler', subcat: 'Bord' };
  if (p.category === 'Möbler – Dukar & Överdrag')  return { tab: 'Möbler', subcat: 'Textiler' };
  if (p.category === 'Porslin & Bestick')           return { tab: 'Festutrustning', subcat: 'Porslin' };
  if (p.category === 'Festutrustning & Övrigt')     return { tab: 'Festutrustning', subcat: 'Festutrustning' };
  return { tab: 'Aktiviteter', subcat: '' };
}

function getVisibleProducts(tab: Tab, subcat: string): ProductDefinition[] {
  return PRODUCTS.filter(p => {
    const g = getGroup(p);
    if (g.tab !== tab) return false;
    if (TAB_SUBCATS[tab].length === 0) return true; // Aktiviteter – alla
    return g.subcat === subcat;
  });
}

const GREEN = '#2d7a3a';
const ACCENT_LIGHT = '#f0f7f1';

export default function Inventory() {
  const { inventory, updateInventoryItem } = useInventory();
  const { orders } = useOrders();
  const { region } = useAppContext();
  const { addEntry } = useLogbook();
  const [activeTab, setActiveTab]     = useState<Tab>('Paketerbjudande');
  const [activeSubcat, setActiveSubcat] = useState<Record<string, string>>({
    Paketerbjudande: 'Enkelt paket',
    Partytält:       'Semi tält',
    Möbler:          'Sittplatser',
    Festutrustning:  'Festutrustning',
  });
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const currentSubcat = activeSubcat[activeTab] ?? TAB_SUBCATS[activeTab][0] ?? '';
  const visibleProducts = getVisibleProducts(activeTab, currentSubcat);

  // Premium packages implicitly include chairs + tables – deduct them from inventory
  const PREMIUM_IMPLICIT: Record<string, Record<string, number>> = {
    'pak-4x6-premium':  { 'stol-klapp-svart': 36, 'bord-180': 6 },
    'pak-4x8-premium':  { 'stol-klapp-svart': 48, 'bord-180': 8 },
    'pak-4x10-premium': { 'stol-klapp-svart': 60, 'bord-180': 10 },
  };

  const getBooked = (productId: string, rgn: 'Göteborg' | 'Skaraborg') => {
    const filterStart = dateFrom ? parseISO(dateFrom) : null;
    const filterEnd   = dateTo   ? parseISO(dateTo)   : null;

    const filtered = orders.filter(o => {
      if (o.status !== 'bokning' || o.region !== rgn) return false;
      if (filterStart || filterEnd) {
        // Booking period: deliveryDate → pickupDate (covers entire rental period)
        // Fall back to eventDate if dates are missing
        const bookingStart = o.deliveryDate ? parseISO(o.deliveryDate) : parseISO(o.eventDate);
        const bookingEnd   = o.pickupDate   ? parseISO(o.pickupDate)   : (o.deliveryDate ? parseISO(o.deliveryDate) : parseISO(o.eventDate));
        // Overlap check: booking active if bookingStart <= filterEnd AND bookingEnd >= filterStart
        if (filterEnd   && bookingStart > filterEnd)   return false;
        if (filterStart && bookingEnd   < filterStart) return false;
      }
      return true;
    });

    return filtered.reduce((sum, o) => {
      // Direct line-item quantity
      const direct = o.items.find(i => i.productId === productId)?.quantity ?? 0;

      // Implicit quantity from Premium packages
      const implicit = o.items.reduce((s, item) => {
        const rule = PREMIUM_IMPLICIT[item.productId];
        return s + (rule?.[productId] ?? 0) * item.quantity;
      }, 0);

      return sum + direct + implicit;
    }, 0);
  };

  const getQty = (productId: string) => {
    const inv = inventory.find(i => i.productId === productId);
    return { gbg: inv?.quantityGoteborg ?? 0, ska: inv?.quantitySkaraborg ?? 0 };
  };

  const handleUpdateInventory = (
    product: ProductDefinition,
    updates: { quantityGoteborg?: number; quantitySkaraborg?: number },
    editRegion: 'Göteborg' | 'Skaraborg',
  ) => {
    const { gbg, ska } = getQty(product.id);
    const bookedGbg = getBooked(product.id, 'Göteborg');
    const bookedSka = getBooked(product.id, 'Skaraborg');

    const oldStock  = editRegion === 'Göteborg' ? gbg : ska;
    const oldBooked = editRegion === 'Göteborg' ? bookedGbg : bookedSka;
    const oldAvail  = oldStock - oldBooked;

    const newStock  = editRegion === 'Göteborg' ? (updates.quantityGoteborg ?? gbg) : (updates.quantitySkaraborg ?? ska);
    const newBooked = editRegion === 'Göteborg' ? bookedGbg : bookedSka;
    const newAvail  = newStock - newBooked;

    updateInventoryItem(product.id, updates);

    if (oldAvail > 0 && newAvail <= 0) {
      addEntry({ productId: product.id, productName: product.name, category: product.category, region: editRegion, available: newAvail, type: 'shortage' });
    } else if (oldAvail <= 0 && newAvail > 0) {
      addEntry({ productId: product.id, productName: product.name, category: product.category, region: editRegion, available: newAvail, type: 'resolved' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header + date filter */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'serif', fontSize: 26, fontWeight: 700, color: GREEN, margin: 0 }}>Inventering</h2>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Lagerhantering och tillgänglighet</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Bokningar fr.o.m.</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: '6px 12px', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#666', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.4px' }}>t.o.m.</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: '6px 12px', fontSize: 13 }} />
          </div>
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: 'white', fontSize: 13, color: '#666', cursor: 'pointer' }}>
              Rensa
            </button>
          )}
        </div>
      </div>

      {/* Main card */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', overflow: 'hidden' }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', padding: '0 4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '12px 6px', border: 'none', background: 'transparent', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: activeTab === tab ? GREEN : '#666',
                borderBottom: activeTab === tab ? `2px solid ${GREEN}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Subcategory pills */}
        {TAB_SUBCATS[activeTab].length > 0 && (
          <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderBottom: '1px solid #f0f0f0', overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'nowrap' }}>
            {TAB_SUBCATS[activeTab].map(sub => {
              const isActive = currentSubcat === sub;
              return (
                <button key={sub}
                  onClick={() => setActiveSubcat(prev => ({ ...prev, [activeTab]: sub }))}
                  style={{
                    padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    background: isActive ? GREEN : 'white',
                    color: isActive ? 'white' : '#555',
                    border: isActive ? `1px solid ${GREEN}` : '1px solid #e5e5e5',
                    transition: 'all 0.15s',
                  }}>
                  {sub}
                </button>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #f0f0f0' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Artikel</th>
                {region === 'Alla' ? (
                  <>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total lagerhållning</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bokade totalt</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tillgängliga totalt</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{region}</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bokade</th>
                    <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tillgängliga</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {visibleProducts.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: '#bbb' }}>Inga produkter i denna kategori</td></tr>
              ) : visibleProducts.map((product, idx) => {
                const { gbg, ska } = getQty(product.id);
                const bookedGbg = getBooked(product.id, 'Göteborg');
                const bookedSka = getBooked(product.id, 'Skaraborg');

                // Black when stock=0 (nothing entered yet), red only when real shortage
                const availColor = (avail: number, total: number, bkd: number) =>
                  total === 0 && bkd === 0 ? '#111111' :
                  avail <= 0 ? '#ef4444' :
                  total > 0 && avail / total >= 0.25 ? '#2d7a3a' : '#e8820c';

                const rowBg = idx % 2 === 0 ? 'white' : '#fafafa';

                // Compute region-specific values
                const stock  = region === 'Göteborg' ? gbg : region === 'Skaraborg' ? ska : gbg + ska;
                const booked = region === 'Göteborg' ? bookedGbg : region === 'Skaraborg' ? bookedSka : bookedGbg + bookedSka;
                const avail  = stock - booked;

                return (
                  <tr key={product.id} style={{ background: rowBg, borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1a1a1a' }}>{product.name}</td>

                    {/* Stock cell — editable input for single region, read-only total for "Alla" */}
                    {region === 'Alla' ? (
                      <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 600, color: '#444' }}>{stock}</td>
                    ) : (
                      <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                        <input type="number" min="0"
                          value={region === 'Göteborg' ? gbg : ska}
                          onChange={e => {
                            const rgn = region as 'Göteborg' | 'Skaraborg';
                            const val = parseInt(e.target.value) || 0;
                            handleUpdateInventory(
                              product,
                              rgn === 'Göteborg' ? { quantityGoteborg: val } : { quantitySkaraborg: val },
                              rgn,
                            );
                          }}
                          style={{ width: 64, textAlign: 'center', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 6px', fontSize: 13, outline: 'none' }}
                          onFocus={e => (e.target.style.borderColor = GREEN)}
                          onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
                        />
                      </td>
                    )}

                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#111111', fontWeight: 500 }}>{booked}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: availColor(avail, stock, booked) }}>{avail}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        {(() => {
          return (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', background: ACCENT_LIGHT, display: 'flex', alignItems: 'center', gap: 20, fontSize: 12, color: '#555', flexWrap: 'wrap' }}>
              <span><strong style={{ color: '#111111' }}>{visibleProducts.length}</strong> artiklar</span>
              <span style={{ width: 1, height: 12, background: '#d0d0d0', display: 'inline-block' }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#2d7a3a', display: 'inline-block', flexShrink: 0 }} />
                25% eller mer
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#e8820c', display: 'inline-block', flexShrink: 0 }} />
                25% eller mindre
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#ef4444', display: 'inline-block', flexShrink: 0 }} />
                0%
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
