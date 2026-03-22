import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Order, OrderItem } from '../../types';
import { PRODUCTS } from '../../data/products';
import { calculateOrder, formatSEK } from '../../utils/calculations';
import { X, Plus, Minus } from 'lucide-react';

const TABS = ['Paketerbjudande', 'Partytält', 'Möbler', 'Festutrustning', 'Aktiviteter'] as const;
type Tab = typeof TABS[number];

const TAB_SUBCATS: Record<Tab, string[]> = {
  'Paketerbjudande': ['Enkelt paket', 'Standard paket', 'Premium paket'],
  'Partytält': ['Semi tält', 'Pro tält', 'Sektionstält', 'Pagodatält', 'Pop-up tält'],
  'Möbler': ['Sittplatser', 'Bord', 'Textiler'],
  'Festutrustning': ['Festutrustning', 'Porslin'],
  'Aktiviteter': [],
};

const MÖBLER_CAT: Record<string, string> = {
  'Sittplatser': 'Möbler – Stolar & Bänkset',
  'Bord':        'Möbler – Bord & Ståbord',
  'Textiler':    'Möbler – Dukar & Överdrag',
};

const PORSLIN_SUBCOMPONENTS = [
  'Förrättstallrik',
  'Varmrättstallrik',
  'Efterrättstallrik',
  'Kniv',
  'Gaffel',
  'Tesked',
  'Vattenglas',
  'Ölglas',
  'Vinglas',
  'Bubbelglas',
  'Kaffekopp',
] as const;

const PARTYTÄLT_SUBCAT_MAP: Record<string, string> = {
  'Semi tält':   'Partytält Semi',
  'Pro tält':    'Partytält Pro',
  'Sektionstält':'Sektionstält',
  'Pagodatält':  'Pagodatält',
  'Pop-up tält': 'Pop-up tält',
};

function getTabProducts(tab: Tab, subcat: string) {
  if (tab === 'Paketerbjudande') {
    const tier = subcat.split(' ')[0].toLowerCase(); // 'enkelt' | 'standard' | 'premium'
    return PRODUCTS.filter(p => p.category === 'Paketerbjudanden' && p.name.toLowerCase().startsWith(tier));
  }
  if (tab === 'Partytält') return PRODUCTS.filter(p => p.category === 'Partytält' && p.subcategory === PARTYTÄLT_SUBCAT_MAP[subcat]);
  if (tab === 'Möbler') return PRODUCTS.filter(p => p.category === MÖBLER_CAT[subcat]);
  if (tab === 'Festutrustning') {
    if (subcat === 'Porslin') return PRODUCTS.filter(p => p.category === 'Porslin & Bestick');
    return PRODUCTS.filter(p => p.category === 'Festutrustning & Övrigt');
  }
  return [];
}

const TAB_CATS: Record<Tab, string[]> = {
  'Paketerbjudande': ['Paketerbjudanden'],
  'Partytält': ['Partytält'],
  'Möbler': ['Möbler – Stolar & Bänkset', 'Möbler – Bord & Ståbord', 'Möbler – Dukar & Överdrag', 'Porslin & Bestick'],
  'Festutrustning': ['Festutrustning & Övrigt'],
  'Aktiviteter': [],
};

interface OrderFormProps {
  order?: Order;
  initialStatus?: 'förfrågan' | 'bokning';
  lockedStatus?: 'förfrågan' | 'bokning';
  onSave: (order: Order) => void;
  onClose: () => void;
}

const emptyOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = {
  status: 'förfrågan',
  region: 'Göteborg',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  postalCode: '',
  city: '',
  groundType: 'Ej angivet',
  eventDate: '',
  deliveryDate: '',
  pickupDate: '',
  deliveryTime: '',
  pickupTime: '',
  selfPickup: false,
  items: [],
  discountPercent: 0,
  depositPaid: false,
  depositAmount: 0,
  notes: '',
  quotePdfGenerated: false,
  confirmationPdfGenerated: false,
  quoteValidityDays: 14,
  quoteValidityCustomDate: '',
};

export default function OrderForm({ order, initialStatus, lockedStatus, onSave, onClose }: OrderFormProps) {
  const [form, setForm] = useState<Omit<Order, 'id' | 'createdAt' | 'updatedAt'>>(
    order ? { ...order } : { ...emptyOrder, ...(initialStatus ? { status: initialStatus } : {}) }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Tab>('Paketerbjudande');
  const [activeSubcat, setActiveSubcat] = useState<Record<string, string>>({
    Paketerbjudande: 'Enkelt paket',
    Partytält: 'Semi tält',
    Möbler: 'Sittplatser',
    Festutrustning: 'Festutrustning',
  });

  const accent = lockedStatus === 'förfrågan' ? '#e8820c' : '#2d7a3a';
  const accentLight = lockedStatus === 'förfrågan' ? '#fff4eb' : '#f0f7f2';
  const accentBorder = lockedStatus === 'förfrågan' ? '#fde0c4' : '#e0ede3';

  const montageLabel = (_category: string) => 'Montage';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstName) errs.firstName = 'Obligatoriskt';
    if (!form.lastName) errs.lastName = 'Obligatoriskt';
    if (!form.phone) errs.phone = 'Obligatoriskt';
    if (!form.email) errs.email = 'Obligatoriskt';
    if (!form.address) errs.address = 'Obligatoriskt';
    if (!form.postalCode) errs.postalCode = 'Obligatoriskt';
    if (!form.city) errs.city = 'Obligatoriskt';
    if (!form.eventDate) errs.eventDate = 'Obligatoriskt';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getItemForProduct = (productId: string) =>
    form.items.find(i => i.productId === productId);

  const setItemQuantity = (productId: string, qty: number) => {
    const product = PRODUCTS.find(p => p.id === productId)!;
    if (qty <= 0) {
      setForm(prev => ({ ...prev, items: prev.items.filter(i => i.productId !== productId) }));
      return;
    }
    setForm(prev => {
      const existing = prev.items.find(i => i.productId === productId);
      if (existing) {
        return { ...prev, items: prev.items.map(i => i.productId === productId ? { ...i, quantity: qty } : i) };
      }
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        category: product.category,
        quantity: qty,
        unitPrice: product.basePrice === 'offert' ? 0 : product.basePrice,
        includesMontage: false,
        montageUnitPrice: product.montagePrice === 'offert' ? 0 : (product.montagePrice as number),
        isOffertPrice: product.basePrice === 'offert',
      };
      return { ...prev, items: [...prev.items, newItem] };
    });
  };

  const updateItem = (productId: string, updates: Partial<OrderItem>) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.productId === productId ? { ...i, ...updates } : i),
    }));
  };

  const handleSave = (saveAsStatus: 'förfrågan' | 'bokning') => {
    if (!validate()) return;
    const now = new Date().toISOString();
    const saved: Order = {
      ...form,
      id: order?.id ?? uuidv4(),
      status: saveAsStatus,
      createdAt: order?.createdAt ?? now,
      updatedAt: now,
      quotePdfGenerated: saveAsStatus === 'förfrågan' ? true : form.quotePdfGenerated,
      confirmationPdfGenerated: saveAsStatus === 'bokning' ? true : form.confirmationPdfGenerated,
    };
    onSave(saved);
  };

  const calc = calculateOrder(form);

  const inputCls = (field: string) =>
    `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a3a] ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`;

  const title = order
    ? 'Redigera förfrågan/bokning'
    : lockedStatus === 'förfrågan'
    ? 'Ny förfrågan'
    : lockedStatus === 'bokning'
    ? 'Ny bokning'
    : 'Ny förfrågan / bokning';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center sm:pt-4 sm:pb-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#f8f7f4] w-full max-w-5xl sm:rounded-2xl shadow-2xl sm:mx-4 min-h-screen sm:min-h-0" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="text-white px-6 py-4 rounded-t-2xl flex items-center justify-between" style={{ background: accent }}>
          <h2 className="font-serif text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sektion A */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: accent }}>A – Status & Region</h3>
            <div className={`grid gap-6 ${lockedStatus ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {!lockedStatus && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                  <div className="flex gap-3">
                    {(['förfrågan', 'bokning'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => set('status', s)}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium border-2 transition-colors ${
                          form.status === s
                            ? s === 'bokning'
                              ? 'bg-[#2d7a3a] text-white border-[#2d7a3a]'
                              : 'bg-amber-500 text-white border-amber-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {s === 'förfrågan' ? 'Förfrågan' : 'Bokning'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Region</label>
                <div className="flex gap-3">
                  {(['Göteborg', 'Skaraborg'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => set('region', r)}
                      className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border-2 transition-colors"
                      style={
                        form.region === r
                          ? { background: accent, color: 'white', borderColor: accent }
                          : { background: 'white', color: '#4b5563', borderColor: '#e5e7eb' }
                      }
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Sektion B */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: accent }}>B – Kundinformation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Förnamn *</label>
                <input className={inputCls('firstName')} value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Efternamn *</label>
                <input className={inputCls('lastName')} value={form.lastName} onChange={e => set('lastName', e.target.value)} />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Telefon *</label>
                <input type="tel" className={inputCls('phone')} value={form.phone} onChange={e => set('phone', e.target.value)} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">E-post *</label>
                <input type="email" className={inputCls('email')} value={form.email} onChange={e => set('email', e.target.value)} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Leveransadress *</label>
                <input className={inputCls('address')} value={form.address} onChange={e => set('address', e.target.value)} />
                {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Postnummer *</label>
                <input className={inputCls('postalCode')} value={form.postalCode} onChange={e => set('postalCode', e.target.value)} />
                {errors.postalCode && <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Ort *</label>
                <input className={inputCls('city')} value={form.city} onChange={e => set('city', e.target.value)} />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
            </div>
          </section>

          {/* Sektion C */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: accent }}>C – Datum & Leverans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Eventdatum *</label>
                <input type="date" className={inputCls('eventDate')} value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
                {errors.eventDate && <p className="text-xs text-red-500 mt-1">{errors.eventDate}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {form.selfPickup ? 'Hämtningsdatum & tid' : 'Leveransdatum & tid'}
                </label>
                <div className="flex gap-2">
                  <input type="date" className={inputCls('deliveryDate')} value={form.deliveryDate ?? ''} onChange={e => set('deliveryDate', e.target.value || null)} />
                  <input type="time" className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a3a] w-28" value={form.deliveryTime ?? ''} onChange={e => set('deliveryTime', e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  {form.selfPickup ? 'Återlämningsdatum & tid' : 'Hämtningsdatum & tid'}
                </label>
                <div className="flex gap-2">
                  <input type="date" className={inputCls('pickupDate')} value={form.pickupDate ?? ''} onChange={e => set('pickupDate', e.target.value || null)} />
                  <input type="time" className="border border-gray-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a3a] w-28" value={form.pickupTime ?? ''} onChange={e => set('pickupTime', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 mb-2 block">Leveranssätt</label>
              <div className="flex gap-3">
                {[
                  { val: false, label: 'Vi levererar & hämtar' },
                  { val: true, label: 'Kunden hämtar & återlämnar själv' },
                ].map(({ val, label }) => (
                  <button
                    key={String(val)}
                    onClick={() => set('selfPickup', val)}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-medium border-2 transition-colors"
                    style={
                      form.selfPickup === val
                        ? { background: accent, color: 'white', borderColor: accent }
                        : { background: 'white', color: '#4b5563', borderColor: '#e5e7eb' }
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {form.status === 'förfrågan' && (
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">Offertens giltighet</label>
                <div className="flex items-center gap-3">
                  <select
                    value={form.quoteValidityDays ?? 14}
                    onChange={e => set('quoteValidityDays', e.target.value === 'custom' ? 'custom' : parseInt(e.target.value))}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]"
                  >
                    <option value={7}>7 dagar</option>
                    <option value={14}>14 dagar (standard)</option>
                    <option value={30}>30 dagar</option>
                    <option value={60}>60 dagar</option>
                    <option value="custom">Anpassat datum</option>
                  </select>
                  {form.quoteValidityDays === 'custom' && (
                    <input
                      type="date"
                      value={form.quoteValidityCustomDate ?? ''}
                      onChange={e => set('quoteValidityCustomDate', e.target.value)}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a3a]"
                    />
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Sektion D – Produktval */}
          <section className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: accent }}>D – Produktval</h3>
              {/* Tab bar */}
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div style={{ display: 'flex', gap: 3, background: 'white', border: '1px solid #e5e5e5', borderRadius: 8, padding: 3, minWidth: 'max-content' }}>
                {TABS.map(tab => {
                  const count = form.items.filter(i => {
                    const p = PRODUCTS.find(p => p.id === i.productId);
                    return p && TAB_CATS[tab].includes(p.category);
                  }).reduce((s, i) => s + i.quantity, 0);
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{ flex: 1, padding: '6px 4px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: activeTab === tab ? accent : 'transparent', color: activeTab === tab ? 'white' : '#555', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {tab}{count > 0 ? ` (${count})` : ''}
                    </button>
                  );
                })}
              </div>
              </div>
            </div>{/* end px-5 pt-5 pb-3 */}

            {/* Subcategory pills */}
            {TAB_SUBCATS[activeTab].length > 0 && (
              <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', flexWrap: 'nowrap' }}>
                {TAB_SUBCATS[activeTab].map(sub => {
                  const isActive = (activeSubcat[activeTab] ?? TAB_SUBCATS[activeTab][0]) === sub;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveSubcat(prev => ({ ...prev, [activeTab]: sub }))}
                      style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: isActive ? accent : 'white', color: isActive ? 'white' : '#555', border: isActive ? `1px solid ${accent}` : '1px solid #e5e5e5', transition: 'all 0.15s' }}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', padding: '6px 20px', background: '#f9f9f9', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0', fontSize: 11, color: '#999', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              <span>Produkt</span>
              <span style={{ textAlign: 'right' }}>Pris</span>
              <span style={{ textAlign: 'right' }}>Antal</span>
            </div>

            {/* Product rows */}
            <div>
              {(() => {
                const currentSubcat = activeSubcat[activeTab] ?? TAB_SUBCATS[activeTab][0] ?? '';
                const visibleProducts = getTabProducts(activeTab, currentSubcat);
                if (visibleProducts.length === 0) {
                  return <div style={{ padding: '24px 20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>Inga produkter i denna kategori ännu</div>;
                }
                return visibleProducts.map(product => {
                  const item = getItemForProduct(product.id);
                  const qty = item?.quantity ?? 0;
                  const hasOptions = qty > 0 && (product.basePrice === 'offert' || product.hasMontage || product.hasColorVariant || product.hasDishwashing);
                  return (
                    <div key={product.id}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px', padding: '9px 20px', background: qty > 0 ? accentLight : 'white', borderBottom: '1px solid #f0f0f0', alignItems: 'center', gap: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{product.name}</p>
                          {product.unit && <p style={{ fontSize: 11, color: '#999', margin: 0 }}>per {product.unit}</p>}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 13, color: '#555' }}>
                          {product.basePrice === 'offert' ? <span style={{ color: '#f59e0b', fontSize: 11 }}>Offert</span> : `${product.basePrice} kr`}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <button onClick={() => setItemQuantity(product.id, qty - 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={11} /></button>
                          <span style={{ width: 22, textAlign: 'center', fontSize: 13, fontWeight: 500 }}>{qty}</span>
                          <button onClick={() => setItemQuantity(product.id, qty + 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={11} /></button>
                        </div>
                      </div>
                      {hasOptions && (
                        <div style={{ background: accentLight, padding: '6px 20px 10px', borderBottom: '1px solid #f0f0f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                            {product.basePrice === 'offert' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <label style={{ fontSize: 12, color: '#555' }}>Pris (kr):</label>
                                <input type="number" min="0" value={item?.unitPrice ?? 0} onChange={e => updateItem(product.id, { unitPrice: parseFloat(e.target.value) || 0 })} style={{ width: 80, border: '1px solid #f59e0b', borderRadius: 6, padding: '3px 8px', fontSize: 12 }} />
                              </div>
                            )}
                            {product.hasMontage && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
                                <input type="checkbox" checked={item?.includesMontage ?? false} onChange={e => updateItem(product.id, { includesMontage: e.target.checked })} />
                                + {montageLabel(product.category)}{product.montagePrice !== 'offert' ? ` (${product.montagePrice} kr/st)` : ''}
                              </label>
                            )}
                            {product.hasDishwashing && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', cursor: 'pointer' }}>
                                <input type="checkbox" checked={item?.includesDishwashing ?? false} onChange={e => updateItem(product.id, { includesDishwashing: e.target.checked })} />
                                + Diskning (10 kr/st)
                              </label>
                            )}
                            {product.hasColorVariant && (
                              <select value={item?.colorVariant ?? 'Vit'} onChange={e => updateItem(product.id, { colorVariant: e.target.value as 'Vit' | 'Svart' })} style={{ border: '1px solid #e0e0e0', borderRadius: 6, padding: '3px 8px', fontSize: 12 }}>
                                <option value="Vit">Vit</option>
                                <option value="Svart">Svart</option>
                              </select>
                            )}
                          </div>
                          {product.isCustomPorslin && (
                            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: 8 }}>
                              <p style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Ingående delar</p>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px' }}>
                                {PORSLIN_SUBCOMPONENTS.map(label => {
                                  const subQty = item?.subComponents?.[label] ?? 0;
                                  return (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                      <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <button onClick={() => updateItem(product.id, { subComponents: { ...(item?.subComponents ?? {}), [label]: Math.max(0, subQty - 1) } })} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={9} /></button>
                                        <span style={{ width: 24, textAlign: 'center', fontSize: 12, fontWeight: 500 }}>{subQty}</span>
                                        <button onClick={() => updateItem(product.id, { subComponents: { ...(item?.subComponents ?? {}), [label]: subQty + 1 } })} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={9} /></button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Summary row */}
            <div style={{ background: accentLight, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${accentBorder}` }}>
              <span style={{ fontSize: 13, color: '#555' }}>Valda produkter: {form.items.reduce((s, i) => s + i.quantity, 0)} st</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>Delsumma: {formatSEK(calc.subtotal)}</span>
            </div>
          </section>

          {/* Sektion E – Prissammanställning */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: accent }}>E – Prissammanställning</h3>
            <div className="w-full sm:max-w-md sm:ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delsumma (exkl. moms)</span>
                <span className="font-medium">{formatSEK(calc.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Rabatt</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discountPercent}
                    onChange={e => set('discountPercent', parseFloat(e.target.value) || 0)}
                    className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <span className="font-medium text-red-600">- {formatSEK(calc.discountAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ordervärde exkl. moms</span>
                <span className="font-medium">{formatSEK(calc.netAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Moms (25%)</span>
                <span className="font-medium">{formatSEK(calc.vatAmount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold text-base">ATT BETALA (inkl. moms)</span>
                <span className="font-bold text-base" style={{ color: accent }}>{formatSEK(calc.totalAmount)}</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.depositPaid}
                  onChange={e => set('depositPaid', e.target.checked)}
                  className="rounded border-gray-300 text-[#2d7a3a]"
                />
                <span className="text-sm font-medium">Kunden har betalat förskott</span>
              </label>
              {form.depositPaid && (
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-gray-600">Förskottsbelopp (kr)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.depositAmount}
                    onChange={e => set('depositAmount', parseFloat(e.target.value) || 0)}
                    className="w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                  />
                </div>
              )}
              {form.depositPaid && (
                <p className="mt-2 text-sm font-semibold" style={{ color: accent }}>
                  Kvar att betala: {formatSEK(calc.remainingAmount)}
                </p>
              )}
            </div>
          </section>

          {/* Sektion F – Noteringar */}
          <section className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: accent }}>F – Noteringar</h3>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Yta vid montage av tält</label>
              <select className={inputCls('groundType')} value={form.groundType} onChange={e => set('groundType', e.target.value as Order['groundType'])}>
                {['Ej angivet', 'Gräs', 'Altan', 'Grus', 'Asfalt', 'Inomhus'].map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={4}
              placeholder="Skriv noteringar..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2d7a3a] resize-none"
            />
          </section>

          {/* Sektion G – Åtgärder */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-3 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              style={{ minHeight: 44 }}
            >
              Avbryt
            </button>
            {(!lockedStatus || lockedStatus === 'förfrågan') && (
              <button
                onClick={() => handleSave('förfrågan')}
                className="flex-1 py-3 text-sm font-semibold bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
              >
                Spara som offert
              </button>
            )}
            {(!lockedStatus || lockedStatus === 'bokning') && (
              <button
                onClick={() => handleSave('bokning')}
                className="flex-1 py-3 text-sm font-semibold bg-[#2d7a3a] text-white rounded-xl hover:bg-[#2d6b47] transition-colors"
              >
                Spara som bokningsbekräftelse
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
