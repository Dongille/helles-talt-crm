import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Reminder } from '../types';

function fromRow(row: Record<string, unknown>): Reminder {
  return {
    id:           String(row.id),
    title:        String(row.title ?? ''),
    description:  row.description ? String(row.description) : undefined,
    reminderDate: String(row.reminder_date ?? ''),
    orderId:      row.order_id ? String(row.order_id) : undefined,
    status:       (row.status as Reminder['status']) ?? 'aktiv',
    createdAt:    String(row.created_at),
  };
}

function toRow(r: Reminder) {
  return {
    id:            r.id,
    title:         r.title,
    description:   r.description ?? null,
    reminder_date: r.reminderDate,
    order_id:      r.orderId ?? null,
    status:        r.status,
    created_at:    r.createdAt,
  };
}

export function useReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    supabase.from('reminders').select('*').order('reminder_date', { ascending: true })
      .then(({ data }) => { if (data) setReminders(data.map(r => fromRow(r as Record<string, unknown>))); });

    const ch = supabase.channel('reminders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, payload => {
        if (payload.eventType === 'INSERT') {
          const n = fromRow(payload.new as Record<string, unknown>);
          setReminders(prev => [...prev, n].sort((a, b) => a.reminderDate.localeCompare(b.reminderDate)));
        } else if (payload.eventType === 'UPDATE') {
          const u = fromRow(payload.new as Record<string, unknown>);
          setReminders(prev => prev.map(r => r.id === u.id ? u : r));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setReminders(prev => prev.filter(r => r.id !== id));
        }
      }).subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const addReminder = (r: Reminder) => {
    setReminders(prev => [...prev, r].sort((a, b) => a.reminderDate.localeCompare(b.reminderDate)));
    supabase.from('reminders').insert(toRow(r)).then(({ error }) => {
      if (error) console.error('addReminder error', error);
    });
  };

  const updateReminder = (id: string, patch: Partial<Reminder>) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    supabase.from('reminders').update(patch.reminderDate !== undefined ? {
      title: patch.title, description: patch.description ?? null,
      reminder_date: patch.reminderDate, order_id: patch.orderId ?? null, status: patch.status,
    } : { status: patch.status }).eq('id', id).then(({ error }) => {
      if (error) console.error('updateReminder error', error);
    });
  };

  const deleteReminder = (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    supabase.from('reminders').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('deleteReminder error', error);
    });
  };

  return { reminders, addReminder, updateReminder, deleteReminder };
}
