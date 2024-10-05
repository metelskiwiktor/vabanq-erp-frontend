export interface ProductResponse {
  id: string;
  name: string;
  ean: string;
  productAccessories: ProductAccessoriesResponse;
  printTime: PrintTime;
  price: number;
  allegroTax: number;
  description: string;
  preview: ProductFile;
  files: ProductFile[];
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
  netPricePerQuantity: number;
  quantity: number;
  description: string;
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
}

export interface PackagingAccessoryResponse {
  id: string;
  name: string;
  packagingSize: string;
  dimensions: string;
  netPricePerQuantity: number;
  quantity: number;
  description: string;
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
