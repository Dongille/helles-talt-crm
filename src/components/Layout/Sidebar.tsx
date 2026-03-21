import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { Region } from '../../types';
import { LayoutDashboard, Calendar, Package, FileText, CalendarCheck, BookOpen, BarChart2, Archive, Receipt, X, LogOut } from 'lucide-react';

const regions: Region[] = ['Alla', 'Göteborg', 'Skaraborg'];

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/forfrågningar', label: 'Förfrågningar', icon: FileText, end: false },
  { to: '/bokningar', label: 'Bokningar', icon: CalendarCheck, end: false },
  { to: '/kalender', label: 'Kalender', icon: Calendar, end: false },
  { to: '/inventering', label: 'Inventering', icon: Package, end: false },
  { to: '/loggbok',     label: 'Loggbok',     icon: BookOpen,  end: false },
  { to: '/statistik',   label: 'Statistik',   icon: BarChart2, end: false },
  { to: '/arkiv',       label: 'Arkiv',       icon: Archive,   end: false },
  { to: '/fakturering', label: 'Fakturering', icon: Receipt,   end: false },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { region, setRegion } = useAppContext();
  const { user, signOut } = useAuth();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-3 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
            <img src="/logo.webp" alt="Helles Tält" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.2 }}>Helles Tält AB</p>
            <p style={{ fontSize: 11, color: '#888', lineHeight: 1.2 }}>Team</p>
          </div>
        </div>
        {/* Close button – only on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
          aria-label="Stäng meny"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-[#2d7a3a]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={17} className="flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Region filter */}
      <div className="px-3 border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2 px-3">Region</p>
        <div className="space-y-0.5">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => { setRegion(r); onClose(); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                region === r
                  ? 'bg-green-50 text-[#2d7a3a]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Sign-out */}
      <div className="px-3 pb-5 pt-3 border-t border-gray-100 mt-3">
        <p className="text-xs text-gray-400 truncate px-3 mb-1">{user?.email}</p>
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={15} className="flex-shrink-0" />
          Logga ut
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar – always visible */}
      <aside className="hidden lg:flex w-[220px] min-h-screen bg-white border-r border-gray-200 flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] bg-white border-r border-gray-200 flex flex-col z-40
          transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
