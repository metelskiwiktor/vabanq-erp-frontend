export interface ProductResponse {
  imageUrl?: string;
  id: string;
  name: string;
  ean: string;
  eanName: string;
  productAccessories: ProductAccessoriesResponse;
  printTime: PrintTime;
  price: number;
  allegroTax: number;
  description?: string;
  tags: string[];
  preview: ProductFile;
  files: ProductFile[];
  wms: Wms;
  laborCost: string;
}

export interface Wms {
  enabled: boolean;
  quantity: number;
  criticalStock: number;
}

export interface ProductAccessoriesResponse {
  fasteners: Array<Pair<number, FastenersAccessoryResponse>>;
  filaments: Array<Pair<number, FilamentAccessoryResponse>>;
  packagings: Array<Pair<number, PackagingAccessoryResponse>>;
}

export interface Pair<T, U> {
  first: T;
  second: U;
}

export interface FastenersAccessoryResponse {
  id: string;
  name: string;
  pricePerQuantity: number;
  quantity: number;
  description: string;
  wms: Wms;
}

export interface FilamentAccessoryResponse {
  id: string;
  name: string;
  producer: string;
  filamentType: string;
  printTemperature: number;
  deskTemperature: number;
  pricePerKg: number;
  color: string;
  description: string;
  quantity: number;
  wms: Wms;
}

export interface PackagingAccessoryResponse {
  id: string;
  name: string;
  packagingSize: string;
  dimensions: string;
  pricePerQuantity: number;
  quantity: number;
  description: string;
  wms: Wms;
}

export interface ProductFile {
  id: string;
  data: Uint8Array;
  filename: string;
}

export interface PrintTime {
  hours: number;
  minutes: number;
}
