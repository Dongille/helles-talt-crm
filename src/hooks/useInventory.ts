import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { InventoryItem } from '../types';
import { PRODUCTS } from '../data/products';

interface StoredQty { productId: string; quantityGoteborg: number; quantitySkaraborg: number; }

export function useInventory() {
  const [stored, setStored] = useState<StoredQty[]>([]);

  useEffect(() => {
    supabase
      .from('inventory')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error('useInventory fetch error', error.message);
        else if (data) {
          setStored(
            data.map(r => ({
              productId:         String(r.product_id),
              quantityGoteborg:  Number(r.quantity_goteborg  ?? 0),
              quantitySkaraborg: Number(r.quantity_skaraborg ?? 0),
            })),
          );
        }
      });
  }, []);

  // Always reflect current PRODUCTS; any new product gets qty 0 automatically
  const inventory: InventoryItem[] = PRODUCTS.map(p => {
    const s = stored.find(i => i.productId === p.id);
    return {
      id:                p.id,
      productId:         p.id,
      productName:       p.name,
      category:          p.category,
      quantityGoteborg:  s?.quantityGoteborg  ?? 0,
      quantitySkaraborg: s?.quantitySkaraborg ?? 0,
    };
  });

  const updateInventoryItem = (
    productId: string,
    updates: { quantityGoteborg?: number; quantitySkaraborg?: number },
  ) => {
    // Optimistic local update
    setStored(prev => {
      const exists = prev.find(i => i.productId === productId);
      if (exists) return prev.map(i => i.productId === productId ? { ...i, ...updates } : i);
      return [...prev, { productId, quantityGoteborg: 0, quantitySkaraborg: 0, ...updates }];
    });

    // Upsert to Supabase
    const current = stored.find(i => i.productId === productId) ?? {
      productId, quantityGoteborg: 0, quantitySkaraborg: 0,
    };
    const merged = { ...current, ...updates };
    supabase
      .from('inventory')
      .upsert({
        product_id:          merged.productId,
        quantity_goteborg:   merged.quantityGoteborg,
        quantity_skaraborg:  merged.quantitySkaraborg,
      })
      .then(({ error }) => {
        if (error) console.error('updateInventoryItem error', error.message);
      });
  };

  return { inventory, updateInventoryItem };
}
