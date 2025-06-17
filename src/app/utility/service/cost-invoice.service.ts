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

@Injectable({
  providedIn: 'root'
})
export class CostInvoiceService {

  private apiUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get cost invoices with pagination and filtering
   * @param page - Page number (0-based)
   * @param size - Page size
   * @param search - Search term
   * @param currency - Currency filter
   * @param category - Category filter
   * @param createdFrom - Date from filter
   * @param createdTo - Date to filter
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
   * Synchronize cost invoices with Infakt
   * @param infaktApiKey - API key for Infakt
   */
  synchronizeCosts(infaktApiKey: string): Observable<any> {
    const headers = new HttpHeaders({
      'infakt-api-key': infaktApiKey
    });

    return this.http.post(`${this.apiUrl}/api/invoices/sync-costs`, {}, { headers });
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
