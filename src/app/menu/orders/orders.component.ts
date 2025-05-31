// orders.component.ts - Updated to remove PDF download and Allegro status check requests
import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { ProductService, AttachInvoiceResponse } from "../../utility/service/product.service";
import { ToastService } from "../../utility/service/toast-service";
import {InfaktService, InvoiceResponse} from "../../utility/service/infakt.service";
import {InvoiceInfo, Order} from "./model/orders-model";

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  toastSuccessMessage: string = '';
  toastService = inject(ToastService);
  infaktService = inject(InfaktService);

  // Filtry
  filterText: string = '';
  filterStatus: string = '';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  filterHasInvoice: boolean = false;

  allExpanded: boolean = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.getOrders(token).subscribe({
      next: (orders: Order[]) => {
        this.orders = orders.map(order => ({ ...order, isExpanded: false }));
        this.fetchInvoicesForOrders();
        this.applyFilters();
        console.log('Fetched orders:', this.orders);
      },
      error: (error) => {
        console.error('Failed to fetch orders:', error);
      }
    });
  }

  fetchInvoicesForOrders(): void {
    const orderIds = this.orders.map(order => order.orderId);

    this.infaktService.getInvoicesForOrders(orderIds).subscribe({
      next: (invoices: InvoiceResponse[]) => {
        // Mapuj faktury do zamówień
        const invoiceMap = new Map<string, InvoiceResponse[]>();

        invoices.forEach(invoice => {
          if (!invoiceMap.has(invoice.orderId)) {
            invoiceMap.set(invoice.orderId, []);
          }
          invoiceMap.get(invoice.orderId)!.push(invoice);
        });

        // Aktualizuj zamówienia o faktury
        this.orders.forEach(order => {
          const orderInvoices = invoiceMap.get(order.orderId) || [];
          if (orderInvoices.length > 0) {
            order.invoices = orderInvoices.map(inv => ({
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              invoiceStatus: inv.status.toLowerCase(),
              invoiceUrl: inv.invoiceUrl,
              createdAt: inv.createdAt,
              // Pobierz status Allegro z modelu faktury
              isAttachedToAllegro: inv.attachedToAllegro,
              allegroInvoiceId: undefined, // Można dodać do backendu jeśli potrzebne
              isAttachingToAllegro: false,
              allegroAttachmentError: undefined
            }));
          }
        });
      },
      error: (error) => {
        console.error('Failed to fetch invoices:', error);
      }
    });
  }

  synchronizeOrders(template: TemplateRef<any>): void {
    const token = localStorage.getItem('allegro-token') || '';
    this.productService.synchronizeOrders(token).subscribe({
      next: (response: { created: number; updated: number }) => {
        if (response.created === 0 && response.updated === 0) {
          this.toastSuccessMessage = `Synchronizacja zakończona pomyślnie. Brak aktualizacji.`;
        } else {
          this.toastSuccessMessage = `Synchronizacja zakończona pomyślnie.\n${response.created} nowych zamówień\n${response.updated} zaktualizowanych zamówień.`;
        }
        this.fetchOrders();
        this.showSuccess(template);
      },
      error: (error) => {
        console.error('Synchronization failed:', error);
        this.toastService.show({
          template: template,
          classname: 'bg-danger text-light',
          delay: 2000,
          text: 'Synchronizacja nie powiodła się. Spróbuj ponownie.',
        });
      }
    });
  }

  toggleAllDetails(): void {
    this.allExpanded = !this.allExpanded;
    this.filteredOrders = this.filteredOrders.map(order => ({ ...order, isExpanded: this.allExpanded }));
  }

  showSuccess(template: TemplateRef<any>): void {
    this.toastService.show({
      template,
      classname: 'bg-success text-light',
      delay: 2000,
      text: this.toastSuccessMessage
    });
  }

  generateInvoice(order: Order, template: TemplateRef<any>): void {
    event?.stopPropagation();

    order.isInvoiceGenerating = true;

    this.infaktService.generateInvoice(order).subscribe({
      next: (response: InvoiceResponse) => {
        const invoiceInfo: InvoiceInfo = {
          invoiceId: response.id,
          invoiceNumber: response.invoiceNumber || 'Processing...',
          invoiceStatus: response.status.toLowerCase(),
          invoiceUrl: response.invoiceUrl || '',
          createdAt: response.createdAt,
          // Inicjalizuj nowe pola
          isAttachedToAllegro: false,
          allegroInvoiceId: undefined,
          isAttachingToAllegro: false,
          allegroAttachmentError: undefined
        };

        if (!order.invoices) {
          order.invoices = [];
        }

        order.invoices.push(invoiceInfo);
        order.isInvoiceGenerating = false;

        this.toastSuccessMessage = `Faktura została wygenerowana. Status: ${this.getInvoiceStatusTranslation(response.status.toLowerCase())}`;
        this.showSuccess(template);
      },
      error: (error) => {
        console.error('Failed to generate invoice:', error);
        order.isInvoiceGenerating = false;

        this.toastService.show({
          template: template,
          classname: 'bg-danger text-light',
          delay: 2000,
          text: 'Nie udało się wygenerować faktury. Spróbuj ponownie.',
        });
      }
    });
  }

  /**
   * Dołącza fakturę do zamówienia w Allegro jako dowód zakupu
   */
  attachInvoiceToAllegro(order: Order, invoice: InvoiceInfo, template: TemplateRef<any>): void {
    event?.stopPropagation();

    if (invoice.invoiceStatus !== 'issued' && invoice.invoiceStatus !== 'sent' && invoice.invoiceStatus !== 'paid') {
      this.toastService.show({
        template: template,
        classname: 'bg-warning text-dark',
        delay: 3000,
        text: 'Faktura musi być w statusie "Wystawiona", "Wysłana" lub "Opłacona" aby można było ją dołączyć do Allegro.',
      });
      return;
    }

    const token = localStorage.getItem('allegro-token') || '';
    if (!token) {
      this.toastService.show({
        template: template,
        classname: 'bg-danger text-light',
        delay: 3000,
        text: 'Brak tokenu Allegro. Sprawdź połączenie z Allegro.',
      });
      return;
    }

    invoice.isAttachingToAllegro = true;
    invoice.allegroAttachmentError = undefined;

    this.productService.attachInvoiceToOrder(order.orderId, invoice.invoiceId, token).subscribe({
      next: (response: AttachInvoiceResponse) => {
        invoice.isAttachingToAllegro = false;
        invoice.isAttachedToAllegro = true;
        invoice.allegroInvoiceId = response.allegroInvoiceId;

        this.toastSuccessMessage = `Faktura ${invoice.invoiceNumber} została pomyślnie dołączona do zamówienia w Allegro jako dowód zakupu.`;
        this.showSuccess(template);
      },
      error: (error) => {
        console.error('Failed to attach invoice to Allegro:', error);
        invoice.isAttachingToAllegro = false;
        invoice.allegroAttachmentError = error.error?.message || 'Nieznany błąd';

        this.toastService.show({
          template: template,
          classname: 'bg-danger text-light',
          delay: 4000,
          text: `Nie udało się dołączyć faktury do Allegro: ${invoice.allegroAttachmentError}`,
        });
      }
    });
  }

  // Metody dla filtrów
  applyFilter(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilters();
  }

  filterByStatus(event: Event): void {
    this.filterStatus = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  filterByDateFrom(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    this.filterDateFrom = dateStr ? new Date(dateStr) : null;
    this.applyFilters();
  }

  filterByDateTo(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    this.filterDateTo = dateStr ? new Date(dateStr) : null;
    this.applyFilters();
  }

  toggleInvoiceFilter(): void {
    this.filterHasInvoice = !this.filterHasInvoice;
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterStatus = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.filterHasInvoice = false;

    const statusSelect = document.querySelector('.filter-select') as HTMLSelectElement;
    if (statusSelect) statusSelect.value = '';

    const dateInputs = document.querySelectorAll('.filter-date') as NodeListOf<HTMLInputElement>;
    dateInputs.forEach(input => input.value = '');

    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) searchInput.value = '';

    const invoiceCheckbox = document.querySelector('#invoice-filter') as HTMLInputElement;
    if (invoiceCheckbox) invoiceCheckbox.checked = false;

    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(order => {
      if (this.filterText) {
        const searchText = this.filterText.toLowerCase();
        const orderIdMatch = order.orderId.toLowerCase().includes(searchText);
        const buyerMatch = `${order.buyer.firstName} ${order.buyer.lastName}`.toLowerCase().includes(searchText);
        const emailMatch = order.buyer.email.toLowerCase().includes(searchText);
        const invoiceMatch = order.invoices?.some(inv =>
          inv.invoiceNumber.toLowerCase().includes(searchText)
        ) || false;

        if (!(orderIdMatch || buyerMatch || emailMatch || invoiceMatch)) {
          return false;
        }
      }

      if (this.filterStatus && order.status !== this.filterStatus) {
        return false;
      }

      if (this.filterHasInvoice && (!order.invoices || order.invoices.length === 0)) {
        return false;
      }

      if (this.filterDateFrom) {
        const saleDate = new Date(order.saleDate);
        if (saleDate < this.filterDateFrom) {
          return false;
        }
      }

      if (this.filterDateTo) {
        const saleDate = new Date(order.saleDate);
        const endOfDay = new Date(this.filterDateTo);
        endOfDay.setHours(23, 59, 59, 999);

        if (saleDate > endOfDay) {
          return false;
        }
      }

      return true;
    });
  }

  // Metody dla statystyk
  getOrdersCountByStatus(status: string): number {
    return this.orders.filter(order => order.status === status).length;
  }

  getTotalOrdersValue(): number {
    return this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  getOrdersWithInvoicesCount(): number {
    return this.orders.filter(order => order.invoices && order.invoices.length > 0).length;
  }

  getOrdersWithAllegroInvoicesCount(): number {
    return this.orders.filter(order =>
      order.invoices && order.invoices.some(inv => inv.isAttachedToAllegro)
    ).length;
  }

  // Metoda do tłumaczenia statusów na język polski
  getStatusTranslation(status: string): string {
    const statusMap: { [key: string]: string } = {
      'READY_FOR_PROCESSING': 'Nowe',
      'PROCESSING': 'Do wysyłki',
      'SENT': 'Wysłane',
      'COMPLETED': 'Zrealizowane',
      'CANCELLED': 'Anulowane'
    };

    return statusMap[status] || status;
  }

  // Metoda do tłumaczenia statusów faktury na język polski
  getInvoiceStatusTranslation(status: string): string {
    const statusMap: { [key: string]: string } = {
      'processing': 'Przetwarzanie',
      'draft': 'Szkic',
      'issued': 'Wystawiona',
      'sent': 'Wysłana',
      'paid': 'Opłacona',
      'partial': 'Częściowo opłacona',
      'error': 'Błąd'
    };

    return statusMap[status] || status;
  }

  // Sprawdza czy faktura może być dołączona do Allegro
  canAttachToAllegro(invoice: InvoiceInfo): boolean {
    return !invoice.isAttachedToAllegro &&
      !invoice.isAttachingToAllegro &&
      (invoice.invoiceStatus === 'issued' ||
        invoice.invoiceStatus === 'sent' ||
        invoice.invoiceStatus === 'paid');
  }
}
