// src/app/menu/orders/dialogs/invoice-generation-dialog/invoice-generation-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Order } from '../../model/orders-model';

export interface InvoiceGenerationDialogData {
  order: Order;
}

@Component({
  selector: 'app-invoice-generation-dialog',
  templateUrl: './invoice-generation-dialog.component.html',
  styleUrls: ['./invoice-generation-dialog.component.css']
})
export class InvoiceGenerationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<InvoiceGenerationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvoiceGenerationDialogData
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
}
