// src/app/menu/orders/dialogs/allegro-attachment-dialog/allegro-attachment-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Order, InvoiceInfo } from '../../model/orders-model';

export interface AllegroAttachmentDialogData {
  order: Order;
  invoice: InvoiceInfo;
}

@Component({
  selector: 'app-allegro-attachment-dialog',
  templateUrl: './allegro-attachment-dialog.component.html',
  styleUrls: ['./allegro-attachment-dialog.component.css']
})
export class AllegroAttachmentDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AllegroAttachmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AllegroAttachmentDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  getBuyerDisplayName(buyer: any): string {
    if (buyer.firstName && buyer.lastName) {
      return `${buyer.firstName} ${buyer.lastName}`;
    }
    if (buyer.companyName) {
      return buyer.companyName;
    }
    return 'Brak danych';
  }

  formatCurrency(amount: number, currency: string): string {
    return `${amount.toFixed(2)} ${currency}`;
  }

  getMarketDisplayName(market: string): string {
    if (market.toLowerCase().includes('pl')) return 'Allegro PL';
    if (market.toLowerCase().includes('cz')) return 'Allegro CZ';
    if (market.toLowerCase().includes('sk')) return 'Allegro SK';
    if (market.toLowerCase().includes('hu')) return 'Allegro HU';
    return market;
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

  isInvoiceRequired(order: Order): boolean {
    return order.invoice?.invoiceRequired === true;
  }
}
