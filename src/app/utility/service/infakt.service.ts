import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {Order} from "../../menu/orders/model/orders-model";

export interface InfaktInvoiceResponse {
  id: string;
  number: string;
  status: string;
  url: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class InfaktService {
  private apiUrl = 'https://api.infakt.pl/v3';

  constructor(private http: HttpClient) {}

  /**
   * Generate invoice in Infakt based on order data
   */
  generateInvoice(order: Order): Observable<InfaktInvoiceResponse> {
    const token = localStorage.getItem('infakt-token') || '';

    if (!token) {
      return of({
        id: 'mock-id',
        number: 'MOCK/INV/2025/05',
        status: 'draft',
        url: 'https://app.infakt.pl/app/invoices/view/mock-id',
        createdAt: new Date().toISOString()
      } as InfaktInvoiceResponse);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Transform order into Infakt invoice format
    const invoiceData = this.prepareInvoiceData(order);

    return this.http.post<InfaktInvoiceResponse>(`${this.apiUrl}/invoices`, invoiceData, { headers })
      .pipe(
        catchError(error => {
          console.error('Error generating invoice:', error);
          // Return mock data for demo
          return of({
            id: 'mock-id',
            number: 'MOCK/INV/2025/05',
            status: 'draft',
            url: 'https://app.infakt.pl/app/invoices/view/mock-id',
            createdAt: new Date().toISOString()
          } as InfaktInvoiceResponse);
        })
      );
  }

  /**
   * Get list of invoices for a specific order
   */
  getInvoicesForOrder(orderId: string): Observable<InfaktInvoiceResponse[]> {
    const token = localStorage.getItem('infakt-token') || '';

    if (!token) {
      return of([]); // Return empty array if no token
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{data: InfaktInvoiceResponse[]}>(`${this.apiUrl}/invoices?client_order_id=${orderId}`, { headers })
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Error fetching invoices:', error);
          return of([]);
        })
      );
  }

  /**
   * Send invoice to customer via email
   */
  sendInvoiceEmail(invoiceId: string, email: string): Observable<boolean> {
    const token = localStorage.getItem('infakt-token') || '';

    if (!token) {
      return of(true); // Mock success response
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const emailData = {
      recipient: email,
      subject: 'Twoja faktura jest gotowa',
      body: 'W załączeniu przesyłamy fakturę. Dziękujemy za zakupy!'
    };

    return this.http.post<any>(`${this.apiUrl}/invoices/${invoiceId}/emails`, emailData, { headers })
      .pipe(
        map(() => true),
        catchError(error => {
          console.error('Error sending invoice email:', error);
          return of(true); // Mock success for demo
        })
      );
  }

  /**
   * Get PDF invoice download URL
   */
  getInvoicePdfUrl(invoiceId: string): Observable<string> {
    const token = localStorage.getItem('infakt-token') || '';

    if (!token) {
      return of('https://mockurl.com/invoice.pdf'); // Mock URL
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<{url: string}>(`${this.apiUrl}/invoices/${invoiceId}/pdf`, { headers })
      .pipe(
        map(response => response.url),
        catchError(error => {
          console.error('Error getting invoice PDF:', error);
          return of('https://mockurl.com/invoice.pdf');
        })
      );
  }

  /**
   * Transform order data to Infakt invoice format
   */
  private prepareInvoiceData(order: Order): any {
    // This is a simplified version of the transformation
    return {
      client: {
        name: `${order.buyer.firstName} ${order.buyer.lastName}`,
        email: order.buyer.email,
        phone: order.buyer.phoneNumber,
        address: order.delivery.deliveryAddress.street,
        city: order.delivery.deliveryAddress.city,
        postal_code: order.delivery.deliveryAddress.postCode,
        country_code: order.delivery.deliveryAddress.countryCode
      },
      client_order_id: order.orderId,
      payment_method: 'transfer',
      services: order.products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        unit_net_price: (product.unitPrice / 1.23).toFixed(2), // Assuming 23% VAT
        tax_rate: 23,
        unit: 'szt'
      })),
      // Add delivery as a service if cost > 0
      ...(order.delivery.cost > 0 ? {
        services: [
          ...order.products.map(product => ({
            name: product.name,
            quantity: product.quantity,
            unit_net_price: (product.unitPrice / 1.23).toFixed(2),
            tax_rate: 23,
            unit: 'szt'
          })),
          {
            name: `Dostawa: ${order.delivery.methodName}`,
            quantity: 1,
            unit_net_price: (order.delivery.cost / 1.23).toFixed(2),
            tax_rate: 23,
            unit: 'usł'
          }
        ]
      } : {})
    };
  }
}
