import { useLogbook } from '../hooks/useLogbook';
import { format, parseISO } from 'date-fns';
import { sv } from 'date-fns/locale';
import { BookOpen, AlertTriangle, CheckCircle } from 'lucide-react';

const GREEN = '#2d7a3a';
const ACCENT_LIGHT = '#f0f7f1';

export default function Logbook() {
  const { entries } = useLogbook();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'serif', fontSize: 26, fontWeight: 700, color: GREEN, margin: 0 }}>Loggbok</h2>
        <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Automatisk logg över lagerbrist och åtgärder</p>
      </div>

      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        {entries.length === 0 ? (
          <div style={{ padding: '64px 24px', textAlign: 'center', color: '#bbb' }}>
            <BookOpen size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Ingen logg ännu</p>
            <p style={{ margin: '4px 0 0', fontSize: 12 }}>Händelser registreras automatiskt när lager når noll eller återställs</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tidpunkt</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Artikel</th>
                  <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Kategori</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Region</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tillgängliga</th>
                  <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Händelse</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.id} style={{ background: idx % 2 === 0 ? 'white' : '#fafafa', borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 16px', color: '#888', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {format(parseISO(entry.timestamp), 'd MMM yyyy · HH:mm', { locale: sv })}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 500, color: '#1a1a1a' }}>{entry.productName}</td>
                    <td style={{ padding: '10px 16px', color: '#666' }}>{entry.category}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', color: '#555' }}>{entry.region}</td>
                    <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700, color: entry.available <= 0 ? '#dc2626' : '#16a34a' }}>
                      {entry.available}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                      {entry.type === 'shortage' ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                          <AlertTriangle size={11} /> Brist
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                          <CheckCircle size={11} /> Åtgärdat
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', background: ACCENT_LIGHT, display: 'flex', gap: 24, fontSize: 12, color: '#555' }}>
          <span><strong style={{ color: '#111111' }}>{entries.length}</strong> händelser totalt</span>
          <span><strong style={{ color: '#dc2626' }}>{entries.filter(e => e.type === 'shortage').length}</strong> brister</span>
        </div>
      </div>
    </div>
  );
}
