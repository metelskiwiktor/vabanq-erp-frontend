import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";

export interface VariableExpenseResponse {
  id: string;
  name: string;
  category: string;
  netAmount: number;
  grossAmount: number;
  expenseDate: string;
  supplier: string;
  createdAt: string;
  description: string;
  formattedDate: string;
  month: number;
  year: number;
}

export interface VariableExpenseSummaryResponse {
  month: number;
  year: number;
  displayMonth: string;
  totalNetAmount: number;
  totalGrossAmount: number;
  expenseCount: number;
  categorySummaries: CategorySummary[];
  supplierSummaries: SupplierSummary[];
}

export interface CategorySummary {
  category: string;
  netAmount: number;
  grossAmount: number;
  count: number;
}

export interface SupplierSummary {
  supplier: string;
  netAmount: number;
  grossAmount: number;
  count: number;
}

export interface CreateVariableExpenseRequest {
  name: string;
  category: string;
  netAmount: string;
  expenseDate: string;
  supplier: string;
  description?: string;
}

export interface UpdateVariableExpenseRequest {
  name: string;
  category: string;
  netAmount: string;
  expenseDate: string;
  supplier: string;
  description?: string;
}

export interface TotalResponse {
  netTotal: number;
  grossTotal: number;
}

@Injectable({
  providedIn: 'root'
})
export class VariableExpenseService {
  private readonly baseUrl = `${environment.backendUrl}/api/expenses/variable`;

  constructor(private http: HttpClient) { }

  createVariableExpense(request: CreateVariableExpenseRequest): Observable<VariableExpenseResponse> {
    return this.http.post<VariableExpenseResponse>(this.baseUrl, request);
  }

  updateVariableExpense(id: string, request: UpdateVariableExpenseRequest): Observable<VariableExpenseResponse> {
    return this.http.put<VariableExpenseResponse>(`${this.baseUrl}/${id}`, request);
  }

  deleteVariableExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getVariableExpense(id: string): Observable<VariableExpenseResponse> {
    return this.http.get<VariableExpenseResponse>(`${this.baseUrl}/${id}`);
  }

  getExpensesForMonth(month: number, year: number): Observable<VariableExpenseResponse[]> {
    return this.http.get<VariableExpenseResponse[]>(`${this.baseUrl}/month/${month}/year/${year}`);
  }

  getExpenseSummary(month: number, year: number): Observable<VariableExpenseSummaryResponse> {
    return this.http.get<VariableExpenseSummaryResponse>(`${this.baseUrl}/summary/${month}/${year}`);
  }

  getExpensesByCategory(category: string): Observable<VariableExpenseResponse[]> {
    return this.http.get<VariableExpenseResponse[]>(`${this.baseUrl}/category/${category}`);
  }

  getExpensesBySupplier(supplier: string): Observable<VariableExpenseResponse[]> {
    return this.http.get<VariableExpenseResponse[]>(`${this.baseUrl}/supplier/${supplier}`);
  }

  getExpensesForDateRange(startDate: string, endDate: string): Observable<VariableExpenseResponse[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<VariableExpenseResponse[]>(`${this.baseUrl}/date-range`, { params });
  }

  getAllExpenses(): Observable<VariableExpenseResponse[]> {
    return this.http.get<VariableExpenseResponse[]>(`${this.baseUrl}/all`);
  }

  getAllSuppliers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/suppliers`);
  }

  getTotalForMonth(month: number, year: number): Observable<TotalResponse> {
    return this.http.get<TotalResponse>(`${this.baseUrl}/total/${month}/${year}`);
  }
}
