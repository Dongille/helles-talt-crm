import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useAppContext } from '../context/AppContext';
import { calculateOrder, formatSEK } from '../utils/calculations';
import type { Order } from '../types';
import { FileQuestion, BookCheck, TrendingUp, DollarSign, Truck, Clock } from 'lucide-react';
import { format, parseISO, compareAsc } from 'date-fns';
import { sv } from 'date-fns/locale';
import OrderForm from '../components/OrderForm/OrderForm';

function filterByRegion(orders: Order[], region: string) {
  if (region === 'Alla') return orders;
  return orders.filter(o => o.region === region);
}

export default function Dashboard() {
  const { orders, addOrder } = useOrders();
  const { region } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [formInitialStatus, setFormInitialStatus] = useState<'förfrågan' | 'bokning'>('förfrågan');

  const filtered = filterByRegion(orders, region);
  const forfrågningar = filtered.filter(o => o.status === 'förfrågan');
  const bokningar = filtered.filter(o => o.status === 'bokning');

  const forfrågningarValue = forfrågningar.reduce((s, o) => s + calculateOrder(o).netAmount, 0);
  const bokningarValue = bokningar.reduce((s, o) => s + calculateOrder(o).netAmount, 0);

  const now = new Date();

  const upcomingDeliveries = orders
    .filter(o => o.status === 'bokning' && o.deliveryDate)
    .filter(o => (region === 'Alla' || o.region === region))
    .filter(o => new Date(o.deliveryDate!) >= now)
    .sort((a, b) => compareAsc(parseISO(a.deliveryDate!), parseISO(b.deliveryDate!)))
    .slice(0, 5);

  const recentRequests = [...forfrågningar]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const kpiCards = [
    { label: 'Förfrågningar', value: forfrågningar.length, icon: FileQuestion, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Bokningar', value: bokningar.length, icon: BookCheck, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Ordervärde förfrågningar', value: formatSEK(forfrågningarValue), icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ordervärde bokningar', value: formatSEK(bokningarValue), icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const openForm = (status: 'förfrågan' | 'bokning') => {
    setFormInitialStatus(status);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#2d7a3a]">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Välkommen till Helles Tält AB bokningssystem</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 font-medium">{label}</span>
              <div className={`${bg} p-2 rounded-lg`}>
                <Icon size={18} className={color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3" style={{ marginTop: 16 }}>
        <button
          onClick={() => openForm('förfrågan')}
          style={{ border: '1px solid #2d7a3a', borderRadius: 6, padding: '11px 20px', color: '#2d7a3a', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }}
          className="flex-1 sm:flex-none"
        >
          + Ny förfrågan
        </button>
        <button
          onClick={() => openForm('bokning')}
          style={{ background: '#2d7a3a', borderRadius: 6, padding: '11px 20px', color: 'white', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }}
          className="flex-1 sm:flex-none"
        >
          + Ny bokning
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming deliveries */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Truck size={18} className="text-[#2d7a3a]" />
            <h3 className="font-semibold text-gray-800">Kommande leveranser</h3>
          </div>
          {upcomingDeliveries.length === 0 ? (
            <p className="text-gray-400 text-sm">Inga kommande leveranser</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeliveries.map(o => (
                <li key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{o.firstName} {o.lastName}</p>
                    <p className="text-xs text-gray-500">{o.address}, {o.city}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${o.selfPickup ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                      {o.deliveryDate ? format(parseISO(o.deliveryDate), 'd MMM', { locale: sv }) : '-'}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{o.region}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent requests */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-[#2d7a3a]" />
            <h3 className="font-semibold text-gray-800">Senaste förfrågningar</h3>
          </div>
          {recentRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">Inga förfrågningar ännu</p>
          ) : (
            <ul className="space-y-3">
              {recentRequests.map(o => (
                <li key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="font-medium text-sm">{o.firstName} {o.lastName}</p>
                    <p className="text-xs text-gray-500">Event: {o.eventDate}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      o.status === 'bokning'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {o.status === 'bokning' ? 'Bokning' : 'Förfrågan'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{formatSEK(calculateOrder(o).netAmount)} exkl. moms</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showForm && (
        <OrderForm
          initialStatus={formInitialStatus}
          lockedStatus={formInitialStatus}
          onSave={(order) => {
            addOrder(order);
            setShowForm(false);
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
