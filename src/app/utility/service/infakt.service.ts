// infakt.service.ts - Updated to use backend API
import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {Order} from "../../menu/orders/model/orders-model";

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

@Injectable({
  providedIn: 'root'
})
export class InfaktService {
  private apiUrl = 'http://localhost:8080/api/invoices';

  constructor(private http: HttpClient) {}

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
   * Get invoice for specific order
   */
  getInvoiceForOrder(orderId: string): Observable<InvoiceResponse | null> {
    return this.http.get<InvoiceResponse>(`${this.apiUrl}/order/${orderId}`)
      .pipe(
        catchError(error => {
          if (error.status === 404) {
            return of(null);
          }
          console.error('Error fetching invoice:', error);
          return of(null);
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
