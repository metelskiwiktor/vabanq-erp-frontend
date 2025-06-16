import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
  category?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CostInvoiceService {

  private apiUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all cost invoices
   */
  getCostInvoices(): Observable<CostInvoice[]> {
    return this.http.get<CostInvoice[]>(`${this.apiUrl}/api/invoices/costs`);
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
   * Get cost invoices filtered by date range
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   */
  getCostInvoicesByDateRange(startDate: string, endDate: string): Observable<CostInvoice[]> {
    const params = {
      startDate: startDate,
      endDate: endDate
    };

    return this.http.get<CostInvoice[]>(`${this.apiUrl}/api/invoices/costs`, { params });
  }

  /**
   * Get cost invoices with pagination and filtering
   * @param page - Page number (0-based)
   * @param size - Page size
   * @param sortBy - Sort field
   * @param sortDir - Sort direction (asc/desc)
   * @param filters - Additional filters
   */
  getCostInvoicesPaginated(
    page: number = 0,
    size: number = 15,
    sortBy: string = 'createdAt',
    sortDir: string = 'desc',
    filters?: {
      search?: string;
      category?: string;
      monthYear?: string;
    }
  ): Observable<any> {
    let params: any = {
      page: page.toString(),
      size: size.toString(),
      sort: `${sortBy},${sortDir}`
    };

    if (filters) {
      if (filters.search) {
        params.search = filters.search;
      }
      if (filters.category) {
        params.category = filters.category;
      }
      if (filters.monthYear) {
        params.monthYear = filters.monthYear;
      }
    }

    return this.http.get(`${this.apiUrl}/api/invoices/costs/paginated`, { params });
  }

  /**
   * Get available categories from cost invoices
   */
  getCostInvoiceCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/api/invoices/costs/categories`);
  }
}
