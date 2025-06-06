export enum PaymentStatus {
  BOUGHT = 'BOUGHT',
  FILLED_IN = 'FILLED_IN',
  READY_FOR_PROCESSING = 'READY_FOR_PROCESSING',
  CANCELLED = 'CANCELLED',
  INVALID_STATUS = 'INVALID_STATUS'
}

export enum OrderStatus {
  NEW = 'NEW',
  PROCESSING = 'PROCESSING',
  READY_FOR_SHIPMENT = 'READY_FOR_SHIPMENT',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  SENT = 'SENT',
  PICKED_UP = 'PICKED_UP',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  RETURNED = 'RETURNED',
  INVALID_STATUS = 'INVALID_STATUS'
}

export interface BuyerOrder {
  buyerId: string;
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  language: string;
  companyName: string;
}

export interface AddressOrder {
  addressFirstName?: string;
  addressLastName?: string;
  street?: string;
  city: string;
  postCode: string;
  countryCode: string;
  companyName?: string;
  addressPhoneNumber?: string;
}

export interface DeliveryOrder {
  methodName: string;
  cost: number;
  dispatchTimeFrom: string; // ISO date string
  dispatchTimeTo: string; // ISO date string
  deliveryTimeFrom: string; // ISO date string
  deliveryTimeTo: string; // ISO date string
  deliveryAddress?: AddressOrder;
}

export interface ProductOrder {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
}

export interface InvoiceInfo {
  invoiceId: string;
  invoiceNumber: string;
  invoiceStatus: string;
  invoiceUrl: string;
  createdAt: string;
  isAttachedToAllegro?: boolean;
  allegroInvoiceId?: string;
  isAttachingToAllegro?: boolean;
  allegroAttachmentError?: string;
}

export interface InvoiceOrder {
  invoiceRequired: boolean;
  nip?: string;
  hasNip: boolean;
  companyName?: string;
  address?: AddressOrder;
}

export interface Order {
  orderId: string;
  market: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  saleDate: string;
  buyer: BuyerOrder;
  delivery: DeliveryOrder;
  products: ProductOrder[];
  totalAmount: number;
  currency: string;
  sellerId: string;
  invoice: InvoiceOrder;
  isExpanded?: boolean;
  invoices?: InvoiceInfo[];
  isInvoiceGenerating?: boolean;
}
