// src/app/utility/service/power-expense.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";

export interface PowerExpenseResponse {
  id: string;
  month: number;
  year: number;
  displayMonth: string;
  powerConsumptionKw: number;
  pricePerKwh: number;
  netAmount: number;
  grossAmount: number;
  lastUpdated: string;
  description?: string;
}

export interface CreatePowerExpenseRequest {
  month: number;
  year: number;
  powerConsumptionKw: number;
  pricePerKwh: number;
  description?: string;
}

export interface UpdatePowerExpenseRequest {
  powerConsumptionKw: number;
  pricePerKwh: number;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PowerExpenseService {
  private readonly baseUrl = `${environment.backendUrl}/api/expenses/power`;

  constructor(private http: HttpClient) { }

  /**
   * Creates a new power expense for specific month/year
   */
  createPowerExpense(request: CreatePowerExpenseRequest): Observable<PowerExpenseResponse> {
    return this.http.post<PowerExpenseResponse>(this.baseUrl, request);
  }

  /**
   * Updates existing power expense
   */
  updatePowerExpense(id: string, request: UpdatePowerExpenseRequest): Observable<PowerExpenseResponse> {
    return this.http.put<PowerExpenseResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Deletes power expense
   */
  deletePowerExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Gets power expense for specific month and year
   */
  getPowerExpenseForMonth(month: number, year: number): Observable<PowerExpenseResponse | null> {
    return this.http.get<PowerExpenseResponse>(`${this.baseUrl}/month/${month}/year/${year}`);
  }

  /**
   * Gets power expense by ID
   */
  getPowerExpense(id: string): Observable<PowerExpenseResponse> {
    return this.http.get<PowerExpenseResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Gets all power expenses
   */
  getAllPowerExpenses(): Observable<PowerExpenseResponse[]> {
    return this.http.get<PowerExpenseResponse[]>(`${this.baseUrl}/all`);
  }
}
