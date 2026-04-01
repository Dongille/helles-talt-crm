import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useStaff } from '../hooks/useStaff';
import { useOrders } from '../hooks/useOrders';
import type { StaffMember, StaffSchedule } from '../types';
import { Users, Plus, Pencil, Trash2, X, CalendarDays } from 'lucide-react';

const accent = '#2d7a3a';

const EMPTY_MEMBER: Omit<StaffMember, 'id' | 'createdAt'> = { name: '', role: '', phone: '', email: '', notes: '' };
const EMPTY_SCHED: Omit<StaffSchedule, 'id' | 'createdAt'> & { wantsLeverans: boolean; wantsHamtning: boolean } = {
  staffId: '', orderId: undefined, scheduleDate: '', assignmentType: 'leverans', wantsLeverans: true, wantsHamtning: false, role: '', notes: '',
};

export default function Staff() {
  const { staff, schedules, addMember, updateMember, deleteMember, addSchedule, deleteSchedule } = useStaff();
  const { orders } = useOrders();

  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMember, setEditingMember]   = useState<StaffMember | null>(null);
  const [memberForm, setMemberForm]         = useState(EMPTY_MEMBER);

  const [showSchedForm, setShowSchedForm] = useState<boolean>(false);
  const [schedForm, setSchedForm]         = useState<typeof EMPTY_SCHED>(EMPTY_SCHED);

  const activeBookings = orders.filter(o => o.status === 'bokning');

  const openAddMember = () => { setEditingMember(null); setMemberForm(EMPTY_MEMBER); setShowMemberForm(true); };
  const openEditMember = (m: StaffMember) => {
    setEditingMember(m);
    setMemberForm({ name: m.name, role: m.role ?? '', phone: m.phone ?? '', email: m.email ?? '', notes: m.notes ?? '' });
    setShowMemberForm(true);
  };

  const saveMember = () => {
    if (!memberForm.name.trim()) return;
    if (editingMember) {
      updateMember(editingMember.id, { name: memberForm.name, role: memberForm.role || undefined, phone: memberForm.phone || undefined, email: memberForm.email || undefined, notes: memberForm.notes || undefined });
    } else {
      addMember({ ...memberForm, id: uuidv4(), createdAt: new Date().toISOString(), role: memberForm.role || undefined, phone: memberForm.phone || undefined, email: memberForm.email || undefined, notes: memberForm.notes || undefined });
    }
    setShowMemberForm(false);
  };

  const openAddSched = (staffId?: string, orderId?: string) => {
    const order = orderId ? orders.find(o => o.id === orderId) : undefined;
    setSchedForm({ ...EMPTY_SCHED, staffId: staffId ?? (staff[0]?.id ?? ''), orderId, scheduleDate: order?.deliveryDate ?? '' });
    setShowSchedForm(true);
  };

  const handleOrderChange = (oid: string | undefined) => {
    const o = oid ? orders.find(ord => ord.id === oid) : undefined;
    const date = (o?.deliveryDate) ?? schedForm.scheduleDate;
    setSchedForm(f => ({ ...f, orderId: oid, scheduleDate: date }));
  };

  const saveSched = () => {
    if (!schedForm.staffId) return;
    if (!schedForm.wantsLeverans && !schedForm.wantsHamtning) return;
    const now = new Date().toISOString();
    const order = orders.find(o => o.id === schedForm.orderId);
    if (schedForm.wantsLeverans) {
      const date = order?.deliveryDate ?? schedForm.scheduleDate;
      if (date) addSchedule({ id: uuidv4(), staffId: schedForm.staffId, orderId: schedForm.orderId || undefined, scheduleDate: date, assignmentType: 'leverans', role: schedForm.role || undefined, notes: schedForm.notes || undefined, createdAt: now });
    }
    if (schedForm.wantsHamtning) {
      const date = order?.pickupDate ?? schedForm.scheduleDate;
      if (date) addSchedule({ id: uuidv4(), staffId: schedForm.staffId, orderId: schedForm.orderId || undefined, scheduleDate: date, assignmentType: 'hämtning', role: schedForm.role || undefined, notes: schedForm.notes || undefined, createdAt: now });
    }
    setShowSchedForm(false);
  };

  const staffName = (id: string) => staff.find(s => s.id === id)?.name ?? id;
  const orderLabel = (id?: string) => {
    const o = orders.find(o => o.id === id);
    return o ? `${o.firstName} ${o.lastName} – ${o.eventDate}` : '–';
  };

  const schedByDate = [...schedules].sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold" style={{ color: accent }}>Personal</h2>
        <p className="text-gray-500 text-sm mt-1">{staff.length} registrerade</p>
      </div>

      {/* Section A: Staff register */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={16} color={accent} /> Personalregister
          </h3>
          <button onClick={openAddMember} style={{ background: accent, color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> Lägg till person
          </button>
        </div>

        {staff.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: '32px 20px', textAlign: 'center', color: '#aaa' }}>
            <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Ingen personal registrerad ännu</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {staff.map(m => (
              <div key={m.id} style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700, color: accent, fontSize: 15 }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</p>
                  {m.role && <p style={{ fontSize: 12, color: '#6b7280' }}>{m.role}</p>}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                    {m.phone && <span style={{ fontSize: 12, color: '#555' }}>{m.phone}</span>}
                    {m.email && <span style={{ fontSize: 12, color: '#555' }}>{m.email}</span>}
                  </div>
                  {m.notes && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{m.notes}</p>}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => openAddSched(m.id, undefined)} title="Schemalägg" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: accent, borderRadius: 6 }}>
                    <CalendarDays size={14} />
                  </button>
                  <button onClick={() => openEditMember(m)} title="Redigera" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#6b7280', borderRadius: 6 }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => { if (window.confirm(`Ta bort ${m.name}?`)) deleteMember(m.id); }} title="Ta bort" style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#ef4444', borderRadius: 6 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section B: Scheduling */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={16} color={accent} /> Schemaläggning
          </h3>
          <button onClick={() => openAddSched(undefined, undefined)} style={{ background: 'white', color: accent, border: `1px solid ${accent}`, borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Plus size={13} /> Nytt pass
          </button>
        </div>

        {schedByDate.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: '32px 20px', textAlign: 'center', color: '#aaa' }}>
            <CalendarDays size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>Ingen schemaläggning ännu</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {schedByDate.map(s => (
              <div key={s.id} style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{staffName(s.staffId)}</span>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{s.scheduleDate}</span>
                    <span style={{ fontSize: 11, background: s.assignmentType === 'hämtning' ? '#fff7ed' : '#f0fdf4', color: s.assignmentType === 'hämtning' ? '#ea580c' : '#16a34a', border: `1px solid ${s.assignmentType === 'hämtning' ? '#fed7aa' : '#bbf7d0'}`, borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>{s.assignmentType === 'hämtning' ? 'Hämtning' : 'Leverans'}</span>
                    {s.role && <span style={{ fontSize: 12, color: '#9ca3af' }}>{s.role}</span>}
                  </div>
                  {s.orderId && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{orderLabel(s.orderId)}</p>}
                  {s.notes && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{s.notes}</p>}
                </div>
                <button onClick={() => { if (window.confirm('Ta bort pass?')) deleteSchedule(s.id); }} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4, color: '#ef4444', borderRadius: 6, flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Member form modal */}
      {showMemberForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>{editingMember ? 'Redigera person' : 'Lägg till person'}</h3>
              <button onClick={() => setShowMemberForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Namn *', key: 'name', placeholder: 'Förnamn Efternamn' },
                { label: 'Roll', key: 'role', placeholder: 'Montör, Chaufför, Koordinator…' },
                { label: 'Telefon', key: 'phone', placeholder: '070-000 00 00' },
                { label: 'E-post', key: 'email', placeholder: 'namn@example.com' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input value={(memberForm as Record<string, string>)[key]} onChange={e => setMemberForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Anteckningar</label>
                <textarea value={memberForm.notes} onChange={e => setMemberForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowMemberForm(false)} style={{ flex: 1, padding: '10px 0', border: '1px solid #e5e5e5', borderRadius: 8, background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#555' }}>Avbryt</button>
              <button onClick={saveMember} disabled={!memberForm.name.trim()} style={{ flex: 2, padding: '10px 0', border: 'none', borderRadius: 8, background: accent, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: !memberForm.name.trim() ? 0.5 : 1 }}>
                {editingMember ? 'Spara ändringar' : 'Lägg till'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule form modal */}
      {showSchedForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>Nytt pass</h3>
              <button onClick={() => setShowSchedForm(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Personal *</label>
                <select value={schedForm.staffId} onChange={e => setSchedForm(f => ({ ...f, staffId: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                  <option value="">Välj person</option>
                  {staff.map(m => <option key={m.id} value={m.id}>{m.name}{m.role ? ` – ${m.role}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Kopplad bokning (valfri)</label>
                <select value={schedForm.orderId ?? ''} onChange={e => handleOrderChange(e.target.value || undefined)} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: 'white', boxSizing: 'border-box' }}>
                  <option value="">Ingen koppling</option>
                  {activeBookings.map(o => <option key={o.id} value={o.id}>{o.firstName} {o.lastName} – {o.eventDate}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>Uppdragstyp *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={schedForm.wantsLeverans} onChange={e => setSchedForm(f => ({ ...f, wantsLeverans: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    Leverans
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
                    <input type="checkbox" checked={schedForm.wantsHamtning} onChange={e => setSchedForm(f => ({ ...f, wantsHamtning: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    Hämtning
                  </label>
                </div>
                {schedForm.wantsLeverans && schedForm.wantsHamtning && (
                  <p style={{ fontSize: 11, color: '#6b7280', marginTop: 6 }}>Skapar automatiskt ett pass för leverans och ett för hämtning.</p>
                )}
              </div>
              {!(schedForm.wantsLeverans && schedForm.wantsHamtning) && (
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Datum *</label>
                <input type="date" value={schedForm.scheduleDate} onChange={e => setSchedForm(f => ({ ...f, scheduleDate: e.target.value }))} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              )}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Roll för detta tillfälle</label>
                <input value={schedForm.role ?? ''} onChange={e => setSchedForm(f => ({ ...f, role: e.target.value }))} placeholder="T.ex. Montör" style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Anteckningar</label>
                <textarea value={schedForm.notes ?? ''} onChange={e => setSchedForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: '100%', border: '1px solid #e5e5e5', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowSchedForm(false)} style={{ flex: 1, padding: '10px 0', border: '1px solid #e5e5e5', borderRadius: 8, background: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#555' }}>Avbryt</button>
              <button onClick={saveSched} disabled={!schedForm.staffId || (!schedForm.wantsLeverans && !schedForm.wantsHamtning)} style={{ flex: 2, padding: '10px 0', border: 'none', borderRadius: 8, background: accent, color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: (!schedForm.staffId || (!schedForm.wantsLeverans && !schedForm.wantsHamtning)) ? 0.5 : 1 }}>
                Spara pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
