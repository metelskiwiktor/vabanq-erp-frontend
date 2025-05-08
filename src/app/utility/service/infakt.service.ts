import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
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
  private apiUrl = '/api/infakt';

  constructor(private http: HttpClient) {
    localStorage.setItem('infakt-token', '');
  }

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
      'Accept': 'application/json',
      'X-inFakt-ApiKey': `${token}`
    });

    const invoiceData = this.prepareInvoiceData(order);

    return this.http.post<InfaktInvoiceResponse>(`${this.apiUrl}/async/invoices.json`, { invoice: invoiceData }, { headers })
      .pipe(
        catchError(error => {
          console.error('Error generating invoice:', error);
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
      return of([]);
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-inFakt-ApiKey': `${token}`
    });

    return this.http.get<{ data: InfaktInvoiceResponse[] }>(
      `${this.apiUrl}/invoices.json?client_order_id=${orderId}`,
      {headers}
    ).pipe(
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

    return this.http.post<any>(`${this.apiUrl}/invoices/${invoiceId}/emails`, emailData, {headers})
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

    return this.http.get<{ url: string }>(`${this.apiUrl}/invoices/${invoiceId}/pdf`, {headers})
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
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const fullName = `${order.buyer.firstName} ${order.buyer.lastName}`.trim();
    const address = order.delivery.deliveryAddress;

    return {
      payment_method: 'transfer',
      invoice_date: today,
      sale_date: order.saleDate || today,
      due_date: dueDate.toISOString().split('T')[0],
      client_first_name: order.buyer.firstName,
      client_last_name: order.buyer.lastName,
      client_email: order.buyer.email,
      client_company_name: fullName,
      client_street: address.street,
      client_city: address.city,
      client_post_code: address.postCode,
      client_country: 'PL',
      client_order_id: order.orderId,
      services: order.products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        unit: 'szt.',
        unit_net_price: product.unitPrice,
        tax_symbol: 23
      }))
    };
  }
}
