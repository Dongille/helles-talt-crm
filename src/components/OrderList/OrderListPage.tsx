import { useState } from 'react';
import { useOrders } from '../../hooks/useOrders';
import { useAppContext } from '../../context/AppContext';
import { useDocumentNumbers } from '../../hooks/useDocumentNumbers';
import type { Order } from '../../types';
import { calculateOrder, formatSEK } from '../../utils/calculations';
import { Pencil, X, FileText, Download, XCircle } from 'lucide-react';
import OrderForm from '../OrderForm/OrderForm';
import { generateAndPrint } from '../PdfGenerator/generateHtml';

interface Props {
  statusFilter: 'förfrågan' | 'bokning';
}

export default function OrderListPage({ statusFilter }: Props) {
  const { orders, addOrder, updateOrder, deleteOrder } = useOrders();
  const { region } = useAppContext();
  const { getNextOffertNumber, getNextBokningNumber } = useDocumentNumbers();
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [sortBy, setSortBy] = useState<'lastName' | 'eventDate'>('lastName');
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);

  const list = orders
    .filter((o) => o.status === statusFilter)
    .filter((o) => region === 'Alla' || o.region === region)
    // Hide bookings manually marked as 'färdig' (they move to Invoicing)
    .filter((o) => statusFilter !== 'bokning' || (o.bookingStatus ?? 'kommande') !== 'färdig')
    .sort((a, b) =>
      sortBy === 'lastName'
        ? a.lastName.localeCompare(b.lastName, 'sv')
        : a.eventDate.localeCompare(b.eventDate)
    );

  const title = statusFilter === 'förfrågan' ? 'Förfrågningar' : 'Bokningar';
  const headerBg = statusFilter === 'förfrågan' ? '#e8820c' : '#2d7a3a';

  const handleSave = (order: Order) => {
    if (editingOrder) {
      updateOrder(order.id, order);
    } else {
      addOrder(order);
    }
    setShowForm(false);
    setEditingOrder(undefined);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Ta bort denna order?')) deleteOrder(id);
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setShowForm(true);
  };

  const handlePdf = async (orderArg: Order, type: 'offert' | 'bekräftelse') => {
    setLoadingPdf(orderArg.id + type);
    try {
      if (type === 'offert' && orderArg.quoteNumber === undefined) {
        const n = getNextOffertNumber();
        updateOrder(orderArg.id, { quoteNumber: n, quotePdfGenerated: true });
      } else if (type === 'bekräftelse' && orderArg.confirmationNumber === undefined) {
        const n = getNextBokningNumber();
        updateOrder(orderArg.id, { confirmationNumber: n, confirmationPdfGenerated: true });
      }
      await generateAndPrint(orderArg, type);
    } finally {
      setLoadingPdf(null);
    }
  };

  const handleArchive = (id: string) => {
    updateOrder(id, { status: 'arkiverad', archivedAt: new Date().toISOString() });
  };

  const handleCancel = (id: string) => {
    updateOrder(id, { status: 'avbokad', archivedAt: new Date().toISOString() });
    setCancelConfirmId(null);
  };

  return (
    <div className="space-y-5">
      {/* Cancel confirmation dialog */}
      {cancelConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'white', borderRadius: 14, padding: '28px 32px', maxWidth: 380,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)', textAlign: 'center',
          }}>
            <XCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 700, fontSize: 16, color: '#111', marginBottom: 8 }}>Avboka bokning?</p>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
              Bokningen flyttas till Arkivet under "Avbokade bokningar". Du kan återställa den därifrån.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setCancelConfirmId(null)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #e5e5e5', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#555' }}
              >
                Avbryt
              </button>
              <button
                onClick={() => handleCancel(cancelConfirmId)}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Avboka
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2d7a3a]">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{list.length} poster</p>
        </div>
        <button
          onClick={() => {
            setEditingOrder(undefined);
            setShowForm(true);
          }}
          style={
            statusFilter === 'förfrågan'
              ? { border: '1px solid #2d7a3a', borderRadius: 6, padding: '11px 20px', color: '#2d7a3a', background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }
              : { background: '#2d7a3a', borderRadius: 6, padding: '11px 20px', color: 'white', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 44 }
          }
          className="w-full sm:w-auto"
        >
          {statusFilter === 'förfrågan' ? '+ Ny förfrågan' : '+ Ny bokning'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div
          className="px-4 py-3 border-b border-gray-100 flex items-center justify-between"
          style={{ background: headerBg }}
        >
          <h3 className="font-semibold text-white text-sm">
            {title} ({list.length})
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-xs">Sortera:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'lastName' | 'eventDate')}
              className="text-xs border-none rounded px-2 py-1"
              style={{ background: 'white', color: '#111', border: '1px solid #e5e5e5', borderRadius: 6 }}
            >
              <option value="lastName" style={{ background: 'white', color: '#111' }}>Efternamn</option>
              <option value="eventDate" style={{ background: 'white', color: '#111' }}>Datum</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Kund</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Eventdatum</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Region</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Ordervärde</th>
              <th className="px-4 py-3 text-center">Åtgärder</th>
              {statusFilter === 'bokning' && (
                <th className="px-4 py-3 text-left hidden sm:table-cell">Status</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 ? (
              <tr>
                <td colSpan={statusFilter === 'bokning' ? 6 : 5} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Inga {statusFilter === 'förfrågan' ? 'förfrågningar' : 'bokningar'} ännu
                </td>
              </tr>
            ) : (
              list.map((order) => {
                const calc = calculateOrder(order);
                const isLoadingOffert = loadingPdf === order.id + 'offert';
                const isLoadingBek = loadingPdf === order.id + 'bekräftelse';
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">
                        {order.firstName} {order.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{order.email}</p>
                      {/* On mobile, show event date inline since column is hidden */}
                      <p className="text-xs text-gray-500 mt-0.5 sm:hidden">{order.eventDate}</p>
                      <div className="flex gap-1 mt-1">
                        {order.quoteNumber !== undefined && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">
                            OFF-{new Date(order.createdAt).getFullYear()}-{String(order.quoteNumber).padStart(3, '0')}
                          </span>
                        )}
                        {order.confirmationNumber !== undefined && (
                          <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-mono">
                            BOK-{new Date(order.createdAt).getFullYear()}-{String(order.confirmationNumber).padStart(3, '0')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{order.eventDate}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          order.region === 'Göteborg'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {order.region}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <p className="text-sm font-semibold">{formatSEK(calc.netAmount)}</p>
                      <p className="text-xs text-gray-400">exkl. moms</p>
                    </td>
                    <td className="px-4 py-3">
                      {/* Mobile: 2×2 grid (no delete). Desktop: single row with all buttons. */}
                      <div className="hidden sm:flex items-center justify-center gap-1.5">
                        {/* Offert PDF */}
                        <button
                          onClick={() => handlePdf(order, 'offert')}
                          disabled={isLoadingOffert}
                          title={order.quoteNumber !== undefined ? 'Ladda ned offert (PDF)' : 'Generera offert (PDF)'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            order.quoteNumber !== undefined
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-amber-400 hover:bg-amber-50'
                          } disabled:opacity-40`}
                        >
                          {isLoadingOffert ? <span className="text-xs">...</span> : <FileText size={15} />}
                        </button>
                        {/* Bekräftelse PDF */}
                        <button
                          onClick={() => handlePdf(order, 'bekräftelse')}
                          disabled={isLoadingBek}
                          title={order.confirmationNumber !== undefined ? 'Ladda ned bekräftelse (PDF)' : 'Generera bekräftelse (PDF)'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            order.confirmationNumber !== undefined
                              ? 'text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-green-400 hover:bg-green-50'
                          } disabled:opacity-40`}
                        >
                          {isLoadingBek ? <span className="text-xs">...</span> : <Download size={15} />}
                        </button>
                        <button onClick={() => handleEdit(order)} title="Redigera" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        {statusFilter === 'förfrågan' ? (
                          <button onClick={() => handleArchive(order.id)} title="Arkivera förfrågan" className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <XCircle size={15} />
                          </button>
                        ) : (
                          <button onClick={() => setCancelConfirmId(order.id)} title="Avboka" className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <XCircle size={15} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(order.id)} title="Ta bort" className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                          <X size={16} />
                        </button>
                      </div>

                      {/* Mobile: 2×2 grid, no delete button */}
                      <div className="grid grid-cols-2 gap-1 sm:hidden w-fit mx-auto">
                        {/* Row 1: Offert + Bekräftelse */}
                        <button
                          onClick={() => handlePdf(order, 'offert')}
                          disabled={isLoadingOffert}
                          title={order.quoteNumber !== undefined ? 'Ladda ned offert (PDF)' : 'Generera offert (PDF)'}
                          className={`p-2.5 rounded-lg transition-colors ${
                            order.quoteNumber !== undefined
                              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100'
                              : 'text-amber-400 hover:bg-amber-50'
                          } disabled:opacity-40`}
                        >
                          {isLoadingOffert ? <span className="text-xs">...</span> : <FileText size={16} />}
                        </button>
                        <button
                          onClick={() => handlePdf(order, 'bekräftelse')}
                          disabled={isLoadingBek}
                          title={order.confirmationNumber !== undefined ? 'Ladda ned bekräftelse (PDF)' : 'Generera bekräftelse (PDF)'}
                          className={`p-2.5 rounded-lg transition-colors ${
                            order.confirmationNumber !== undefined
                              ? 'text-green-700 bg-green-50 hover:bg-green-100'
                              : 'text-green-400 hover:bg-green-50'
                          } disabled:opacity-40`}
                        >
                          {isLoadingBek ? <span className="text-xs">...</span> : <Download size={16} />}
                        </button>
                        {/* Row 2: Redigera + Arkivera/Avboka */}
                        <button onClick={() => handleEdit(order)} title="Redigera" className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={16} />
                        </button>
                        {statusFilter === 'förfrågan' ? (
                          <button onClick={() => handleArchive(order.id)} title="Arkivera förfrågan" className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <button onClick={() => setCancelConfirmId(order.id)} title="Avboka" className="p-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Status column – bokningar only, desktop */}
                    {statusFilter === 'bokning' && (
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <select
                          value={order.bookingStatus ?? 'kommande'}
                          onChange={(e) =>
                            updateOrder(order.id, { bookingStatus: e.target.value as 'kommande' | 'färdig' })
                          }
                          style={{
                            fontSize: 12, fontWeight: 600, borderRadius: 20, border: '1px solid',
                            padding: '3px 10px', cursor: 'pointer', outline: 'none',
                            background: (order.bookingStatus ?? 'kommande') === 'färdig' ? '#f0fdf4' : '#f8f8f8',
                            color: (order.bookingStatus ?? 'kommande') === 'färdig' ? '#2d7a3a' : '#555',
                            borderColor: (order.bookingStatus ?? 'kommande') === 'färdig' ? '#bbf7d0' : '#e5e5e5',
                          }}
                        >
                          <option value="kommande">Kommande</option>
                          <option value="färdig">Färdig</option>
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showForm && (
        <OrderForm
          order={editingOrder}
          initialStatus={editingOrder ? undefined : statusFilter}
          lockedStatus={editingOrder ? undefined : statusFilter}
          onSave={handleSave}
          onClose={() => {
            setShowForm(false);
            setEditingOrder(undefined);
          }}
        />
      )}
    </div>
  );
}
