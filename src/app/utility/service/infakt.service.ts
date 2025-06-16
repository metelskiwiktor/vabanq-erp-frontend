import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Order} from "../../menu/orders/model/orders-model";
import {environment} from "../../../environments/environment";
import {LocalStorageService} from "../../local-storage.service";

export interface InvoiceResponse {
  id: string;
  orderId: string;
  invoiceNumber: string;
  status: string;
  invoiceUrl: string;
  createdAt: string;
  updatedAt: string;
  buyerEmail: string;
  buyerFirstName: string;
  buyerLastName: string;
  attachedToAllegro: boolean;
}

export interface InfaktCheckResponse {
  message: string;
  isValid: boolean;
  companyName?: string;
  userEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InfaktService {
  private apiUrl = `${environment.backendUrl}/api/invoices`;

  constructor(
    private http: HttpClient,
    private localStorageService: LocalStorageService
  ) {}

  /**
   * Get Infakt API key from localStorage
   */
  private getInfaktApiKey(): string | null {
    const infaktData = this.localStorageService.getItem('infakt-credentials');
    if (infaktData) {
      try {
        const credentials = JSON.parse(infaktData);
        return credentials.apiKey || null;
      } catch (e) {
        console.error('Error parsing Infakt credentials:', e);
        return null;
      }
    }
    return null;
  }

  /**
   * Create headers with Infakt API key
   */
  private createHeadersWithApiKey(): HttpHeaders {
    const apiKey = this.getInfaktApiKey();
    if (!apiKey) {
      console.warn('Infakt API key not found in localStorage');
      return new HttpHeaders();
    }
    return new HttpHeaders().set('infakt-api-key', apiKey);
  }

  /**
   * Check if Infakt API key is valid
   */
  checkApiKey(apiKey: string): Observable<InfaktCheckResponse> {
    const headers = new HttpHeaders().set('infakt-api-key', apiKey);

    return this.http.get<InfaktCheckResponse>(`${this.apiUrl}/check-me`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error checking Infakt API key:', error);
          throw error;
        })
      );
  }

  /**
   * Generate invoice for order via backend
   */
  generateInvoice(order: Order): Observable<InvoiceResponse> {
    const requestBody = { orderId: order.orderId };
    const headers = this.createHeadersWithApiKey();

    return this.http.post<InvoiceResponse>(this.apiUrl, requestBody, { headers })
      .pipe(
        catchError(error => {
          console.error('Error generating invoice:', error);
          throw error;
        })
      );
  }

  /**
   * Get invoices for multiple orders - ten endpoint nie potrzebuje API key
   */
  getInvoicesForOrders(orderIds: string[]): Observable<InvoiceResponse[]> {
    if (orderIds.length === 0) {
      return of([]);
    }

    return this.http.post<InvoiceResponse[]>(`${this.apiUrl}/orders`, orderIds)
      .pipe(
        catchError(error => {
          console.error('Error fetching invoices:', error);
          return of([]);
        })
      );
  }
}
