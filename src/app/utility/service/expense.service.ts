// src/app/utility/service/expense.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExpenseResponse {
  netAmount: number;
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  tags: string[];
  totalCost: number;
  createdAt: string;
}

export interface CreateExpenseRequest {
  name: string;
  description?: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  tags: string[];
}

export interface AttachInvoiceRequest {
  costInvoiceId: string;
}

export interface CreateExpenseItemRequest {
  name: string;
  amount: number;
}

export interface UpdateExpenseRequest {
  name?: string;
  description?: string;
}

export interface UpdateExpenseItemRequest {
  name: string;
  amount: number;
}

export interface ExpenseTagResponse {
  id: string;
  name: string;
}

export interface CreateExpenseTagRequest {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly apiUrl = `${environment.backendUrl}/api/expenses`;

  constructor(private http: HttpClient) {}

  /**
   * Utwórz nowy wydatek
   */
  createExpense(request: CreateExpenseRequest): Observable<ExpenseResponse> {
    return this.http.post<ExpenseResponse>(this.apiUrl, request);
  }

  /**
   * Pobierz wydatek po ID
   */
  getExpense(id: string): Observable<ExpenseResponse> {
    return this.http.get<ExpenseResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Przypisz fakturę do wydatku
   */
  attachInvoiceToExpense(expenseId: string, request: AttachInvoiceRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${expenseId}/invoice-expenses`, request);
  }

  /**
   * Dodaj manualną pozycję do wydatku
   */
  addManualItem(expenseId: string, request: CreateExpenseItemRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${expenseId}/items`, request);
  }

  /**
   * Aktualizuj wydatek
   */
  updateExpense(expenseId: string, request: UpdateExpenseRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${expenseId}`, request);
  }

  /**
   * Aktualizuj pozycję wydatku
   */
  updateExpenseItem(expenseId: string, itemId: string, request: UpdateExpenseItemRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${expenseId}/items/${itemId}`, request);
  }

  /**
   * Usuń pozycję z wydatku
   */
  deleteExpenseItem(expenseId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${expenseId}/items/${itemId}`);
  }

  /**
   * Lista wydatków dla miesiąca
   */
  listExpenses(month?: string): Observable<ExpenseResponse[]> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<ExpenseResponse[]>(this.apiUrl, { params });
  }

  /**
   * Utwórz nowy tag
   */
  createTag(request: CreateExpenseTagRequest): Observable<ExpenseTagResponse> {
    return this.http.post<ExpenseTagResponse>(`${this.apiUrl}/tags`, request);
  }

  /**
   * Lista wszystkich tagów
   */
  listTags(): Observable<ExpenseTagResponse[]> {
    return this.http.get<ExpenseTagResponse[]>(`${this.apiUrl}/tags`);
  }

  /**
   * Mapowanie kategorii na display names
   */
  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'MATERIALS': 'Materiały',
      'OFFICE': 'Biuro',
      'MARKETING': 'Marketing',
      'UTILITIES': 'Media',
      'SERVICES': 'Usługi',
      'RENT': 'Czynsz',
      'INSURANCE': 'Ubezpieczenia',
      'SOFTWARE': 'Oprogramowanie',
      'TRANSPORT': 'Transport',
      'OTHER': 'Inne'
    };
    return categoryMap[category] || category;
  }

  /**
   * Mapowanie typów na display names
   */
  getTypeDisplayName(type: 'FIXED' | 'VARIABLE'): string {
    return type === 'FIXED' ? 'Stały' : 'Zmienny';
  }

  /**
   * Dostępne kategorie
   */
  getAvailableCategories(): { key: string; displayName: string }[] {
    return [
      { key: 'MATERIALS', displayName: 'Materiały' },
      { key: 'OFFICE', displayName: 'Biuro' },
      { key: 'MARKETING', displayName: 'Marketing' },
      { key: 'UTILITIES', displayName: 'Media' },
      { key: 'SERVICES', displayName: 'Usługi' },
      { key: 'RENT', displayName: 'Czynsz' },
      { key: 'INSURANCE', displayName: 'Ubezpieczenia' },
      { key: 'SOFTWARE', displayName: 'Oprogramowanie' },
      { key: 'TRANSPORT', displayName: 'Transport' },
      { key: 'OTHER', displayName: 'Inne' }
    ];
  }
}
