import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { Order, OrderStatus, PaymentStatus, InvoiceInfo } from '../model/orders-model';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.css']
})
export class OrderItemComponent {
  @Input() order!: Order;
  @Input() successTemplate!: TemplateRef<any>;
  @Output() generateInvoice = new EventEmitter<Order>();
  @Output() attachToAllegro = new EventEmitter<{order: Order, invoice: InvoiceInfo}>();

  // Enums dostępne w template
  OrderStatus = OrderStatus;
  PaymentStatus = PaymentStatus;

  toggleDetails(): void {
    this.order.isExpanded = !this.order.isExpanded;
  }

  onGenerateInvoice(event: Event): void {
    event.stopPropagation();
    this.generateInvoice.emit(this.order);
  }

  onAttachToAllegro(event: Event, invoice: InvoiceInfo): void {
    event.stopPropagation();
    this.attachToAllegro.emit({ order: this.order, invoice });
  }

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

  canAttachToAllegro(invoice: InvoiceInfo): boolean {
    return !invoice.isAttachedToAllegro &&
      !invoice.isAttachingToAllegro &&
      (invoice.invoiceStatus === 'issued' ||
        invoice.invoiceStatus === 'sent' ||
        invoice.invoiceStatus === 'paid');
  }

  isInvoiceRequired(): boolean {
    return this.order.invoice?.invoiceRequired === true;
  }

  getInvoiceButtonText(): string {
    if (this.isInvoiceRequired()) {
      return 'Wystaw fakturę wymaganą';
    }
    return 'Wystaw fakturę';
  }
}
