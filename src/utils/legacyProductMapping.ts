import type { OrderItem } from '../types';

// Maps old product names (with colorVariant) to new fixed display names
const LEGACY_NAME_MAP: Record<string, Record<string, string>> = {
  'Engångsduk 180 cm':        { Vit: 'Engångsduk 180 cm – Vit' },
  'Enkelduk Ø156 cm':         { Vit: 'Enkelduk Ø156 cm – Vit' },
  'Duk 180 cm':               { Vit: 'Duk 180 cm – Vit' },
  'Duk Ø156 cm':              { Vit: 'Duk Ø156 cm – Vit' },
  'Stolskjol':                { Vit: 'Stolskjol – Vit', Svart: 'Stolskjol – Svart' },
  // Handle both old typo and corrected spelling
  'Överdragsstumpa ståbord':  { Vit: 'Överdragsstrumpa ståbord – Vit', Svart: 'Överdragsstrumpa ståbord – Svart' },
  'Överdragsstrumpa ståbord': { Vit: 'Överdragsstrumpa ståbord – Vit', Svart: 'Överdragsstrumpa ståbord – Svart' },
};

// Maps old productId + colorVariant → new productId for inventory counting
const LEGACY_ID_MAP: Record<string, Record<string, string>> = {
  'duk-engangs-180':  { Vit: 'duk-engangs-180-vit' },
  'duk-enkel-rond':   { Vit: 'duk-enkel-rond-vit' },
  'duk-180-lang':     { Vit: 'duk-180-lang-vit' },
  'duk-rond-156':     { Vit: 'duk-rond-156-vit' },
  'stolskjol':        { Vit: 'stolskjol-vit', Svart: 'stolskjol-svart' },
  'overdrag-stabord': { Vit: 'overdrag-stabord-vit', Svart: 'overdrag-stabord-svart' },
};

/** Returns the display name for an item, resolving legacy name+color pairs to new fixed names. */
export function resolveDisplayName(item: Pick<OrderItem, 'productName' | 'colorVariant'>): string {
  if (item.colorVariant) {
    const mapped = LEGACY_NAME_MAP[item.productName]?.[item.colorVariant];
    if (mapped) return mapped;
    // Generic fallback: append color
    return `${item.productName} – ${item.colorVariant}`;
  }
  return item.productName;
}

/** Returns the effective productId for an item, mapping legacy id+color to new product ids. */
export function resolveProductId(item: Pick<OrderItem, 'productId' | 'colorVariant'>): string {
  if (item.colorVariant) {
    const mapped = LEGACY_ID_MAP[item.productId]?.[item.colorVariant];
    if (mapped) return mapped;
  }
  return item.productId;
}
