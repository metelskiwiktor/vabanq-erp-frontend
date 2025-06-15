import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Order} from "../../menu/orders/model/orders-model";
import {environment} from "../../../environments/environment";

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

  constructor(private http: HttpClient) {}

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

    return this.http.post<InvoiceResponse>(this.apiUrl, requestBody)
      .pipe(
        catchError(error => {
          console.error('Error generating invoice:', error);
          throw error;
        })
      );
  }

  /**
   * Get invoices for multiple orders
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
