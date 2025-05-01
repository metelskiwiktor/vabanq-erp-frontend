import { Component, inject, OnInit, TemplateRef } from '@angular/core';
import { Order, InvoiceInfo } from './model/orders-model';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import { ProductService } from "../../utility/service/product.service";
import { ToastService } from "../../utility/service/toast-service";
import { InfaktService } from "../../utility/service/infakt.service";

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

  columnsToDisplay: string[] = [
    'orderId',
    'saleDate',
    'market',
    'status',
    'totalAmount',
    'invoice' // Added invoice column
  ];

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
        // Check for existing invoices for each order
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
    this.orders.forEach(order => {
      this.infaktService.getInvoicesForOrder(order.orderId).subscribe(invoices => {
        if (invoices && invoices.length > 0) {
          order.invoices = invoices.map(inv => ({
            invoiceId: inv.id,
            invoiceNumber: inv.number,
            invoiceStatus: inv.status,
            invoiceUrl: inv.url,
            createdAt: inv.createdAt
          }));
        }
      });
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

  // Invoice generation methods
  generateInvoice(order: Order, template: TemplateRef<any>): void {
    // Prevent event propagation to avoid expanding/collapsing order details
    event?.stopPropagation();

    // Set flag to show loading spinner
    order.isInvoiceGenerating = true;

    this.infaktService.generateInvoice(order).subscribe({
      next: (response) => {
        // Create invoice info and add to order
        const invoiceInfo: InvoiceInfo = {
          invoiceId: response.id,
          invoiceNumber: response.number,
          invoiceStatus: response.status,
          invoiceUrl: response.url,
          createdAt: response.createdAt
        };

        if (!order.invoices) {
          order.invoices = [];
        }

        order.invoices.push(invoiceInfo);
        order.isInvoiceGenerating = false;

        // Show success message
        this.toastSuccessMessage = `Faktura ${response.number} została wygenerowana pomyślnie.`;
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

  sendInvoiceEmail(order: Order, invoiceId: string, template: TemplateRef<any>): void {
    event?.stopPropagation();

    this.infaktService.sendInvoiceEmail(invoiceId, order.buyer.email).subscribe({
      next: (success) => {
        if (success) {
          this.toastSuccessMessage = `Faktura została wysłana na adres ${order.buyer.email}.`;
          this.showSuccess(template);
        }
      },
      error: (error) => {
        console.error('Failed to send invoice email:', error);
        this.toastService.show({
          template: template,
          classname: 'bg-danger text-light',
          delay: 2000,
          text: 'Nie udało się wysłać faktury. Spróbuj ponownie.',
        });
      }
    });
  }

  downloadInvoicePdf(invoiceId: string, invoiceNumber: string): void {
    event?.stopPropagation();

    this.infaktService.getInvoicePdfUrl(invoiceId).subscribe(url => {
      // Create an anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `Faktura_${invoiceNumber.replace('/', '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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

    // Zresetuj elementy formularza
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
      // Filtrowanie po tekście
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

      // Filtrowanie po statusie
      if (this.filterStatus && order.status !== this.filterStatus) {
        return false;
      }

      // Filtrowanie po fakturach
      if (this.filterHasInvoice && (!order.invoices || order.invoices.length === 0)) {
        return false;
      }

      // Filtrowanie po dacie od
      if (this.filterDateFrom) {
        const saleDate = new Date(order.saleDate);
        if (saleDate < this.filterDateFrom) {
          return false;
        }
      }

      // Filtrowanie po dacie do
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
      'draft': 'Szkic',
      'issued': 'Wystawiona',
      'sent': 'Wysłana',
      'paid': 'Opłacona',
      'partial': 'Częściowo opłacona'
    };

    return statusMap[status] || status;
  }
}
