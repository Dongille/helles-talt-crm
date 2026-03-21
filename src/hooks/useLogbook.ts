import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface LogEntry {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  category: string;
  region: 'Göteborg' | 'Skaraborg' | 'Totalt';
  available: number;
  type: 'shortage' | 'resolved';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): LogEntry {
  return {
    id:          String(row.id),
    timestamp:   String(row.timestamp),
    productId:   String(row.product_id),
    productName: String(row.product_name),
    category:    String(row.category),
    region:      row.region   as LogEntry['region'],
    available:   Number(row.available),
    type:        row.type     as LogEntry['type'],
  };
}

export function useLogbook() {
  const [entries, setEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    supabase
      .from('logbook')
      .select('*')
      .order('timestamp', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('useLogbook fetch error', error.message);
        else if (data) setEntries(data.map(fromRow));
      });
  }, []);

  const addEntry = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const id        = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const full: LogEntry = { id, timestamp, ...entry };

    // Optimistic
    setEntries(prev => [full, ...prev]);

    supabase
      .from('logbook')
      .insert({
        id,
        timestamp,
        product_id:   entry.productId,
        product_name: entry.productName,
        category:     entry.category,
        region:       entry.region,
        available:    entry.available,
        type:         entry.type,
      })
      .then(({ error }) => {
        if (error) console.error('addEntry error', error.message);
      });
  };

  return { entries, addEntry };
}
