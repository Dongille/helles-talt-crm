import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useReminders } from '../hooks/useReminders';
import { useOrders } from '../hooks/useOrders';
import type { Reminder } from '../types';
import { Bell, Plus, Pencil, Trash2, X, CheckCircle, Circle } from 'lucide-react';

const accent = '#ef4444';

function isOverdue(r: Reminder) {
  return r.status === 'aktiv' && r.reminderDate < new Date().toISOString().slice(0, 10);
}

const EMPTY: Omit<Reminder, 'id' | 'createdAt'> = {
  title: '', description: '', reminderDate: '', orderId: undefined, status: 'aktiv',
};

export default function Reminders() {
  const { reminders, addReminder, updateReminder, deleteReminder } = useReminders();
  const { orders } = useOrders();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState(EMPTY);

  const activeBookings = orders.filter(o => o.status === 'bokning');

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    setForm({ title: r.title, description: r.description ?? '', reminderDate: r.reminderDate, orderId: r.orderId, status: r.status });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.reminderDate) return;
    if (editing) {
      updateReminder(editing.id, { ...form, description: form.description || undefined, orderId: form.orderId || undefined });
    } else {
      addReminder({ ...form, id: uuidv4(), createdAt: new Date().toISOString(), description: form.description || undefined, orderId: form.orderId || undefined });
    }
    setShowForm(false);
  };

  const toggleStatus = (r: Reminder) => {
    updateReminder(r.id, { status: r.status === 'aktiv' ? 'klar' : 'aktiv' });
  };

  const linked = (r: Reminder) => activeBookings.find(o => o.id === r.orderId);

  const active = reminders.filter(r => r.status === 'aktiv');
  const done   = reminders.filter(r => r.status === 'klar');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold" style={{ color: accent }}>Påminnelser</h2>
          <p className="text-gray-500 text-sm mt-1">{active.length} aktiva</p>
        </div>
        <button
          onClick={openAdd}
          style={{ background: accent, color: 'white', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> Ny påminnelse
        </button>
      </div>

      {/* Active reminders */}
      {active.length === 0 && done.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
          <Bell size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Inga påminnelser ännu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {active.map(r => {
            const overdue = isOverdue(r);
            const order = linked(r);
            return (
              <div key={r.id} style={{
                background: overdue ? '#fff7ed' : 'white',
                border: `1px solid ${overdue ? '#fed7aa' : '#e5e5e5'}`,
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <button onClick={() => toggleStatus(r)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: overdue ? '#ea580c' : '#9ca3af', flexShrink: 0, marginTop: 2 }}>
                  <Circle size={18} />
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: overdue ? '#c2410c' : '#111' }}>{r.title}</span>
                    <span style={{ fontSize: 12, color: overdue ? '#ea580c' : '#6b7280' }}>{r.reminderDate}</span>
                    {overdue && <span style={{ fontSize: 11, background: '#fed7aa', color: '#c2410c', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>Förfallen</span>}
                  </div>
                  {r.description && <p style={{ fontSize: 13, color: '#555', marginTop: 3 }}>{r.description}</p>}
                  {order && (
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                      🔗 {order.firstName} {order.lastName} – {order.eventDate}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => openEdit(r)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#6b7280', borderRadius: 6 }} title="Redigera">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => { if (window.confirm('Ta bort påminnelse?')) deleteReminder(r.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#ef4444', borderRadius: 6 }} title="Ta bort">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Done */}
          {done.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Klarmarkerade ({done.length})</p>
              {done.map(r => {
                const order = linked(r);
                return (
                  <div key={r.id} style={{ background: '#f9fafb', border: '1px solid #f0f0f0', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', opacity: 0.6, marginBottom: 8 }}>
                    <button onClick={() => toggleStatus(r)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: accent, flexShrink: 0, marginTop: 2 }}>
                      <CheckCircle size={18} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#555', textDecoration: 'line-through' }}>{r.title}</span>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{r.reminderDate}</span>
                      </div>
                      {order && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>🔗 {order.firstName} {order.lastName}</p>}
                    </div>
                    <button onClick={() => { if (window.confirm('Ta bort påminnelse?')) deleteReminder(r.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#d1d5db', borderRadius: 6 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{editing ? 'Redigera påminnelse' : 'Ny påminnelse'}</h3>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Titel *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="T.ex. Boka DJ" style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Datum *</label>
                <input type="date" value={form.reminderDate} onChange={e => setForm(f => ({ ...f, reminderDate: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Beskrivning</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Valfri beskrivning..." style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Kopplad bokning (valfri)</label>
                <select value={form.orderId ?? ''} onChange={e => setForm(f => ({ ...f, orderId: e.target.value || undefined }))} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: 'white' }}>
                  <option value="">Ingen koppling</option>
                  {activeBookings.map(o => (
                    <option key={o.id} value={o.id}>{o.firstName} {o.lastName} – {o.eventDate}</option>
                  ))}
                </select>
              </div>
              {editing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="status-check" checked={form.status === 'klar'} onChange={e => setForm(f => ({ ...f, status: e.target.checked ? 'klar' : 'aktiv' }))} />
                  <label htmlFor="status-check" style={{ fontSize: 14, cursor: 'pointer' }}>Markera som klar</label>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '10px 0', border: '1px solid #e5e5e5', borderRadius: 8, background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#555' }}>Avbryt</button>
              <button onClick={handleSave} disabled={!form.title.trim() || !form.reminderDate} style={{ flex: 2, padding: '10px 0', border: 'none', borderRadius: 8, background: accent, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: (!form.title.trim() || !form.reminderDate) ? 0.5 : 1 }}>
                {editing ? 'Spara ändringar' : 'Lägg till'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
