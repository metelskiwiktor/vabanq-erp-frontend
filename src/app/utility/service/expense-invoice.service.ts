import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AssignInvoiceToExpenseRequest,
  AssignInvoiceToExpenseResponse,
  UnassignInvoiceFromExpenseRequest,
  LinkedInvoice
} from '../model/expense-models';

@Injectable({
  providedIn: 'root'
})
export class ExpenseInvoiceService {
  private readonly apiUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  /**
   * Przypisz fakturę do wydatku
   */
  assignInvoiceToExpense(request: AssignInvoiceToExpenseRequest): Observable<AssignInvoiceToExpenseResponse> {
    return this.http.post<AssignInvoiceToExpenseResponse>(
      `${this.apiUrl}/api/expenses/assign-invoice`,
      request
    );
  }

  /**
   * Usuń przypisanie faktury od wydatku
   */
  unassignInvoiceFromExpense(request: UnassignInvoiceFromExpenseRequest): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/expenses/${request.expenseId}/invoices/${request.invoiceId}?type=${request.expenseType}`
    );
  }

  /**
   * Pobierz faktury przypisane do wydatku
   */
  getExpenseInvoices(expenseId: string, expenseType: 'fixed' | 'variable'): Observable<LinkedInvoice[]> {
    return this.http.get<LinkedInvoice[]>(
      `${this.apiUrl}/api/expenses/${expenseId}/invoices?type=${expenseType}`
    );
  }

  /**
   * Pobierz dostępne faktury do przypisania (nieprzypisane do innych wydatków)
   */
  getAvailableInvoicesForExpense(expenseId?: string): Observable<LinkedInvoice[]> {
    const url = expenseId
      ? `${this.apiUrl}/api/expenses/available-invoices?excludeExpenseId=${expenseId}`
      : `${this.apiUrl}/api/expenses/available-invoices`;

    return this.http.get<LinkedInvoice[]>(url);
  }
}
