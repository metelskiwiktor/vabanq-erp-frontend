// src/app/utility/service/expense.service.ts - Updated with missing methods
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExpenseResponse {
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'VARIABLE';
  cyclic: boolean;
  category: ExpenseCategory;
  tags: string[];
  totalGrossCost: number;  // Zaktualizowane pole
  totalNetCost: number;    // Zaktualizowane pole
  createdAt: string;
  items: ExpenseEntry[];
}

export interface ExpenseEntry {
  id: string;
  name: string;
  netAmount: number;
  grossAmount: number;
  costInvoiceId?: string; // Opcjonalne dla manualnych pozycji
}

export enum ExpenseCategory {
  SERVICES = 'SERVICES',
  ACCOUNTING = 'ACCOUNTING',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  TRAVEL = 'TRAVEL',
  SALARY = 'SALARY',
  OTHER = 'OTHER',
  ELECTRICITY = 'ELECTRICITY',
}

export interface CreateExpenseRequest {
  name: string;
  description?: string;
  type: 'FIXED' | 'VARIABLE';
  cyclic: boolean;
  category: ExpenseCategory;
  tags: string[];
  createdAt?: string;
}

export interface AttachInvoiceRequest {
  costInvoiceId: string;
}

export interface CreateExpenseItemRequest {
  name: string;
  netAmount: number;
  grossAmount: number;
}

export interface UpdateExpenseRequest {
  name?: string;
  description?: string;
  type?: 'FIXED' | 'VARIABLE';
  cyclic?: boolean;
  category?: ExpenseCategory;
  createdAt?: string;
}

export interface UpdateExpenseItemRequest {
  name: string;
  netAmount: number;
  grossAmount: number;
}

export interface ExpenseTagResponse {
  id: string;
  name: string;
}

export interface CreateExpenseTagRequest {
  name: string;
}

export interface YearMonthParam {
  year: number;
  month: number; // 1-12
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
   * Aktualizuj wydatek
   */
  updateExpense(expenseId: string, request: UpdateExpenseRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${expenseId}`, request);
  }

  /**
   * Usuń wydatek
   */
  deleteExpense(expenseId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${expenseId}`);
  }

  /**
   * Przypisz fakturę do wydatku
   */
  attachInvoiceToExpense(expenseId: string, request: AttachInvoiceRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${expenseId}/invoice-expenses`, request);
  }

  /**
   * Usuń przypisanie faktury od wydatku
   */
  detachInvoiceFromExpense(expenseId: string, itemId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${expenseId}/items/${itemId}`);
  }

  /**
   * Dodaj manualną pozycję do wydatku
   */
  addManualItem(expenseId: string, request: CreateExpenseItemRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${expenseId}/items`, request);
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
   * Lista wydatków dla miesiąca - aktualizacja parametru
   */
  listExpenses(month?: string): Observable<ExpenseResponse[]> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<ExpenseResponse[]>(this.apiUrl, { params });
  }

  /**
   * Lista wszystkich wydatków (bez filtra miesiąca)
   */
  listAllExpenses(): Observable<ExpenseResponse[]> {
    return this.http.get<ExpenseResponse[]>(`${this.apiUrl}/all`);
  }

  /**
   * Wyszukaj wydatki po nazwie lub opisie
   */
  searchExpenses(query: string, month?: string): Observable<ExpenseResponse[]> {
    let params = new HttpParams().set('search', query);
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<ExpenseResponse[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Pobierz wydatki według kategorii
   */
  getExpensesByCategory(category: ExpenseCategory, month?: string): Observable<ExpenseResponse[]> {
    let params = new HttpParams().set('category', category);
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<ExpenseResponse[]>(`${this.apiUrl}/by-category`, { params });
  }

  /**
   * Pobierz wydatki według typu
   */
  getExpensesByType(type: 'FIXED' | 'VARIABLE', month?: string): Observable<ExpenseResponse[]> {
    let params = new HttpParams().set('type', type);
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get<ExpenseResponse[]>(`${this.apiUrl}/by-type`, { params });
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
   * Usuń tag
   */
  deleteTag(tagId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tags/${tagId}`);
  }

  /**
   * Pobierz podsumowanie wydatków dla miesiąca
   */
  getExpenseSummary(month: string): Observable<ExpenseSummaryResponse> {
    const params = new HttpParams().set('month', month);
    return this.http.get<ExpenseSummaryResponse>(`${this.apiUrl}/summary`, { params });
  }

  /**
   * Duplikuj wydatek (przydatne dla wydatków cyklicznych)
   */
  duplicateExpense(expenseId: string, targetMonth: string): Observable<ExpenseResponse> {
    const params = new HttpParams().set('targetMonth', targetMonth);
    return this.http.post<ExpenseResponse>(`${this.apiUrl}/${expenseId}/duplicate`, null, { params });
  }

  /**
   * Zmień status wydatku (aktywny/nieaktywny)
   */
  toggleExpenseStatus(expenseId: string, active: boolean): Observable<void> {
    const body = { active };
    return this.http.patch<void>(`${this.apiUrl}/${expenseId}/status`, body);
  }

  /**
   * Eksportuj wydatki do CSV
   */
  exportExpensesToCSV(month?: string): Observable<Blob> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month);
    }
    return this.http.get(`${this.apiUrl}/export/csv`, {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Importuj wydatki z CSV
   */
  importExpensesFromCSV(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResult>(`${this.apiUrl}/import/csv`, formData);
  }

  /**
   * Mapowanie kategorii na display names
   */
  getCategoryDisplayName(category: ExpenseCategory): string {
    const categoryMap: { [key in ExpenseCategory]: string } = {
      [ExpenseCategory.SERVICES]: 'Usługi',
      [ExpenseCategory.ACCOUNTING]: 'Księgowość',
      [ExpenseCategory.OFFICE_SUPPLIES]: 'Biuro',
      [ExpenseCategory.TRAVEL]: 'Podróże',
      [ExpenseCategory.SALARY]: 'Wynagrodzenie',
      [ExpenseCategory.ELECTRICITY]: 'Prąd',
      [ExpenseCategory.OTHER]: 'Inne'
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
  getAvailableCategories(): { key: ExpenseCategory; displayName: string }[] {
    return [
      { key: ExpenseCategory.SERVICES, displayName: 'Usługi' },
      { key: ExpenseCategory.ACCOUNTING, displayName: 'Księgowość' },
      { key: ExpenseCategory.OFFICE_SUPPLIES, displayName: 'Biuro' },
      { key: ExpenseCategory.TRAVEL, displayName: 'Podróże' },
      { key: ExpenseCategory.SALARY, displayName: 'Wynagrodzenie' },
      { key: ExpenseCategory.ELECTRICITY, displayName: 'Prąd' },
      { key: ExpenseCategory.OTHER, displayName: 'Inne' }
    ];
  }

  /**
   * Walidacja wydatku
   */
  validateExpense(expense: Partial<CreateExpenseRequest>): ValidationResult {
    const errors: string[] = [];

    if (!expense.name || expense.name.trim().length < 3) {
      errors.push('Nazwa wydatku musi mieć przynajmniej 3 znaki');
    }

    if (!expense.type) {
      errors.push('Typ wydatku jest wymagany');
    }

    if (!expense.category) {
      errors.push('Kategoria wydatku jest wymagana');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Oblicz sumy dla wydatków
   */
  calculateExpenseTotals(expenses: ExpenseResponse[]): ExpenseTotals {
    return expenses.reduce((totals, expense) => ({
      totalNet: totals.totalNet + expense.totalNetCost,
      totalGross: totals.totalGross + expense.totalGrossCost,
      count: totals.count + 1,
      itemsCount: totals.itemsCount + (expense.items?.length || 0)
    }), {
      totalNet: 0,
      totalGross: 0,
      count: 0,
      itemsCount: 0
    });
  }

  listExpensesForMonth(yearMonth?: YearMonthParam | string): Observable<ExpenseResponse[]> {
    let params = new HttpParams();

    if (yearMonth) {
      let monthParam: string;

      if (typeof yearMonth === 'string') {
        // Jeśli przekazano string w formacie YYYY-MM
        monthParam = yearMonth;
      } else {
        // Jeśli przekazano obiekt YearMonthParam
        const monthStr = yearMonth.month.toString().padStart(2, '0');
        monthParam = `${yearMonth.year}-${monthStr}`;
      }

      params = params.set('month', monthParam);
    }
    // Jeśli nie przekazano parametru, backend użyje aktualnego miesiąca

    return this.http.get<ExpenseResponse[]>(this.apiUrl, { params });
  }
}

// Additional interfaces for the service
export interface ExpenseSummaryResponse {
  month: string;
  totalNetAmount: number;
  totalGrossAmount: number;
  totalCount: number;
  fixedExpenses: {
    count: number;
    netAmount: number;
    grossAmount: number;
  };
  variableExpenses: {
    count: number;
    netAmount: number;
    grossAmount: number;
  };
  categorySummary: {
    [key in ExpenseCategory]: {
      count: number;
      netAmount: number;
      grossAmount: number;
    }
  };
  invoiceAssignments: {
    totalInvoices: number;
    assignedInvoices: number;
  };
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  errors: string[];
  duplicates: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ExpenseTotals {
  totalNet: number;
  totalGross: number;
  count: number;
  itemsCount: number;
}
