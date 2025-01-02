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
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  orderId: string;
  market: string;
  status: string;
  saleDate: string; // ISO date string
  buyer: BuyerOrder;
  delivery: DeliveryOrder;
  products: ProductOrder[];
  totalAmount: number;
}
