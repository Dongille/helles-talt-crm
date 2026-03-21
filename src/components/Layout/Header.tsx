import { NavLink } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import type { Region } from '../../types';
import { LayoutDashboard, CalendarDays, Package, ClipboardList } from 'lucide-react';

const regions: Region[] = ['Alla', 'Göteborg', 'Skaraborg'];

export default function Header() {
  const { region, setRegion } = useAppContext();

  return (
    <header className="bg-[#2d7a3a] text-white shadow-lg">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#c9a84c] rounded-full flex items-center justify-center">
              <span className="text-[#2d7a3a] font-bold text-sm font-serif">HT</span>
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-none">Helles Tält AB</h1>
              <p className="text-xs text-green-200 leading-none">Bokningssystem</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {[
              { to: '/', label: 'Dashboard', icon: LayoutDashboard },
              { to: '/bokningar', label: 'Förfrågningar & Bokningar', icon: ClipboardList },
              { to: '/kalender', label: 'Kalender', icon: CalendarDays },
              { to: '/inventering', label: 'Inventering', icon: Package },
            ].map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Region filter */}
          <div className="flex items-center gap-1 bg-[#2d7a3a]/60 rounded-lg p-1">
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  region === r
                    ? 'bg-[#c9a84c] text-[#2d7a3a] font-semibold'
                    : 'text-green-100 hover:bg-white/10'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
