import type { OrderItem } from '../types';

// Old product IDs that had hasColorVariant – default to 'Vit' when colorVariant is absent
// (items created before the default-colorVariant fix have colorVariant: undefined)
const LEGACY_TEXTILE_IDS = new Set([
  'duk-engangs-180',
  'duk-enkel-rond',
  'duk-180-lang',
  'duk-240-lang',
  'duk-rond-156',
  'duk-rond-180',
  'stolskjol',
  'overdrag-stabord',
]);

// Old product base-names (lower-cased for case-insensitive matching)
const LEGACY_TEXTILE_NAMES_LC = new Set([
  'engångsduk 180 cm',
  'enkelduk ø156 cm',
  'duk 180 cm',
  'duk 240 cm',
  'duk ø156 cm',
  'duk ø180 cm',
  'stolskjol',
  'överdragsstumpa ståbord',  // old typo
  'överdragsstrumpa ståbord', // corrected spelling
]);

// Maps (productName + colorVariant) → new fixed display name
// Uses lower-cased productName as key for case-insensitive lookup
const LEGACY_NAME_MAP: Record<string, Record<string, string>> = {
  'engångsduk 180 cm':        { Vit: 'Engångsduk 180 cm – Vit' },
  'enkelduk ø156 cm':         { Vit: 'Enkelduk Ø156 cm – Vit' },
  'duk 180 cm':               { Vit: 'Duk 180 cm – Vit' },
  'duk ø156 cm':              { Vit: 'Duk Ø156 cm – Vit' },
  'stolskjol':                { Vit: 'Stolskjol – Vit', Svart: 'Stolskjol – Svart' },
  'överdragsstumpa ståbord':  { Vit: 'Överdragsstrumpa ståbord – Vit', Svart: 'Överdragsstrumpa ståbord – Svart' },
  'överdragsstrumpa ståbord': { Vit: 'Överdragsstrumpa ståbord – Vit', Svart: 'Överdragsstrumpa ståbord – Svart' },
};

// Maps (productId + colorVariant) → new productId
const LEGACY_ID_MAP: Record<string, Record<string, string>> = {
  'duk-engangs-180':  { Vit: 'duk-engangs-180-vit' },
  'duk-enkel-rond':   { Vit: 'duk-enkel-rond-vit' },
  'duk-180-lang':     { Vit: 'duk-180-lang-vit' },
  'duk-240-lang':     { Vit: 'duk-engangs-180-vit' }, // discontinued – map to nearest equivalent
  'duk-rond-156':     { Vit: 'duk-rond-156-vit' },
  'duk-rond-180':     { Vit: 'duk-rond-156-vit' }, // discontinued – map to nearest equivalent
  'stolskjol':        { Vit: 'stolskjol-vit', Svart: 'stolskjol-svart' },
  'overdrag-stabord': { Vit: 'overdrag-stabord-vit', Svart: 'overdrag-stabord-svart' },
};

/** Resolve the effective color for a legacy textile item (defaults to 'Vit' if missing). */
function effectiveColor(item: Pick<OrderItem, 'productId' | 'colorVariant'>): string {
  if (item.colorVariant) return item.colorVariant;
  if (LEGACY_TEXTILE_IDS.has(item.productId)) return 'Vit';
  return '';
}

/**
 * Returns the display name for an order item.
 * Resolves legacy name+color pairs (including missing colorVariant) to new fixed names.
 */
export function resolveDisplayName(item: Pick<OrderItem, 'productId' | 'productName' | 'colorVariant'>): string {
  const nameLc = item.productName?.toLowerCase() ?? '';
  const isLegacyName = LEGACY_TEXTILE_NAMES_LC.has(nameLc);
  const isLegacyId   = LEGACY_TEXTILE_IDS.has(item.productId);

  if (isLegacyName || isLegacyId) {
    const color = item.colorVariant || (isLegacyId ? 'Vit' : '');
    if (color) {
      const mapped = LEGACY_NAME_MAP[nameLc]?.[color];
      if (mapped) return mapped;
      // Generic fallback if name isn't in map but color is known
      return `${item.productName} – ${color}`;
    }
  }

  // Non-legacy items: append colorVariant if present (normal behavior)
  if (item.colorVariant) return `${item.productName} – ${item.colorVariant}`;
  return item.productName;
}

/**
 * Returns the effective productId for an item.
 * Maps legacy id+color (including missing colorVariant → default 'Vit') to new product ids.
 */
export function resolveProductId(item: Pick<OrderItem, 'productId' | 'colorVariant'>): string {
  const color = effectiveColor(item);
  if (color) {
    const mapped = LEGACY_ID_MAP[item.productId]?.[color];
    if (mapped) return mapped;
  }
  return item.productId;
}
