export interface SaveProductRequest {
  name: string;
  ean: string;
  accessoriesQ: AccessoriesQ[];
  printHours: number;
  printMinutes: number;
  price: string;
  allegroTax: string;
}

export interface AccessoriesQ {
  id: string;
  quantity: number
}
