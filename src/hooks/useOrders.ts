import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types';

// ── Global DB-error event (consumed by Layout banner) ────────────────────────
export function emitDbError(msg: string) {
  window.dispatchEvent(new CustomEvent('helles-db-error', { detail: msg }));
}

// ── localStorage layer for bookingStatus (schema cache fallback) ──────────────
// Stored as { [orderId]: 'kommande' | 'färdig' } so it survives page reloads
// even when Supabase schema cache doesn't recognise the column yet.
const BS_KEY = 'helles-booking-status-v1';

function readLocalBS(): Record<string, 'kommande' | 'färdig'> {
  try { return JSON.parse(localStorage.getItem(BS_KEY) || '{}'); } catch { return {}; }
}
function writeLocalBS(id: string, val: 'kommande' | 'färdig' | undefined) {
  const map = readLocalBS();
  if (val == null) delete map[id]; else map[id] = val;
  localStorage.setItem(BS_KEY, JSON.stringify(map));
}

// ── Row converters ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromRow(row: any): Order {
  // Prefer DB value; fall back to localStorage if column not yet in schema cache
  const dbStatus = (row.booking_status as Order['bookingStatus']) ?? undefined;
  const localStatus = readLocalBS()[String(row.id)];
  return {
    id:                       String(row.id),
    status:                   row.status                 as Order['status'],
    region:                   row.region                 as Order['region'],
    createdAt:                String(row.created_at),
    updatedAt:                String(row.updated_at),
    firstName:                String(row.first_name       ?? ''),
    lastName:                 String(row.last_name        ?? ''),
    phone:                    String(row.phone            ?? ''),
    email:                    String(row.email            ?? ''),
    address:                  String(row.address          ?? ''),
    postalCode:               String(row.postal_code      ?? ''),
    city:                     String(row.city             ?? ''),
    groundType:               (row.ground_type as Order['groundType']) ?? 'Ej angivet',
    eventDate:                String(row.event_date       ?? ''),
    deliveryDate:             (row.delivery_date          as string | null) ?? null,
    pickupDate:               (row.pickup_date            as string | null) ?? null,
    selfPickup:               Boolean(row.self_pickup),
    items:                    Array.isArray(row.items) ? row.items : [],
    discountPercent:          Number(row.discount_percent  ?? 0),
    depositPaid:              Boolean(row.deposit_paid),
    depositAmount:            Number(row.deposit_amount    ?? 0),
    notes:                    String(row.notes             ?? ''),
    quotePdfGenerated:        Boolean(row.quote_pdf_generated),
    confirmationPdfGenerated: Boolean(row.confirmation_pdf_generated),
    quoteNumber:              row.quote_number        != null ? Number(row.quote_number)        : undefined,
    confirmationNumber:       row.confirmation_number != null ? Number(row.confirmation_number) : undefined,
    quoteValidityDays:        row.quote_validity_days != null
                                ? (row.quote_validity_days === 'custom' ? 'custom' : Number(row.quote_validity_days))
                                : undefined,
    quoteValidityCustomDate:  row.quote_validity_custom_date  ?? undefined,
    deliveryTime:             row.delivery_time  ?? undefined,
    pickupTime:               row.pickup_time    ?? undefined,
    archivedAt:               row.archived_at    ?? undefined,
    invoicedAt:               row.invoiced_at    ?? undefined,
    bookingStatus:            dbStatus ?? localStatus,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRow(order: Order): Record<string, any> {
  return {
    id:                          order.id,
    status:                      order.status,
    region:                      order.region,
    created_at:                  order.createdAt,
    updated_at:                  order.updatedAt,
    first_name:                  order.firstName,
    last_name:                   order.lastName,
    phone:                       order.phone,
    email:                       order.email,
    address:                     order.address,
    postal_code:                 order.postalCode,
    city:                        order.city,
    ground_type:                 order.groundType,
    event_date:                  order.eventDate,
    delivery_date:               order.deliveryDate    ?? null,
    pickup_date:                 order.pickupDate      ?? null,
    self_pickup:                 order.selfPickup,
    items:                       order.items,
    discount_percent:            order.discountPercent,
    deposit_paid:                order.depositPaid,
    deposit_amount:              order.depositAmount,
    notes:                       order.notes,
    quote_pdf_generated:         order.quotePdfGenerated,
    confirmation_pdf_generated:  order.confirmationPdfGenerated,
    quote_number:                order.quoteNumber        ?? null,
    confirmation_number:         order.confirmationNumber ?? null,
    quote_validity_days:         order.quoteValidityDays  != null ? String(order.quoteValidityDays) : null,
    quote_validity_custom_date:  order.quoteValidityCustomDate   ?? null,
    delivery_time:               order.deliveryTime  ?? null,
    pickup_time:                 order.pickupTime    ?? null,
    archived_at:                 order.archivedAt    ?? null,
    invoiced_at:                 order.invoicedAt    ?? null,
    booking_status:              order.bookingStatus ?? null,
  };
}

// ── One-time localStorage → Supabase migration ────────────────────────────────
const MIGRATION_KEY = 'helles-migrated-to-supabase-v1';

async function migrateFromLocalStorage(setOrders: (orders: Order[]) => void) {
  if (localStorage.getItem(MIGRATION_KEY)) return; // already done

  const raw = localStorage.getItem('helles-orders');
  if (!raw) { localStorage.setItem(MIGRATION_KEY, 'true'); return; }

  let local: Order[] = [];
  try { local = JSON.parse(raw) as Order[]; } catch { /* ignore */ }
  if (!local.length) { localStorage.setItem(MIGRATION_KEY, 'true'); return; }

  console.log(`[Migration] Hittade ${local.length} ordrar i localStorage – migrerar till Supabase…`);

  // Insert in batches of 50 to stay within Supabase limits
  const BATCH = 50;
  let success = true;
  for (let i = 0; i < local.length; i += BATCH) {
    const batch = local.slice(i, i + BATCH);
    const { error } = await supabase.from('orders').upsert(batch.map(toRow));
    if (error) {
      console.error('[Migration] Fel vid insättning av batch:', error.message);
      success = false;
      break;
    }
  }

  if (success) {
    console.log('[Migration] Klar! Alla ordrar har kopierats till Supabase.');
    localStorage.setItem(MIGRATION_KEY, 'true');
    setOrders(local);
  } else {
    emitDbError('Migrering av lokaldata till Supabase misslyckades delvis – se konsolen för detaljer.');
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOrders() {
  const [orders, setOrders]       = useState<Order[]>([]);
  const [isLoading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const ordersRef = useRef<Order[]>([]);
  ordersRef.current = orders;

  useEffect(() => {
    // Verify env vars are present
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const msg = 'Miljövariablerna VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY saknas.';
      emitDbError(msg);
      setFetchError(msg);
      setLoading(false);
      return;
    }

    // ── Initial fetch ──────────────────────────────────────────────────────
    supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(async ({ data, error }) => {
        if (error) {
          console.error('useOrders fetch error', error);
          const msg = error.code === 'PGRST205'
            ? 'Databastabellen "orders" saknas – kör SQL-skriptet i Supabase SQL Editor.'
            : `Databasfel: ${error.message}`;
          emitDbError(msg);
          setFetchError(msg);
          setLoading(false);
          return;
        }

        const dbOrders = (data ?? []).map(fromRow);
        console.log(`[useOrders] Hämtade ${dbOrders.length} ordrar från Supabase.`);

        if (dbOrders.length === 0) {
          // DB is empty – check if localStorage has data and migrate it
          await migrateFromLocalStorage(setOrders);
        } else {
          setOrders(dbOrders);
        }

        setLoading(false);
      });

    // ── Real-time subscription ─────────────────────────────────────────────
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = fromRow(payload.new);
            setOrders(prev =>
              prev.some(o => o.id === newOrder.id) ? prev : [newOrder, ...prev],
            );
          } else if (payload.eventType === 'UPDATE') {
            const updated = fromRow(payload.new);
            setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id;
            setOrders(prev => prev.filter(o => o.id !== deletedId));
          }
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Mutations (optimistic local update + Supabase write) ─────────────────

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    supabase.from('orders').insert(toRow(order)).then(({ error }) => {
      if (error) {
        console.error('addOrder error', error);
        emitDbError(
          error.code === 'PGRST205'
            ? 'Kunde inte spara: tabellen "orders" saknas – kör SQL-skriptet i Supabase.'
            : `Kunde inte spara ordern: ${error.message}`,
        );
        setOrders(prev => prev.filter(o => o.id !== order.id));
      }
    });
  };

  const updateOrder = (id: string, updated: Partial<Order>) => {
    // 1. Write bookingStatus to localStorage immediately so it survives
    //    page reloads even if the Supabase schema cache isn't ready yet.
    if ('bookingStatus' in updated) {
      writeLocalBS(id, updated.bookingStatus);
    }

    const now = new Date().toISOString();
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, ...updated, updatedAt: now } : o),
    );
    const current = ordersRef.current.find(o => o.id === id);
    if (!current) return;
    const merged = { ...current, ...updated, updatedAt: now };
    const row = toRow(merged);

    supabase.from('orders').update(row).eq('id', id).then(({ error }) => {
      if (error) {
        // Silently swallow schema-cache errors for booking_status – localStorage has it
        if (error.message?.includes('booking_status')) {
          console.warn('[updateOrder] booking_status column not in schema cache – localStorage used as fallback');
          return;
        }
        console.error('[updateOrder] Supabase error:', error);
        emitDbError(`Kunde inte uppdatera ordern: ${error.message}`);
      }
    });
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
    supabase.from('orders').delete().eq('id', id).then(({ error }) => {
      if (error) {
        console.error('deleteOrder error', error);
        emitDbError(`Kunde inte ta bort ordern: ${error.message}`);
      }
    });
  };

  const getOrder = (id: string) => ordersRef.current.find(o => o.id === id);

  return { orders, isLoading, fetchError, addOrder, updateOrder, deleteOrder, getOrder };
}
