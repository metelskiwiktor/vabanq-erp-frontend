import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";

export interface ProductCostResponse {
  productId: string;
  productName: string;
  ean: string;
  materialCost: number;
  powerCost: number;
  packagingCost: number;
  laborCost: number;
  totalCost: number;
  retailPrice: number;
  margin: number;
  grossMaterialCost: number;
  grossPowerCost: number;
  grossPackagingCost: number;
  grossLaborCost: number;
  grossTotalCost: number;
  grossRetailPrice: number;
}

export interface OfferCostResponse {
  offerId: string;
  offerName: string;
  productNames: string[];
  productsIncluded: string;
  totalCost: number;
  offerPrice: number;
  margin: number;
  totalProducts: number;
  grossTotalCost: number;
  grossOfferPrice: number;
}

export interface ProductCostSummaryResponse {
  totalProducts: number;
  totalMaterialCost: number;
  totalPowerCost: number;
  totalPackagingCost: number;
  totalLaborCost: number;
  totalCost: number;
  totalRetailValue: number;
  averageMargin: number;
  grossTotalMaterialCost: number;
  grossTotalPowerCost: number;
  grossTotalPackagingCost: number;
  grossTotalLaborCost: number;
  grossTotalCost: number;
  grossTotalRetailValue: number;
}

export interface OfferCostSummaryResponse {
  totalOffers: number;
  totalProducts: number;
  totalCost: number;
  totalOfferValue: number;
  averageMargin: number;
  grossTotalCost: number;
  grossTotalOfferValue: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductCostService {
  private readonly apiUrl = `${environment.backendUrl}/api/product-costs`;

  constructor(private http: HttpClient) {}

  getProductCosts(searchQuery?: string): Observable<ProductCostResponse[]> {
    let params = new HttpParams();
    if (searchQuery && searchQuery.trim()) {
      params = params.set('search', searchQuery.trim());
    }

    return this.http.get<ProductCostResponse[]>(`${this.apiUrl}/products`, { params });
  }

  getOfferCosts(searchQuery?: string): Observable<OfferCostResponse[]> {
    let params = new HttpParams();
    if (searchQuery && searchQuery.trim()) {
      params = params.set('search', searchQuery.trim());
    }

    return this.http.get<OfferCostResponse[]>(`${this.apiUrl}/offers`, { params });
  }

  getProductCostsSummary(): Observable<ProductCostSummaryResponse> {
    return this.http.get<ProductCostSummaryResponse>(`${this.apiUrl}/products/summary`);
  }

  getOfferCostsSummary(): Observable<OfferCostSummaryResponse> {
    return this.http.get<OfferCostSummaryResponse>(`${this.apiUrl}/offers/summary`);
  }
}
