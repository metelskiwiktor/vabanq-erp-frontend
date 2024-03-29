export class AddProductRequest {
  public name?: string;
  public accessoryIds?: string[];
  public printTime?: PrintTime;
  public price: number = 0;
  public allegroTax: number = 0;
  public ean?: string;
}

export class AddMaterialRequest {
  public name?: string;
  public price?: string;
  public accessoryType?: string;
  public packagingSize?: string;
  public dimensions?: string;
  public color?: string;
  public temperaturePrint?: string;
  public temperatureDesk?: string;
  public producer?: string;
  public filamentType?: string;
}

export class PrintTime {
  constructor(hours?: number, minutes?: number) {
    this.hours = hours;
    this.minutes = minutes;
  }

  public hours?: number;
  public minutes?: number;
}
