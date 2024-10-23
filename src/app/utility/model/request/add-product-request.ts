export class AddProductRequest {
  name: string = '';
  ean: string = '';
  accessoriesQ: { quantity: number, id: string }[] = [];
  printHours: number = 0;
  printMinutes: number = 0;
  price: string = '';
  allegroTax: string = '';
  description: string = '';  // Dodajemy pole opisu,
  tags: string[] = [];
}

export class AddMaterialRequest {
  public name?: string;
  public price?: string;
  public accessoryType?: string;
  public color?: string;
  public temperaturePrint?: string;
  public temperatureDesk?: string;
  public producer?: string;
  public filamentType?: string;
  public description?: string;
  public quantity?: number = 0;
}

export class PrintTime {
  constructor(hours?: number, minutes?: number) {
    this.hours = hours;
    this.minutes = minutes;
  }

  public hours?: number;
  public minutes?: number;
}

export interface GroupedAccessoriesResponse {
  fasteners: FastenersAccessoryResponse[];
  filaments: FilamentAccessoryResponse[];
  packages: PackagingAccessoryResponse[];
}

export interface FastenersAccessoryResponse {
  id: string;
  name: string;
  netPricePerQuantity: string;
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
  pricePerKg: string;
  color: string;
  description: string;
  quantity: number;
}

export interface PackagingAccessoryResponse {
  id: string;
  name: string;
  packagingSize: string;
  dimensions: string;
  netPricePerQuantity: string;
  quantity: number;
  description: string;
}
