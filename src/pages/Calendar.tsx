import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useReminders } from '../hooks/useReminders';
import { useStaff } from '../hooks/useStaff';
import { useAppContext } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Truck, Package, Star, FileText, Bell, Users } from 'lucide-react';
import type { Order } from '../types';
import { generateAndPrint } from '../components/PdfGenerator/generateHtml';
import { resolveDisplayName } from '../utils/legacyProductMapping';

export default function Calendar() {
  const { orders, isLoading, fetchError } = useOrders();
  const { reminders } = useReminders();
  const { staff, schedules } = useStaff();
  const { region } = useAppContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showEvents, setShowEvents] = useState(true);

  const filtered = orders.filter(o => o.status === 'bokning' && (region === 'Alla' || o.region === region));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
  const days       = eachDayOfInterval({ start: calStart, end: calEnd });

  const getRemindersForDay = (day: Date) =>
    reminders.filter(r => r.status === 'aktiv' && r.reminderDate === format(day, 'yyyy-MM-dd'));

  const getSchedulesForDay = (day: Date) =>
    schedules.filter(s => s.scheduleDate === format(day, 'yyyy-MM-dd'));

  const getEventsForDay = (day: Date) => {
    const deliveries      = filtered.filter(o => o.deliveryDate && isSameDay(parseISO(o.deliveryDate), day) && !o.selfPickup);
    const pickups         = filtered.filter(o => o.pickupDate   && isSameDay(parseISO(o.pickupDate),   day) && !o.selfPickup);
    // All events (blue) regardless of self-pickup
    const events          = showEvents ? filtered.filter(o => isSameDay(parseISO(o.eventDate), day)) : [];
    // Gray: self-pickup delivery/return dates
    const selfDeliveries  = filtered.filter(o => o.deliveryDate && isSameDay(parseISO(o.deliveryDate), day) &&  o.selfPickup);
    const selfReturns     = filtered.filter(o => o.pickupDate   && isSameDay(parseISO(o.pickupDate),   day) &&  o.selfPickup);
    return { deliveries, pickups, events, selfDeliveries, selfReturns };
  };

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay) : null;

  const weekdays = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

  // ── Loading / error states ───────────────────────────────────────────────
  if (isLoading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e5e5e5', borderTopColor: '#2d7a3a', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ fontSize: 13, color: '#888' }}>Hämtar bokningar från databasen…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (fetchError) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '20px 24px', maxWidth: 560 }}>
      <p style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>Kunde inte hämta data</p>
      <p style={{ fontSize: 13, color: '#b91c1c' }}>{fetchError}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-bold text-[#2d7a3a]">Kalender</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={e => setShowEvents(e.target.checked)}
              className="rounded border-gray-300 text-[#2d7a3a]"
            />
            Visa eventdatum
          </label>
          <button onClick={() => setCurrentMonth(new Date())} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Idag
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-sm font-semibold capitalize w-36 text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: sv })}
            </span>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Leverans</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Hämtning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#9ca3af' }} />
          <span>Kund hämtning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#9ca3af' }} />
          <span>Kund återlämning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: '#9333ea' }} />
          <span>Påminnelse</span>
        </div>
      </div>

      <div className={`grid gap-5 ${selectedDay ? 'grid-cols-1 lg:grid-cols-[1fr_300px]' : 'grid-cols-1'}`}>
        {/* Calendar grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden overflow-x-auto">
          <div style={{ minWidth: 360 }}>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {weekdays.map(d => (
                <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(day => {
                const { deliveries, pickups, events, selfDeliveries, selfReturns } = getEventsForDay(day);
                const dayReminders = getRemindersForDay(day);
                const total     = deliveries.length + pickups.length + events.length + selfDeliveries.length + selfReturns.length + dayReminders.length;
                // Count how many chips are actually rendered (1 per non-empty category)
                const shownChips = (deliveries.length > 0 ? 1 : 0) + (pickups.length > 0 ? 1 : 0) + (events.length > 0 ? 1 : 0) + (selfDeliveries.length > 0 ? 1 : 0) + (selfReturns.length > 0 ? 1 : 0) + (dayReminders.length > 0 ? 1 : 0);
                const overflow  = total - shownChips;
                const inMonth = isSameMonth(day, currentMonth);
                const today   = isToday(day);
                const selected = selectedDay && isSameDay(day, selectedDay);
                return (
                  <div
                    key={day.toString()}
                    onClick={() => setSelectedDay(selected ? null : day)}
                    className={`min-h-[88px] p-2 border-b border-r border-gray-50 cursor-pointer transition-colors ${
                      !inMonth ? 'bg-gray-50/50' : 'hover:bg-gray-50'
                    } ${selected ? 'bg-[#2d7a3a]/5 ring-2 ring-inset ring-[#2d7a3a]' : ''}`}
                  >
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1 ${
                      today ? 'bg-[#2d7a3a] text-white' : !inMonth ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-0.5">
                      {deliveries.slice(0, 1).map(o => (
                        <div key={o.id} className="text-[10px] bg-green-100 text-green-800 rounded px-1 py-0.5 truncate flex items-center gap-1">
                          <Truck size={8} className="flex-shrink-0" />
                          {o.lastName}
                        </div>
                      ))}
                      {pickups.slice(0, 1).map(o => (
                        <div key={o.id} className="text-[10px] bg-orange-100 text-orange-800 rounded px-1 py-0.5 truncate flex items-center gap-1">
                          <Package size={8} className="flex-shrink-0" />
                          {o.lastName}
                        </div>
                      ))}
                      {events.slice(0, 1).map(o => (
                        <div key={o.id} className="text-[10px] bg-blue-100 text-blue-800 rounded px-1 py-0.5 truncate flex items-center gap-1">
                          <Star size={8} className="flex-shrink-0" />
                          {o.lastName}
                        </div>
                      ))}
                      {selfDeliveries.slice(0, 1).map(o => (
                        <div key={o.id} className="text-[10px] rounded px-1 py-0.5 truncate flex items-center gap-1" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                          <Truck size={8} className="flex-shrink-0" />
                          {o.lastName}
                        </div>
                      ))}
                      {selfReturns.slice(0, 1).map(o => (
                        <div key={o.id} className="text-[10px] rounded px-1 py-0.5 truncate flex items-center gap-1" style={{ background: '#f3f4f6', color: '#6b7280' }}>
                          <Package size={8} className="flex-shrink-0" />
                          {o.lastName}
                        </div>
                      ))}
                      {dayReminders.slice(0, 1).map(r => (
                        <div key={r.id} className="text-[10px] rounded px-1 py-0.5 truncate flex items-center gap-1" style={{ background: '#f3e8ff', color: '#7e22ce' }}>
                          <Bell size={8} className="flex-shrink-0" />
                          {r.title}
                        </div>
                      ))}
                      {overflow > 0 && (
                        <div className="text-[10px] text-gray-400">+{overflow} fler</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        {selectedDay && selectedEvents && (() => {
          const dayReminders = getRemindersForDay(selectedDay);
          const daySchedules = getSchedulesForDay(selectedDay);
          return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 self-start">
            <h3 className="font-semibold text-[#2d7a3a] mb-4">
              {format(selectedDay, 'd MMMM yyyy', { locale: sv })}
            </h3>
            {selectedEvents.deliveries.length === 0 &&
             selectedEvents.pickups.length    === 0 &&
             selectedEvents.events.length     === 0 &&
             selectedEvents.selfDeliveries.length === 0 &&
             selectedEvents.selfReturns.length    === 0 &&
             dayReminders.length === 0 &&
             daySchedules.length === 0 ? (
              <p className="text-sm text-gray-400">Inga aktiviteter</p>
            ) : (
              <div className="space-y-4">
                {selectedEvents.deliveries.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Truck size={12} /> Leveranser
                    </h4>
                    {selectedEvents.deliveries.map(o => <OrderCard key={o.id} order={o} />)}
                  </div>
                )}
                {selectedEvents.pickups.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Package size={12} /> Hämtningar
                    </h4>
                    {selectedEvents.pickups.map(o => <OrderCard key={o.id} order={o} />)}
                  </div>
                )}
                {selectedEvents.events.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Star size={12} /> Event
                    </h4>
                    {selectedEvents.events.map(o => <OrderCard key={o.id} order={o} />)}
                  </div>
                )}
                {selectedEvents.selfDeliveries.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#6b7280' }}>
                      <Truck size={12} /> Kund hämtning
                    </h4>
                    {selectedEvents.selfDeliveries.map(o => <OrderCard key={o.id} order={o} />)}
                  </div>
                )}
                {selectedEvents.selfReturns.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#6b7280' }}>
                      <Package size={12} /> Kund återlämning
                    </h4>
                    {selectedEvents.selfReturns.map(o => <OrderCard key={o.id} order={o} />)}
                  </div>
                )}
                {dayReminders.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#7e22ce' }}>
                      <Bell size={12} /> Påminnelser
                    </h4>
                    {dayReminders.map(r => {
                      const linked = orders.find(o => o.id === r.orderId);
                      return (
                        <div key={r.id} style={{ background: '#f3e8ff', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: '#6b21a8' }}>{r.title}</p>
                          {r.description && <p style={{ fontSize: 12, color: '#7e22ce', marginTop: 2 }}>{r.description}</p>}
                          {linked && <p style={{ fontSize: 11, color: '#9333ea', marginTop: 4 }}>🔗 {linked.firstName} {linked.lastName} – {linked.eventDate}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {daySchedules.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: '#374151' }}>
                      <Users size={12} /> Personal
                    </h4>
                    {daySchedules.map(s => {
                      const member = staff.find(m => m.id === s.staffId);
                      const linked = orders.find(o => o.id === s.orderId);
                      return (
                        <div key={s.id} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
                          <p style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>{member?.name ?? s.staffId}</p>
                          {s.role && <p style={{ fontSize: 12, color: '#6b7280' }}>{s.role}</p>}
                          {linked && <p style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>🔗 {linked.firstName} {linked.lastName} – {linked.eventDate}</p>}
                          {s.notes && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.notes}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          );
        })()}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const [loading, setLoading] = useState(false);

  const handlePdf = async () => {
    setLoading(true);
    try {
      await generateAndPrint(order, 'bekräftelse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg mb-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800">{order.firstName} {order.lastName}</p>
          <p className="text-xs text-gray-500">{order.address}, {order.city}</p>
          <p className="text-xs text-gray-400 mt-1">{order.region} · {order.items.slice(0, 2).map(i => resolveDisplayName(i)).join(', ')}{order.items.length > 2 ? '...' : ''}</p>
        </div>
        <button
          onClick={handlePdf}
          disabled={loading}
          title="Öppna bekräftelse (PDF)"
          style={{ flexShrink: 0, padding: 4, border: 'none', background: 'none', cursor: 'pointer', color: '#2d7a3a', opacity: loading ? 0.5 : 1 }}
        >
          {loading ? <span style={{ fontSize: 10 }}>...</span> : <FileText size={15} />}
        </button>
      </div>
    </div>
  );
}
