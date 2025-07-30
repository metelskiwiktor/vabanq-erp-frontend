// src/app/utility/service/raport.service.ts - Updated for new response structure
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../../environments/environment";

export interface FinancialReportResponse {
  revenue: number;
  materialCost: number;
  powerCost: number;
  packagingCost: number;
  laborCost: number;
  productionCost: number;
  vatCost: number;
  allegroCosts: { [key: string]: number };
  expensesByCategory: { [key: string]: number };
  expenses: number;
  profit: number;
  offers: OfferProfitabilityResponse[];
}

export interface OfferProfitabilityResponse {
  offerId: string;
  offerName: string;
  productNames: string[];
  quantitySold: number;
  pricePerQuantity: number;
  revenue: number;
  materialCost: number;
  powerCost: number;
  packagingCost: number;
  laborCost: number;
  productionCost: number;
  vatCost: number;
  allegroCosts: { [key: string]: number };
  profit: number;
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
