export interface BuyerOrder {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  language: string;
}

export interface AddressOrder {
  street: string;
  city: string;
  postCode: string;
  countryCode: string;
}

export interface DeliveryOrder {
  methodName: string;
  cost: number;
  dispatchTimeFrom: string; // ISO date string
  dispatchTimeTo: string; // ISO date string
  deliveryTimeFrom: string; // ISO date string
  deliveryTimeTo: string; // ISO date string
  deliveryAddress: AddressOrder;
}

export interface ProductOrder {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceInfo {
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
  invoiceUrl: string;
  createdAt: string;
  // Nowe pola dla integracji z Allegro
  isAttachedToAllegro?: boolean;
  allegroInvoiceId?: string;
  isAttachingToAllegro?: boolean;
  allegroAttachmentError?: string;
}

export interface Order {
  orderId: string;
  market: string;
  status: string;
  saleDate: string;
  buyer: BuyerOrder;
  delivery: DeliveryOrder;
  products: ProductOrder[];
  totalAmount: number;
  sellerId: string;
  isExpanded?: boolean;
  invoices?: InvoiceInfo[];
  isInvoiceGenerating?: boolean;
}
