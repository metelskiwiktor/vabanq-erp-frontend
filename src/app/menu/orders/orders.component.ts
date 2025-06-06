// orders.component.ts - Updated with new structure
import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {AttachInvoiceResponse, ProductService} from "../../utility/service/product.service";
import {ToastService} from "../../utility/service/toast-service";
import {InfaktService, InvoiceResponse} from "../../utility/service/infakt.service";
import {InvoiceInfo, Order, OrderStatus, PaymentStatus} from "./model/orders-model";
import {environment} from '../../../environments/environment';

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
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
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

  // Enumy dostępne w template
  OrderStatus = OrderStatus;

  // Pagination properties
  currentPage: number = 0;
  pageSize: number = 25;
  totalElements: number = 0;
  totalPages: number = 0;
  pageSizeOptions: number[] = [10, 25, 50, 100];
  isLoading: boolean = false;

  // Filtry
  filterText: string = '';
  filterStatus: string = '';
  filterMarket: string = '';
  filterDateFrom: Date | null = null;
  filterDateTo: Date | null = null;
  filterMustHasInvoice: boolean = false;

  allExpanded: boolean = false;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  // Dodana metoda do obsługi rozwijania szczegółów zamówienia
  toggleOrderDetails(order: Order): void {
    order.isExpanded = !order.isExpanded;
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
      this.filterMustHasInvoice,
      this.filterMarket
    ).subscribe({
      next: (response: OrdersPageResponse) => {
        this.orders = response.content.map(order => ({...order, isExpanded: false}));
        this.applyMarketFilter(); // Apply market filter after fetching
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

  applyMarketFilter(): void {
    if (this.filterMarket === '') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order =>
        order.market.toLowerCase().includes(this.filterMarket.toLowerCase())
      );
    }
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
        this.applyMarketFilter();
      },
      error: (error) => {
        console.error('Failed to fetch invoices:', error);
      }
    });
  }

  // Market filter method
  filterByMarket(market: string): void {
    this.filterMarket = market;
    this.fetchOrders();
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
    this.filteredOrders = this.filteredOrders.map(order => ({...order, isExpanded: this.allExpanded}));
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

  // Nowa metoda do filtrowania po fakturach
  toggleInvoiceFilter(): void {
    this.filterMustHasInvoice = !this.filterMustHasInvoice;
    this.currentPage = 0;
    this.fetchOrders();
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterStatus = '';
    this.filterMarket = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.filterMustHasInvoice = false;
    this.currentPage = 0;

    const statusSelect = document.querySelector('.filter-select') as HTMLSelectElement;
    if (statusSelect) statusSelect.value = '';

    const dateInputs = document.querySelectorAll('.filter-input') as NodeListOf<HTMLInputElement>;
    dateInputs.forEach(input => input.value = '');

    const searchInput = document.querySelector('.search-input') as HTMLInputElement;
    if (searchInput) searchInput.value = '';

    this.fetchOrders();
  }

  // Statistics methods - zaktualizowane żeby używały enumów
  getOrdersCountByStatus(status: OrderStatus): number {
    return this.orders.filter(order => order.status === status).length;
  }

  getTotalOrdersValue(): number {
    return this.orders.reduce((sum, order) => sum + order.totalAmount, 0);
  }

  getOrdersWithInvoicesCount(): number {
    return this.orders.filter(order => order.invoices && order.invoices.length > 0).length;
  }

  // Tłumaczenia dla statusów zamówień
  getOrderStatusTranslation(status: OrderStatus): string {
    const statusMap: { [key in OrderStatus]: string } = {
      [OrderStatus.NEW]: 'Nowe',
      [OrderStatus.PROCESSING]: 'W realizacji',
      [OrderStatus.READY_FOR_SHIPMENT]: 'Do wysłania',
      [OrderStatus.READY_FOR_PICKUP]: 'Do odbioru',
      [OrderStatus.SENT]: 'Wysłane',
      [OrderStatus.PICKED_UP]: 'Odebrane',
      [OrderStatus.CANCELLED]: 'Anulowane',
      [OrderStatus.SUSPENDED]: 'Zawieszone',
      [OrderStatus.RETURNED]: 'Zwrócone',
      [OrderStatus.INVALID_STATUS]: 'Nieznany status'
    };

    return statusMap[status] || status;
  }

  // Tłumaczenia dla statusów płatności
  getPaymentStatusTranslation(status: PaymentStatus): string {
    const statusMap: { [key in PaymentStatus]: string } = {
      [PaymentStatus.BOUGHT]: 'Zlecenie kupna',
      [PaymentStatus.FILLED_IN]: 'Czekające na płatność',
      [PaymentStatus.READY_FOR_PROCESSING]: 'Opłacone',
      [PaymentStatus.CANCELLED]: 'Anulowane',
      [PaymentStatus.INVALID_STATUS]: 'Nieznany status'
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

  // Pomocnicze metody dla statusów w template
  getOrderStatusBadgeClass(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.NEW:
        return 'status-new';
      case OrderStatus.PROCESSING:
      case OrderStatus.READY_FOR_SHIPMENT:
        return 'status-processing';
      case OrderStatus.SENT:
      case OrderStatus.READY_FOR_PICKUP:
        return 'status-shipped';
      case OrderStatus.PICKED_UP:
        return 'status-completed';
      case OrderStatus.CANCELLED:
      case OrderStatus.RETURNED:
        return 'status-cancelled';
      case OrderStatus.SUSPENDED:
        return 'status-suspended';
      default:
        return 'status-unknown';
    }
  }

  getPaymentStatusBadgeClass(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.BOUGHT:
      case PaymentStatus.FILLED_IN:
        return 'payment-pending';
      case PaymentStatus.READY_FOR_PROCESSING:
        return 'payment-completed';
      case PaymentStatus.CANCELLED:
        return 'payment-cancelled';
      default:
        return 'payment-unknown';
    }
  }

  // Metody do wyświetlania rynku
  getMarketBadgeClass(market: string): string {
    if (market.toLowerCase().includes('pl')) return 'market-pl';
    if (market.toLowerCase().includes('cz')) return 'market-cz';
    if (market.toLowerCase().includes('sk')) return 'market-sk';
    if (market.toLowerCase().includes('hu')) return 'market-hu';
    return 'market-other';
  }

  getMarketDisplayName(market: string): string {
    if (market.toLowerCase().includes('pl')) return 'Allegro PL';
    if (market.toLowerCase().includes('cz')) return 'Allegro CZ';
    if (market.toLowerCase().includes('sk')) return 'Allegro SK';
    if (market.toLowerCase().includes('hu')) return 'Allegro HU';
    return market;
  }

  getInvoiceButtonText(order: Order): string {
    if (this.isInvoiceRequired(order)) {
      return 'Wystaw fakturę wymaganą';
    }
    return 'Wystaw fakturę';
  }

  isInvoiceRequired(order: Order): boolean {
    return order.invoice?.invoiceRequired === true;
  }

  sendToAllegroButtonText(element: Order) {
    if (this.isInvoiceRequired(element)) {
      return 'Wyślij do allegro (wymagana)';
    }
    return 'Wyślij do allegro';
  }

  // Metoda do wyświetlania nazwy kupującego
  getBuyerDisplayName(buyer: any): string {
    if (buyer.firstName && buyer.lastName) {
      return `${buyer.firstName} ${buyer.lastName}`;
    }
    if (buyer.companyName) {
      return buyer.companyName;
    }
    return 'Brak danych';
  }

  // Metoda do wyświetlania waluty
  formatCurrency(amount: number, currency: string): string {
    return `${amount.toFixed(2)} ${currency}`;
  }

  offerAllegroUrl(productId: string): string {
    return `${environment.allegroUrl}/oferta/${productId}`;
  }

  orderAllegroUrl(orderId: string): string {
    return `${environment.allegroSalesCenterUrl}/orders/${orderId}`;
  }
}
