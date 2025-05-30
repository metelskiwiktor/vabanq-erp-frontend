// orders.component.ts - Updated with pagination
import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AttachInvoiceResponse, ProductService} from "../../utility/service/product.service";
import {ToastService} from "../../utility/service/toast-service";
import {InfaktService, InvoiceResponse} from "../../utility/service/infakt.service";
import {InvoiceInfo, Order} from "./model/orders-model";

export interface OrdersPageResponse {
  content: Order[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

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

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 10;
  totalElements: number = 0;
  totalPages: number = 0;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  isLoading: boolean = false;

  // Filtry
  filterText: string = '';
  filterStatus: string = '';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  filterMustHasInvoice: boolean = false;

  allExpanded: boolean = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  fetchOrders(): void {
    this.isLoading = true;
    const token = localStorage.getItem('allegro-token') || '';

    this.productService.getOrdersPaginated(
      token,
      this.currentPage,
      this.pageSize,
      this.filterText,
      this.filterStatus,
      this.filterDateFrom,
      this.filterDateTo,
      this.filterMustHasInvoice
    ).subscribe({
      next: (response: OrdersPageResponse) => {
        this.orders = response.content.map(order => ({ ...order, isExpanded: false }));
        this.filteredOrders = [...this.orders];
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
        this.pageSize = response.size;

        this.fetchInvoicesForOrders();
        this.isLoading = false;
        console.log('Fetched orders page:', response);
      },
      error: (error) => {
        console.error('Failed to fetch orders:', error);
        this.isLoading = false;
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
              isAttachedToAllegro: inv.attachedToAllegro,
              allegroInvoiceId: undefined,
              isAttachingToAllegro: false,
              allegroAttachmentError: undefined
            }));
          }
        });

        // Update filtered orders after invoices are loaded
        this.filteredOrders = [...this.orders];
      },
      error: (error) => {
        console.error('Failed to fetch invoices:', error);
      }
    });
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchOrders();
    }
  }

  goToFirstPage(): void {
    this.goToPage(0);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages - 1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = +target.value;
    this.currentPage = 0; // Reset to first page when changing page size
    this.fetchOrders();
  }

  getPageNumbers(): number[] {
    const pageNumbers: number[] = [];
    const maxPagesToShow = 5;
    const half = Math.floor(maxPagesToShow / 2);

    let start = Math.max(0, this.currentPage - half);
    let end = Math.min(this.totalPages - 1, start + maxPagesToShow - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < maxPagesToShow) {
      start = Math.max(0, end - maxPagesToShow + 1);
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
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
        // Reset to first page after sync
        this.currentPage = 0;
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

  // Filter methods - now trigger backend requests
  applyFilter(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.currentPage = 0; // Reset to first page when filtering
    this.fetchOrders();
  }

  filterByStatus(event: Event): void {
    this.filterStatus = (event.target as HTMLSelectElement).value;
    this.currentPage = 0;
    this.fetchOrders();
  }

  filterByDateFrom(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    this.filterDateFrom = dateStr ? new Date(dateStr) : null;
    this.currentPage = 0;
    this.fetchOrders();
  }

  filterByDateTo(event: Event): void {
    const dateStr = (event.target as HTMLInputElement).value;
    this.filterDateTo = dateStr ? new Date(dateStr) : null;
    this.currentPage = 0;
    this.fetchOrders();
  }

  toggleInvoiceFilter(): void {
    this.filterMustHasInvoice = !this.filterMustHasInvoice;
    this.currentPage = 0;
    this.fetchOrders();
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterStatus = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.filterMustHasInvoice = false;
    this.currentPage = 0;

    const statusSelect = document.querySelector('.filter-select') as HTMLSelectElement;
    if (statusSelect) statusSelect.value = '';

    const dateInputs = document.querySelectorAll('.filter-date') as NodeListOf<HTMLInputElement>;
    dateInputs.forEach(input => input.value = '');

    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) searchInput.value = '';

    const invoiceCheckbox = document.querySelector('#invoice-filter') as HTMLInputElement;
    if (invoiceCheckbox) invoiceCheckbox.checked = false;

    this.fetchOrders();
  }

  // Statistics methods - these will need to be updated to use separate API calls
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

  canAttachToAllegro(invoice: InvoiceInfo): boolean {
    return !invoice.isAttachedToAllegro &&
      !invoice.isAttachingToAllegro &&
      (invoice.invoiceStatus === 'issued' ||
        invoice.invoiceStatus === 'sent' ||
        invoice.invoiceStatus === 'paid');
  }
}
