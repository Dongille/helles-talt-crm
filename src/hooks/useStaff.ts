import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { StaffMember, StaffSchedule } from '../types';

function memberFromRow(row: Record<string, unknown>): StaffMember {
  return {
    id:        String(row.id),
    name:      String(row.name ?? ''),
    role:      row.role      ? String(row.role)      : undefined,
    phone:     row.phone     ? String(row.phone)     : undefined,
    email:     row.email     ? String(row.email)     : undefined,
    notes:     row.notes     ? String(row.notes)     : undefined,
    createdAt: String(row.created_at),
  };
}

function scheduleFromRow(row: Record<string, unknown>): StaffSchedule {
  return {
    id:           String(row.id),
    staffId:      String(row.staff_id),
    orderId:      row.order_id ? String(row.order_id) : undefined,
    scheduleDate: String(row.schedule_date ?? ''),
    role:         row.role  ? String(row.role)  : undefined,
    notes:        row.notes ? String(row.notes) : undefined,
    createdAt:    String(row.created_at),
  };
}

export function useStaff() {
  const [staff, setStaff]         = useState<StaffMember[]>([]);
  const [schedules, setSchedules] = useState<StaffSchedule[]>([]);

  useEffect(() => {
    supabase.from('staff').select('*').order('name').then(({ data }) => {
      if (data) setStaff(data.map(r => memberFromRow(r as Record<string, unknown>)));
    });
    supabase.from('staff_schedule').select('*').order('schedule_date').then(({ data }) => {
      if (data) setSchedules(data.map(r => scheduleFromRow(r as Record<string, unknown>)));
    });

    const staffCh = supabase.channel('staff-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, payload => {
        if (payload.eventType === 'INSERT') {
          const n = memberFromRow(payload.new as Record<string, unknown>);
          setStaff(prev => [...prev, n].sort((a, b) => a.name.localeCompare(b.name, 'sv')));
        } else if (payload.eventType === 'UPDATE') {
          const u = memberFromRow(payload.new as Record<string, unknown>);
          setStaff(prev => prev.map(s => s.id === u.id ? u : s));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setStaff(prev => prev.filter(s => s.id !== id));
        }
      }).subscribe();

    const schedCh = supabase.channel('sched-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_schedule' }, payload => {
        if (payload.eventType === 'INSERT') {
          const n = scheduleFromRow(payload.new as Record<string, unknown>);
          setSchedules(prev => [...prev, n]);
        } else if (payload.eventType === 'UPDATE') {
          const u = scheduleFromRow(payload.new as Record<string, unknown>);
          setSchedules(prev => prev.map(s => s.id === u.id ? u : s));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setSchedules(prev => prev.filter(s => s.id !== id));
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(staffCh);
      supabase.removeChannel(schedCh);
    };
  }, []);

  const addMember = (m: StaffMember) => {
    setStaff(prev => [...prev, m].sort((a, b) => a.name.localeCompare(b.name, 'sv')));
    supabase.from('staff').insert({ id: m.id, name: m.name, role: m.role ?? null, phone: m.phone ?? null, email: m.email ?? null, notes: m.notes ?? null, created_at: m.createdAt }).then(({ error }) => {
      if (error) console.error('addMember error', error);
    });
  };

  const updateMember = (id: string, patch: Partial<StaffMember>) => {
    setStaff(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m));
    supabase.from('staff').update({ name: patch.name, role: patch.role ?? null, phone: patch.phone ?? null, email: patch.email ?? null, notes: patch.notes ?? null }).eq('id', id).then(({ error }) => {
      if (error) console.error('updateMember error', error);
    });
  };

  const deleteMember = (id: string) => {
    setStaff(prev => prev.filter(m => m.id !== id));
    setSchedules(prev => prev.filter(s => s.staffId !== id));
    supabase.from('staff').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('deleteMember error', error);
    });
  };

  const addSchedule = (s: StaffSchedule) => {
    setSchedules(prev => [...prev, s]);
    supabase.from('staff_schedule').insert({ id: s.id, staff_id: s.staffId, order_id: s.orderId ?? null, schedule_date: s.scheduleDate, role: s.role ?? null, notes: s.notes ?? null, created_at: s.createdAt }).then(({ error }) => {
      if (error) console.error('addSchedule error', error);
    });
  };

  const deleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
    supabase.from('staff_schedule').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('deleteSchedule error', error);
    });
  };

  return { staff, schedules, addMember, updateMember, deleteMember, addSchedule, deleteSchedule };
}
