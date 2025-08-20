import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CostInvoice {
  id: string;
  number: string;
  netPrice: number;
  grossPrice: number;
  currency: string;
  sellerName: string;
  sellerTaxCode?: string;
  description?: string;
  category?: CostInvoiceCategory;
  createdAt: string;
}

export enum CostInvoiceCategory {
  HOUSING_FEES = 'HOUSING_FEES',
  ELECTRONIC_SERVICES = 'ELECTRONIC_SERVICES',
  ACCOUNTING_SERVICES = 'ACCOUNTING_SERVICES',
  ENTREPRENEUR_EXPENSES = 'ENTREPRENEUR_EXPENSES',
  SALARY = 'SALARY',
  EMPLOYEE_SOCIAL_SECURITY = 'EMPLOYEE_SOCIAL_SECURITY',
  GOODS_OR_MATERIALS_PURCHASE = 'GOODS_OR_MATERIALS_PURCHASE',
  NONE = 'NONE',
  OTHER = 'OTHER'
}

export interface CostInvoicePage {
  content: CostInvoice[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface SynchronizationRequest {
  month: string; // Format: YYYY-MM
}

@Injectable({
  providedIn: 'root'
})
export class CostInvoiceService {

  private apiUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get cost invoices with pagination and filtering
   */
  getCostInvoices(
    page: number = 0,
    size: number = 15,
    search?: string,
    currency?: string,
    category?: CostInvoiceCategory,
    createdFrom?: Date,
    createdTo?: Date
  ): Observable<CostInvoicePage> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (search && search.trim()) {
      params = params.set('search', search.trim());
    }

    if (currency && currency.trim()) {
      params = params.set('currency', currency.trim());
    }

    if (category) {
      params = params.set('category', category);
    }

    if (createdFrom) {
      params = params.set('createdFrom', createdFrom.toISOString());
    }

    if (createdTo) {
      params = params.set('createdTo', createdTo.toISOString());
    }

    return this.http.get<CostInvoicePage>(`${this.apiUrl}/api/invoices/costs`, { params });
  }

  /**
   * Get cost invoice by ID
   */
  getCostInvoiceById(id: string): Observable<CostInvoice> {
    return this.http.get<CostInvoice>(`${this.apiUrl}/api/invoices/costs/${id}`);
  }

  /**
   * Synchronize cost invoices with Infakt for specific month
   * @param infaktApiKey - API key for Infakt
   * @param month - Target month in YYYY-MM format
   */
  synchronizeCosts(infaktApiKey: string, month: string): Observable<any> {
    const headers = new HttpHeaders({
      'infakt-api-key': infaktApiKey
    });

    const params = new HttpParams().set('month', month);

    return this.http.post(`${this.apiUrl}/api/invoices/sync-costs`, {}, {
      headers,
      params
    });
  }

  /**
   * Check if month is in the future (cannot be synchronized)
   */
  isMonthInFuture(year: number, month: number): boolean {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Convert to 1-12

    return year > currentYear || (year === currentYear && month > currentMonth);
  }

  /**
   * Format date to YearMonth string (YYYY-MM)
   */
  formatToYearMonth(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  /**
   * Parse YearMonth string to display name
   */
  parseYearMonthToDisplayName(yearMonth: string): string {
    const [year, month] = yearMonth.split('-');
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];

    const monthIndex = parseInt(month) - 1;
    return `${monthNames[monthIndex]} ${year}`;
  }

  /**
   * Get display name for category
   */
  getCategoryDisplayName(category: CostInvoiceCategory | string | undefined): string {
    if (!category) return 'Brak kategorii';

    const categoryDisplayNames: { [key: string]: string } = {
      [CostInvoiceCategory.HOUSING_FEES]: 'Opłaty mieszkaniowe',
      [CostInvoiceCategory.ELECTRONIC_SERVICES]: 'Usługi elektroniczne',
      [CostInvoiceCategory.ACCOUNTING_SERVICES]: 'Usługi księgowe',
      [CostInvoiceCategory.ENTREPRENEUR_EXPENSES]: 'Wydatki przedsiębiorcy',
      [CostInvoiceCategory.SALARY]: 'Wynagrodzenie',
      [CostInvoiceCategory.EMPLOYEE_SOCIAL_SECURITY]: 'ZUS za pracownika',
      [CostInvoiceCategory.GOODS_OR_MATERIALS_PURCHASE]: 'Zakup towarów i/lub materiałów',
      [CostInvoiceCategory.NONE]: 'Brak przypisanej kategorii',
      [CostInvoiceCategory.OTHER]: 'Inne'
    };

    return categoryDisplayNames[category as string] || 'Nieznana kategoria';
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): { key: CostInvoiceCategory; displayName: string }[] {
    return [
      { key: CostInvoiceCategory.HOUSING_FEES, displayName: 'Opłaty mieszkaniowe' },
      { key: CostInvoiceCategory.ELECTRONIC_SERVICES, displayName: 'Usługi elektroniczne' },
      { key: CostInvoiceCategory.ACCOUNTING_SERVICES, displayName: 'Usługi księgowe' },
      { key: CostInvoiceCategory.ENTREPRENEUR_EXPENSES, displayName: 'Wydatki przedsiębiorcy' },
      { key: CostInvoiceCategory.SALARY, displayName: 'Wynagrodzenie' },
      { key: CostInvoiceCategory.EMPLOYEE_SOCIAL_SECURITY, displayName: 'ZUS za pracownika' },
      { key: CostInvoiceCategory.GOODS_OR_MATERIALS_PURCHASE, displayName: 'Zakup towarów i/lub materiałów' },
      { key: CostInvoiceCategory.NONE, displayName: 'Brak przypisanej kategorii' },
      { key: CostInvoiceCategory.OTHER, displayName: 'Inne' }
    ];
  }
}
