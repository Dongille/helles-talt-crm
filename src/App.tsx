import { Navigate, Outlet, Routes, Route } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout    from './components/Layout/Layout'
import Login     from './pages/Login'
import Dashboard from './pages/Dashboard'
import Requests  from './pages/Requests'
import Orders    from './pages/Orders'
import Calendar  from './pages/Calendar'
import Inventory from './pages/Inventory'
import Logbook   from './pages/Logbook'
import Statistics from './pages/Statistics'
import Archive   from './pages/Archive'
import Invoicing from './pages/Invoicing'
import Reminders from './pages/Reminders'
import Staff     from './pages/Staff'

// Redirects to /login if not authenticated; shows a spinner while checking
function AuthGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f7f8f6',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid #e8e8e8', borderTopColor: '#2d7a3a',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#888', fontSize: 13 }}>Laddar...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route element={<AuthGuard />}>
        <Route element={<Layout />}>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/forfrågningar" element={<Requests />} />
          <Route path="/bokningar"     element={<Orders />} />
          <Route path="/kalender"      element={<Calendar />} />
          <Route path="/inventering"   element={<Inventory />} />
          <Route path="/loggbok"       element={<Logbook />} />
          <Route path="/statistik"     element={<Statistics />} />
          <Route path="/arkiv"         element={<Archive />} />
          <Route path="/fakturering"   element={<Invoicing />} />
          <Route path="/påminnelser"   element={<Reminders />} />
          <Route path="/personal"      element={<Staff />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
