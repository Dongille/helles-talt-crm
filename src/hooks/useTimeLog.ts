import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { TimeLog } from '../types';

function fromRow(row: Record<string, unknown>): TimeLog {
  return {
    id:        String(row.id),
    staffId:   String(row.staff_id),
    orderId:   row.order_id ? String(row.order_id) : undefined,
    logDate:   String(row.log_date ?? ''),
    hours:     Number(row.hours ?? 0),
    notes:     row.notes ? String(row.notes) : undefined,
    createdAt: String(row.created_at),
  };
}

export function useTimeLog() {
  const [logs, setLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    supabase.from('time_log').select('*').order('log_date', { ascending: false }).then(({ data }) => {
      if (data) setLogs(data.map(r => fromRow(r as Record<string, unknown>)));
    });

    const ch = supabase.channel('timelog-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_log' }, payload => {
        if (payload.eventType === 'INSERT') {
          const n = fromRow(payload.new as Record<string, unknown>);
          setLogs(prev => [n, ...prev].sort((a, b) => b.logDate.localeCompare(a.logDate)));
        } else if (payload.eventType === 'UPDATE') {
          const u = fromRow(payload.new as Record<string, unknown>);
          setLogs(prev => prev.map(l => l.id === u.id ? u : l));
        } else if (payload.eventType === 'DELETE') {
          const id = (payload.old as { id: string }).id;
          setLogs(prev => prev.filter(l => l.id !== id));
        }
      }).subscribe();

    return () => { supabase.removeChannel(ch); };
  }, []);

  const addLog = (log: TimeLog) => {
    setLogs(prev => [log, ...prev].sort((a, b) => b.logDate.localeCompare(a.logDate)));
    supabase.from('time_log').insert({
      id: log.id, staff_id: log.staffId, order_id: log.orderId ?? null,
      log_date: log.logDate, hours: log.hours, notes: log.notes ?? null, created_at: log.createdAt,
    }).then(({ error }) => { if (error) console.error('addLog error', error); });
  };

  const updateLog = (id: string, patch: Partial<TimeLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l)
      .sort((a, b) => b.logDate.localeCompare(a.logDate)));
    supabase.from('time_log').update({
      staff_id: patch.staffId, order_id: patch.orderId ?? null,
      log_date: patch.logDate, hours: patch.hours, notes: patch.notes ?? null,
    }).eq('id', id).then(({ error }) => { if (error) console.error('updateLog error', error); });
  };

  const deleteLog = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
    supabase.from('time_log').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('deleteLog error', error);
    });
  };

  return { logs, addLog, updateLog, deleteLog };
}
