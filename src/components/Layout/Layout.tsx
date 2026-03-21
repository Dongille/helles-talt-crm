import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, AlertTriangle, X } from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dbError, setDbError]         = useState<string | null>(null);

  // Listen for database errors dispatched from hooks
  useEffect(() => {
    const handler = (e: Event) => {
      setDbError((e as CustomEvent<string>).detail);
    };
    window.addEventListener('helles-db-error', handler);
    return () => window.removeEventListener('helles-db-error', handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-[#f5f5f5] min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            aria-label="Öppna meny"
          >
            <Menu size={20} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>Helles Tält AB</span>
        </div>

        {/* Database error banner */}
        {dbError && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#fef2f2', borderBottom: '1px solid #fecaca',
            padding: '12px 20px', fontSize: 13, color: '#991b1b',
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1, color: '#ef4444' }} />
            <span style={{ flex: 1 }}>
              <strong>Databasfel:</strong> {dbError}
            </span>
            <button
              onClick={() => setDbError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: 0, flexShrink: 0 }}
              aria-label="Stäng"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
