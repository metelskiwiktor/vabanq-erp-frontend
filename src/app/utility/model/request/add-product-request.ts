export class AddProductRequest {
  public name?: string;
  public accessoryIds?: string[];
  public grammage?: number;
  public printTime?: PrintTime;
  public price?: string;
  public allegroTax?: string;
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
  public hours?: number;
  public minutes?: number;
}
