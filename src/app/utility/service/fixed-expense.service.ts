import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from "../../../environments/environment";
import {AssignInvoiceToExpenseResponse} from "../model/expense-models";

export interface FixedExpenseResponse {
  id: string;
  name: string;
  category: string;
  netAmount: number;
  grossAmount: number;
  month: number;
  year: number;
  displayMonth: string;
  isRecurring: boolean;
  lastUpdated: string;
  description: string;
}

export interface CreateFixedExpenseRequest {
  name: string;
  category: string;
  netAmount: string;
  month: number;
  year: number;
  isRecurring: boolean;
  description: string;
}

export interface UpdateFixedExpenseRequest {
  name: string;
  category: string;
  netAmount: string;
  isRecurring: boolean;
  description: string;
}

export interface DeleteFixedExpenseRequest {
  applyToFutureMonths: boolean;
}

export interface PropagateExpensesRequest {
  targetMonth: number;
  targetYear: number;
}

export interface ExpenseSummaryResponse {
  month: number;
  year: number;
  displayMonth: string;
  totalNetAmount: number;
  totalGrossAmount: number;
  expenseCount: number;
  categorySummaries: CategorySummary[];
}

export interface CategorySummary {
  category: string;
  netAmount: number;
  grossAmount: number;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class FixedExpenseService {
  private readonly baseUrl = `${environment.backendUrl}/api/expenses/fixed`;

  constructor(private http: HttpClient) { }

  /**
   * Creates a new fixed expense
   */
  createFixedExpense(request: CreateFixedExpenseRequest): Observable<FixedExpenseResponse> {
    return this.http.post<FixedExpenseResponse>(this.baseUrl, request);
  }

  /**
   * Updates an existing fixed expense
   */
  updateFixedExpense(id: string, request: UpdateFixedExpenseRequest): Observable<FixedExpenseResponse> {
    return this.http.put<FixedExpenseResponse>(`${this.baseUrl}/${id}`, request);
  }

  /**
   * Deletes a fixed expense
   */
  deleteFixedExpense(id: string, request: DeleteFixedExpenseRequest): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { body: request });
  }

  /**
   * Gets all expenses for a specific month and year
   */
  getExpensesForMonth(month: number, year: number): Observable<FixedExpenseResponse[]> {
    return this.http.get<FixedExpenseResponse[]>(`${this.baseUrl}/month/${month}/year/${year}`);
  }

  /**
   * Gets expense summary for a specific month and year
   */
  getExpenseSummary(month: number, year: number): Observable<ExpenseSummaryResponse> {
    return this.http.get<ExpenseSummaryResponse>(`${this.baseUrl}/summary/${month}/${year}`);
  }

  assignInvoice(expenseId: string, invoiceId: string): Observable<AssignInvoiceToExpenseResponse> {
    return this.http.post<AssignInvoiceToExpenseResponse>(
      `${this.baseUrl}/${expenseId}/assign-invoice`,
      { invoiceId }
    );
  }

  /**
   * Usuń przypisanie faktury od kosztu stałego
   */
  unassignInvoice(expenseId: string, invoiceId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${expenseId}/invoices/${invoiceId}`
    );
  }
}
