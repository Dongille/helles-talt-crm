import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useAppContext } from '../context/AppContext';
import { calculateOrder, formatSEK } from '../utils/calculations';
import { RotateCcw, Archive, XCircle } from 'lucide-react';

type Tab = 'avvisade' | 'avbokade';

export default function ArchivePage() {
  const { orders, updateOrder } = useOrders();
  const { region } = useAppContext();
  const [tab, setTab] = useState<Tab>('avvisade');

  const avvisade = orders
    .filter(o => o.status === 'arkiverad')
    .filter(o => region === 'Alla' || o.region === region)
    .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''));

  const avbokade = orders
    .filter(o => o.status === 'avbokad')
    .filter(o => region === 'Alla' || o.region === region)
    .sort((a, b) => (b.archivedAt ?? '').localeCompare(a.archivedAt ?? ''));

  const list = tab === 'avvisade' ? avvisade : avbokade;

  const handleRestore = (id: string) => {
    const originalStatus = tab === 'avvisade' ? 'förfrågan' : 'bokning';
    updateOrder(id, { status: originalStatus, archivedAt: undefined });
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '–';
    return new Date(iso).toLocaleDateString('sv-SE');
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: 8,
    border: 'none',
    background: active ? '#111' : 'transparent',
    color: active ? 'white' : '#666',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#2d7a3a]">Arkiv</h2>
        <p className="text-gray-500 text-sm mt-1">
          Avvisade förfrågningar och avbokade bokningar
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f5f5f5', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        <button style={tabStyle(tab === 'avvisade')} onClick={() => setTab('avvisade')}>
          Avvisade förfrågningar ({avvisade.length})
        </button>
        <button style={tabStyle(tab === 'avbokade')} onClick={() => setTab('avbokade')}>
          Avbokade bokningar ({avbokade.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"
          style={{ background: '#6b7280' }}
        >
          {tab === 'avvisade'
            ? <Archive size={15} color="white" />
            : <XCircle size={15} color="white" />
          }
          <h3 className="font-semibold text-white text-sm">
            {tab === 'avvisade' ? 'Avvisade förfrågningar' : 'Avbokade bokningar'} ({list.length})
          </h3>
        </div>

        <div className="overflow-x-auto"><table className="w-full min-w-[560px]">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Kund</th>
              <th className="px-4 py-3 text-left">Eventdatum</th>
              <th className="px-4 py-3 text-left">Region</th>
              <th className="px-4 py-3 text-right">Ordervärde</th>
              <th className="px-4 py-3 text-left">
                {tab === 'avvisade' ? 'Arkiverades' : 'Avbokades'}
              </th>
              <th className="px-4 py-3 text-center">Återställ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-16 text-center text-gray-400 text-sm">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    {tab === 'avvisade'
                      ? <Archive size={32} color="#d1d5db" />
                      : <XCircle size={32} color="#d1d5db" />
                    }
                    <span>
                      Inga {tab === 'avvisade' ? 'avvisade förfrågningar' : 'avbokade bokningar'} ännu
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              list.map(order => {
                const calc = calculateOrder(order);
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{order.firstName} {order.lastName}</p>
                      <p className="text-xs text-gray-400">{order.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.eventDate}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.region === 'Göteborg'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}>
                        {order.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="text-sm font-semibold">{formatSEK(calc.netAmount)}</p>
                      <p className="text-xs text-gray-400">exkl. moms</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {fmtDate(order.archivedAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRestore(order.id)}
                        title={`Återställ till ${tab === 'avvisade' ? 'förfrågningar' : 'bokningar'}`}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 12px', borderRadius: 7,
                          border: '1px solid #d1fae5', background: '#f0fdf4',
                          color: '#2d7a3a', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        <RotateCcw size={13} />
                        Återställ
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
