// src/app/utility/service/raport.service.ts - Updated interface
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../../environments/environment";

export interface PricePair {
  net: number;
  gross: number;
}

export interface FinancialReportResponse {
  revenue: PricePair;
  materialCost: PricePair;
  powerCost: PricePair;
  packagingCost: PricePair;
  laborCost: PricePair;
  productionCost: PricePair;
  allegroCosts: { [key: string]: PricePair }; // New field for monthly Allegro costs
  expenses: PricePair;
  profit: PricePair;
  offers: OfferProfitabilityResponse[];
}

export interface OfferProfitabilityResponse {
  offerId: string;
  offerName: string;
  productNames: string[];
  quantitySold: number;
  pricePerQuantity: PricePair;
  revenue: PricePair;
  materialCost: PricePair;
  powerCost: PricePair;
  packagingCost: PricePair;
  laborCost: PricePair;
  productionCost: PricePair;
  allegroCosts?: { [key: string]: PricePair }; // New field for per-offer Allegro costs
  profit: PricePair;
}

@Injectable({
  providedIn: 'root'
})
export class RaportService {
  private readonly apiUrl = `${environment.backendUrl}/api/raport`;

  constructor(private http: HttpClient) {}

  getFinancialReport(month?: string): Observable<FinancialReportResponse> {
    let params = new HttpParams();

    if (month) {
      params = params.set('month', month);
    }

    return this.http.get<FinancialReportResponse>(this.apiUrl, { params });
  }
}
