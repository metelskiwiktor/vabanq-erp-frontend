export interface CreateWmsRequest {
  id: ItemIdentifiable;
  currentStock: number;
  criticalStock: number;
  children: ChildrenWms[];
}

export interface ItemIdentifiable {
  id: string;
  name: string;
}

export interface ChildrenWms {
  id: string;
  quantity: number;
}
