// src/app/menu/accounting/accounting-expenses/product-costs-table/product-costs-table.component.ts
import {Component, Input, OnInit} from '@angular/core';

interface Product {
  id: number;
  name: string;
  ean: string;
  materialCost: number;
  powerCost: number;
  packagingCost: number;
  laborCost: number;
  totalCost: number;
  retailPrice: number;
  margin: number;
}

@Component({
  selector: 'app-product-costs-table',
  templateUrl: './product-costs-table.component.html',
  styleUrls: [
    './product-costs-table.component.css',
    '../shared/expenses-shared.styles.css']
})
export class ProductCostsTableComponent implements OnInit {
  @Input() searchQuery!: string;
  @Input() showGross!: boolean;

  // Mock data for products
  products: Product[] = [
    {
      id: 1,
      name: 'Znacznik magnetyczny',
      ean: '5901234123457',
      materialCost: 6.65,
      powerCost: 0.40,
      packagingCost: 1.20,
      laborCost: 6.25,
      totalCost: 14.50,
      retailPrice: 29.99,
      margin: 51.65
    },
    {
      id: 2,
      name: 'Organizer na biurko',
      ean: '5901234123458',
      materialCost: 22.35,
      powerCost: 0.96,
      packagingCost: 2.50,
      laborCost: 12.50,
      totalCost: 38.31,
      retailPrice: 59.99,
      margin: 36.14
    },
    {
      id: 3,
      name: 'Uchwyt na słuchawki',
      ean: '5901234123459',
      materialCost: 17.80,
      powerCost: 0.64,
      packagingCost: 1.80,
      laborCost: 8.75,
      totalCost: 28.99,
      retailPrice: 49.99,
      margin: 42.01
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
