export interface OrderItem {
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  includesMontage: boolean;
  montageUnitPrice: number;
  colorVariant?: 'Vit' | 'Svart';
  isOffertPrice?: boolean;
  subComponents?: Record<string, number>;
  includesDishwashing?: boolean;
}

export interface Order {
  id: string;
  status: 'förfrågan' | 'bokning' | 'arkiverad' | 'avbokad';
  region: 'Göteborg' | 'Skaraborg';
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  postalCode: string;
  city: string;
  groundType: 'Ej angivet' | 'Gräs' | 'Altan' | 'Grus' | 'Asfalt' | 'Inomhus';
  eventDate: string;
  deliveryDate: string | null;
  pickupDate: string | null;
  selfPickup: boolean;
  items: OrderItem[];
  discountPercent: number;
  depositPaid: boolean;
  depositAmount: number;
  notes: string;
  quotePdfGenerated: boolean;
  confirmationPdfGenerated: boolean;
  quoteNumber?: number;
  confirmationNumber?: number;
  quoteValidityDays?: number | 'custom';
  quoteValidityCustomDate?: string;
  deliveryTime?: string;
  pickupTime?: string;
  archivedAt?: string;   // ISO timestamp – set when status → 'arkiverad' or 'avbokad'
  invoicedAt?: string;   // ISO timestamp – set when marked as fakturerad
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantityGoteborg: number;
  quantitySkaraborg: number;
}

export type Region = 'Alla' | 'Göteborg' | 'Skaraborg';
