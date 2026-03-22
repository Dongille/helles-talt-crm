import { useState } from 'react';
import { useOrders } from '../hooks/useOrders';
import { useAppContext } from '../context/AppContext';
import { calculateOrder, formatSEK } from '../utils/calculations';
import { generateAndPrint } from '../components/PdfGenerator/generateHtml';
import { Download, CheckCircle, Receipt } from 'lucide-react';

export default function InvoicingPage() {
  const { orders, updateOrder } = useOrders();
  const { region } = useAppContext();
  const [loadingPdf, setLoadingPdf] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // All bookings where event date + 2 days has passed
  const invoiceList = orders
    .filter(o => {
      const cutoff = new Date(o.eventDate);
      cutoff.setDate(cutoff.getDate() + 2);
      return o.status === 'bokning' && cutoff.toISOString().slice(0, 10) <= today;
    })
    .filter(o => region === 'Alla' || o.region === region)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));

  const fakturerade  = invoiceList.filter(o => !!o.invoicedAt);
  const ej_fakturerade = invoiceList.filter(o => !o.invoicedAt);

  const totalEj   = ej_fakturerade.reduce((s, o) => s + calculateOrder(o).totalAmount, 0);
  const totalFakt = fakturerade.reduce((s, o) => s + calculateOrder(o).totalAmount, 0);

  const handleMarkInvoiced = (id: string) => {
    updateOrder(id, { invoicedAt: new Date().toISOString() });
  };

  const handlePdf = async (order: Parameters<typeof generateAndPrint>[0]) => {
    setLoadingPdf(order.id);
    try {
      await generateAndPrint(order, 'bekräftelse');
    } finally {
      setLoadingPdf(null);
    }
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return '–';
    return new Date(iso).toLocaleDateString('sv-SE');
  };

  const StatusBadge = ({ invoicedAt }: { invoicedAt?: string }) =>
    invoicedAt ? (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#f0fdf4', color: '#2d7a3a',
        border: '1px solid #bbf7d0', borderRadius: 20, padding: '2px 10px',
        fontSize: 12, fontWeight: 600,
      }}>
        <CheckCircle size={11} /> Fakturerad
      </span>
    ) : (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: '#fff7ed', color: '#e8820c',
        border: '1px solid #fed7aa', borderRadius: 20, padding: '2px 10px',
        fontSize: 12, fontWeight: 600,
      }}>
        <Receipt size={11} /> Färdig
      </span>
    );

  const renderTable = (rows: typeof invoiceList, showMarkBtn: boolean) => (
    <div className="overflow-x-auto"><table className="w-full min-w-[700px]">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
        <tr>
          <th className="px-4 py-3 text-left">Kund</th>
          <th className="px-4 py-3 text-left">Eventdatum</th>
          <th className="px-4 py-3 text-left">Region</th>
          <th className="px-4 py-3 text-right">Exkl. moms</th>
          <th className="px-4 py-3 text-right">Moms (25%)</th>
          <th className="px-4 py-3 text-right">Att betala</th>
          <th className="px-4 py-3 text-left">Status</th>
          <th className="px-4 py-3 text-center">Åtgärder</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
              Inga poster
            </td>
          </tr>
        ) : (
          rows.map(order => {
            const calc = calculateOrder(order);
            const isLoading = loadingPdf === order.id;
            return (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-sm">{order.firstName} {order.lastName}</p>
                  <p className="text-xs text-gray-400">{order.email}</p>
                  {order.invoicedAt && (
                    <p className="text-xs text-gray-400 mt-0.5">Fakturerad {fmtDate(order.invoicedAt)}</p>
                  )}
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
                <td className="px-4 py-3 text-right text-sm font-medium">{formatSEK(calc.netAmount)}</td>
                <td className="px-4 py-3 text-right text-sm text-gray-500">{formatSEK(calc.vatAmount)}</td>
                <td className="px-4 py-3 text-right">
                  <p className="text-sm font-bold">{formatSEK(calc.totalAmount)}</p>
                  {order.depositPaid && order.depositAmount > 0 && (
                    <p className="text-xs text-gray-400">
                      Kvar: {formatSEK(calc.remainingAmount)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge invoicedAt={order.invoicedAt} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* PDF */}
                    <button
                      onClick={() => handlePdf(order)}
                      disabled={isLoading}
                      title="Ladda ned bekräftelse (PDF)"
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      {isLoading ? <span className="text-xs">...</span> : <Download size={15} />}
                    </button>

                    {/* Markera som fakturerad */}
                    {showMarkBtn && (
                      <button
                        onClick={() => handleMarkInvoiced(order.id)}
                        style={{
                          padding: '4px 10px', borderRadius: 7,
                          border: '1px solid #bbf7d0', background: '#f0fdf4',
                          color: '#2d7a3a', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Markera fakturerad
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table></div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#2d7a3a]">Fakturering</h2>
        <p className="text-gray-500 text-sm mt-1">
          Bokningar vars eventdatum har passerat
        </p>
      </div>

      {/* ── Ej fakturerade ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"
          style={{ background: '#6b7280' }}>
          <Receipt size={15} color="white" />
          <h3 className="font-semibold text-white text-sm">
            Färdiga – ej fakturerade ({ej_fakturerade.length})
          </h3>
        </div>
        {renderTable(ej_fakturerade, true)}
      </div>

      {/* ── Fakturerade ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"
          style={{ background: '#2d7a3a' }}>
          <CheckCircle size={15} color="white" />
          <h3 className="font-semibold text-white text-sm">
            Fakturerade ({fakturerade.length})
          </h3>
        </div>
        {renderTable(fakturerade, false)}
      </div>

      {/* ── Totalsummor ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #d1d5db',
          padding: '18px 22px',
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Totalt att fakturera
          </p>
          <p style={{ margin: '6px 0 2px', fontSize: 24, fontWeight: 700, color: '#111' }}>
            {formatSEK(totalEj)}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#bbb' }}>inkl. moms – {ej_fakturerade.length} bokningar</p>
        </div>
        <div style={{
          background: 'white', borderRadius: 14, border: '1px solid #bbf7d0',
          padding: '18px 22px',
        }}>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#2d7a3a', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Totalt fakturerat
          </p>
          <p style={{ margin: '6px 0 2px', fontSize: 24, fontWeight: 700, color: '#111' }}>
            {formatSEK(totalFakt)}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: '#bbb' }}>inkl. moms – {fakturerade.length} bokningar</p>
        </div>
      </div>
    </div>
  );
}
