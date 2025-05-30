// src/app/menu/accounting/accounting-expenses/offer-costs-table/offer-costs-table.component.ts
import {Component, Input, OnInit} from '@angular/core';

interface Offer {
  id: number;
  name: string;
  productsIncluded: string;
  totalCost: number;
  offerPrice: number;
  margin: number;
}

@Component({
  selector: 'app-offer-costs-table',
  templateUrl: './offer-costs-table.component.html',
  styleUrls: [
    './offer-costs-table.component.css',
    '../shared/expenses-shared.styles.css']
})
export class OfferCostsTableComponent implements OnInit {
  @Input() searchQuery!: string;
  @Input() showGross!: boolean;

  // Mock data for offers
  offers: Offer[] = [
    {
      id: 1,
      name: 'Zestaw biurkowy Premium',
      productsIncluded: 'Organizer na biurko, Uchwyt na słuchawki, Stojak na telefon',
      totalCost: 84.53,
      offerPrice: 129.99,
      margin: 34.97
    },
    {
      id: 2,
      name: 'Zestaw magnetycznych organizerów',
      productsIncluded: 'Znacznik magnetyczny (5 szt.)',
      totalCost: 72.50,
      offerPrice: 129.99,
      margin: 44.23
    }
  ];

  constructor() {
  }

  ngOnInit(): void {
    // Component initialization
  }

  formatCurrency(value: number): string {
    const adjustedValue = this.showGross ? value * 1.23 : value;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(adjustedValue);
  }

  getMarginClass(margin: number): string {
    if (margin > 45) return 'margin-high';
    if (margin > 30) return 'margin-medium';
    return 'margin-low';
  }
}
