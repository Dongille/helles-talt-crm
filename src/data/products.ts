export interface ProductDefinition {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  basePrice: number | 'offert';
  montagePrice: number | 'offert';
  hasMontage: boolean;
  hasColorVariant?: boolean;
  unit?: string;
  isCustomPorslin?: boolean;
  hasDishwashing?: boolean;
}

export const PRODUCT_CATEGORIES = [
  'Paketerbjudanden',
  'Partytält',
  'Möbler – Stolar & Bänkset',
  'Möbler – Bord & Ståbord',
  'Möbler – Dukar & Överdrag',
  'Porslin & Bestick',
  'Festutrustning & Övrigt',
] as const;

export const PRODUCTS: ProductDefinition[] = [
  // Paketerbjudanden
  { id: 'pak-4x6-enkelt', name: 'Enkelt paket 4x6 m', category: 'Paketerbjudanden', basePrice: 2400, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x8-enkelt', name: 'Enkelt paket 4x8 m', category: 'Paketerbjudanden', basePrice: 2800, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x10-enkelt', name: 'Enkelt paket 4x10 m', category: 'Paketerbjudanden', basePrice: 3200, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x6-standard', name: 'Standard paket 4x6 m', category: 'Paketerbjudanden', basePrice: 3800, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x8-standard', name: 'Standard paket 4x8 m', category: 'Paketerbjudanden', basePrice: 4600, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x10-standard', name: 'Standard paket 4x10 m', category: 'Paketerbjudanden', basePrice: 5400, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x6-premium', name: 'Premium paket 4x6 m', category: 'Paketerbjudanden', basePrice: 4700, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x8-premium', name: 'Premium paket 4x8 m', category: 'Paketerbjudanden', basePrice: 5800, montagePrice: 0, hasMontage: false },
  { id: 'pak-4x10-premium', name: 'Premium paket 4x10 m', category: 'Paketerbjudanden', basePrice: 6900, montagePrice: 0, hasMontage: false },

  // Partytält Semi
  { id: 'talt-semi-4x6', name: 'Partytält semi 4x6 m', category: 'Partytält', subcategory: 'Partytält Semi', basePrice: 2400, montagePrice: 1400, hasMontage: true },
  { id: 'talt-semi-4x8', name: 'Partytält semi 4x8 m', category: 'Partytält', subcategory: 'Partytält Semi', basePrice: 2800, montagePrice: 1800, hasMontage: true },
  { id: 'talt-semi-4x10', name: 'Partytält semi 4x10 m', category: 'Partytält', subcategory: 'Partytält Semi', basePrice: 3200, montagePrice: 2200, hasMontage: true },

  // Partytält Pro
  { id: 'talt-pro-4x8', name: 'Partytält pro 4x8 m', category: 'Partytält', subcategory: 'Partytält Pro', basePrice: 3200, montagePrice: 2200, hasMontage: true },
  { id: 'talt-pro-6x12', name: 'Partytält pro 6x12 m', category: 'Partytält', subcategory: 'Partytält Pro', basePrice: 4600, montagePrice: 3400, hasMontage: true },
  { id: 'talt-pro-8x16', name: 'Partytält pro 8x16 m', category: 'Partytält', subcategory: 'Partytält Pro', basePrice: 'offert', montagePrice: 'offert', hasMontage: true },

  // Sektionstält
  { id: 'talt-sek-9x18', name: 'Sektionstält 9x18 m', category: 'Partytält', subcategory: 'Sektionstält', basePrice: 'offert', montagePrice: 'offert', hasMontage: true },
  { id: 'talt-sek-12x24', name: 'Sektionstält 12x24 m', category: 'Partytält', subcategory: 'Sektionstält', basePrice: 'offert', montagePrice: 'offert', hasMontage: true },
  { id: 'talt-sek-15x30', name: 'Sektionstält 15x30 m', category: 'Partytält', subcategory: 'Sektionstält', basePrice: 'offert', montagePrice: 'offert', hasMontage: true },

  // Pagodatält
  { id: 'talt-pag-5x5', name: 'Pagodatält 5x5 m', category: 'Partytält', subcategory: 'Pagodatält', basePrice: 2800, montagePrice: 2600, hasMontage: true },
  { id: 'talt-pag-5x10', name: 'Pagodatält 5x10 m', category: 'Partytält', subcategory: 'Pagodatält', basePrice: 4200, montagePrice: 3200, hasMontage: true },
  { id: 'talt-pag-5x15', name: 'Pagodatält 5x15 m', category: 'Partytält', subcategory: 'Pagodatält', basePrice: 5600, montagePrice: 3600, hasMontage: true },

  // Pop-up tält
  { id: 'talt-pop-3x3', name: 'Pop-up tält 3x3 m', category: 'Partytält', subcategory: 'Pop-up tält', basePrice: 1200, montagePrice: 800, hasMontage: true },
  { id: 'talt-pop-3x6', name: 'Pop-up tält 3x6 m', category: 'Partytält', subcategory: 'Pop-up tält', basePrice: 1800, montagePrice: 1000, hasMontage: true },
  { id: 'talt-pop-3x9', name: 'Pop-up tält 3x9 m', category: 'Partytält', subcategory: 'Pop-up tält', basePrice: 2400, montagePrice: 1200, hasMontage: true },

  // Möbler – Stolar & Bänkset (Sittplatser)
  { id: 'stol-klapp-vit', name: 'Klappstol vit', category: 'Möbler – Stolar & Bänkset', basePrice: 15, montagePrice: 5, hasMontage: true },
  { id: 'stol-klapp-svart', name: 'Klappstol svart', category: 'Möbler – Stolar & Bänkset', basePrice: 15, montagePrice: 5, hasMontage: true },
  { id: 'stol-klapp-tra', name: 'Klappstol trä', category: 'Möbler – Stolar & Bänkset', basePrice: 25, montagePrice: 5, hasMontage: true },
  { id: 'stol-pvc', name: 'PVC stol', category: 'Möbler – Stolar & Bänkset', basePrice: 25, montagePrice: 5, hasMontage: true },
  { id: 'stol-brollop', name: 'Bröllopstol', category: 'Möbler – Stolar & Bänkset', basePrice: 55, montagePrice: 15, hasMontage: true },
  { id: 'bankset-vit', name: 'Bänkar vit', category: 'Möbler – Stolar & Bänkset', basePrice: 45, montagePrice: 5, hasMontage: true },
  { id: 'barstol-vit', name: 'Barstol vit', category: 'Möbler – Stolar & Bänkset', basePrice: 55, montagePrice: 15, hasMontage: true },

  // Möbler – Bord & Ståbord (Bord)
  { id: 'bord-180', name: 'Bord 180x75 cm', category: 'Möbler – Bord & Ståbord', basePrice: 60, montagePrice: 10, hasMontage: true },
  { id: 'bord-240', name: 'Bord 240x75 cm', category: 'Möbler – Bord & Ståbord', basePrice: 140, montagePrice: 20, hasMontage: true },
  { id: 'bord-150x180', name: 'Bord 150x180 cm', category: 'Möbler – Bord & Ståbord', basePrice: 120, montagePrice: 20, hasMontage: true },
  { id: 'bord-rond-156', name: 'Bord Ø156 cm', category: 'Möbler – Bord & Ståbord', basePrice: 210, montagePrice: 20, hasMontage: true },
  { id: 'bord-180-rund', name: 'Bord Ø180 cm', category: 'Möbler – Bord & Ståbord', basePrice: 240, montagePrice: 20, hasMontage: true },
  { id: 'stabord-80', name: 'Ståbord Ø80 cm', category: 'Möbler – Bord & Ståbord', basePrice: 110, montagePrice: 10, hasMontage: true },

  // Möbler – Dukar & Överdrag (Textiler)
  { id: 'duk-engangs-180', name: 'Engångsduk 180 cm', category: 'Möbler – Dukar & Överdrag', basePrice: 40, montagePrice: 10, hasMontage: true, hasColorVariant: true },
  { id: 'duk-enkel-rond', name: 'Enkelduk Ø156 cm', category: 'Möbler – Dukar & Överdrag', basePrice: 80, montagePrice: 10, hasMontage: true, hasColorVariant: true },
  { id: 'duk-180-lang', name: 'Duk 180 cm', category: 'Möbler – Dukar & Överdrag', basePrice: 140, montagePrice: 10, hasMontage: true, hasColorVariant: true },
  { id: 'duk-240-lang', name: 'Duk 240 cm', category: 'Möbler – Dukar & Överdrag', basePrice: 180, montagePrice: 10, hasMontage: true, hasColorVariant: true },
  { id: 'duk-rond-156', name: 'Duk Ø156 cm', category: 'Möbler – Dukar & Överdrag', basePrice: 220, montagePrice: 10, hasMontage: true, hasColorVariant: true },
  { id: 'duk-rond-180', name: 'Duk Ø180 cm', category: 'Möbler – Dukar & Överdrag', basePrice: 260, montagePrice: 10, hasMontage: true, hasColorVariant: true },
  { id: 'stolskjol', name: 'Stolskjol', category: 'Möbler – Dukar & Överdrag', basePrice: 40, montagePrice: 5, hasMontage: true, hasColorVariant: true },
  { id: 'overdrag-stabord', name: 'Överdragsstumpa ståbord', category: 'Möbler – Dukar & Överdrag', basePrice: 80, montagePrice: 10, hasMontage: true, hasColorVariant: true },

  // Porslin & Bestick (visas under Festutrustning → Porslin)
  { id: 'porslin-8del', name: 'Porslinspaket 8-delar', category: 'Porslin & Bestick', basePrice: 40, montagePrice: 10, hasMontage: true, unit: 'person', hasDishwashing: true },
  { id: 'porslin-10del', name: 'Porslinspaket 10-delar', category: 'Porslin & Bestick', basePrice: 50, montagePrice: 10, hasMontage: true, unit: 'person', hasDishwashing: true },
  { id: 'porslin-skraddarsy', name: 'Skräddarsy porslinspaket', category: 'Porslin & Bestick', basePrice: 'offert', montagePrice: 0, hasMontage: false, isCustomPorslin: true },

  // Festutrustning & Övrigt
  { id: 'golv-m2', name: 'Golv m²', category: 'Festutrustning & Övrigt', basePrice: 50, montagePrice: 15, hasMontage: true },
  { id: 'ljusslinga-10m', name: 'Ljusslingor 10m', category: 'Festutrustning & Övrigt', basePrice: 240, montagePrice: 80, hasMontage: true },
  { id: 'hogtalare', name: 'Högtalare', category: 'Festutrustning & Övrigt', basePrice: 800, montagePrice: 20, hasMontage: true },
  { id: 'infravarme', name: 'Infravärme 1,5 kW', category: 'Festutrustning & Övrigt', basePrice: 260, montagePrice: 40, hasMontage: true },
  { id: 'kyl-30l', name: 'Partycooler 30 L', category: 'Festutrustning & Övrigt', basePrice: 280, montagePrice: 20, hasMontage: true },
  { id: 'mobil-bar', name: 'Mobil bar', category: 'Festutrustning & Övrigt', basePrice: 800, montagePrice: 40, hasMontage: true },
  { id: 'entre-2x6', name: 'Entré 2x6 m', category: 'Festutrustning & Övrigt', basePrice: 900, montagePrice: 90, hasMontage: true },
  { id: 'parasoll', name: 'Parasoll', category: 'Festutrustning & Övrigt', basePrice: 580, montagePrice: 80, hasMontage: true },
];
