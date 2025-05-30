// src/app/menu/accounting/accounting-expenses/product-expenses/product-expenses.component.ts
import {Component, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-product-expenses',
  templateUrl: './product-expenses.component.html',
  styleUrls: [
    './product-expenses.component.css',
    '../shared/expenses-shared.styles.css',]
})
export class ProductExpensesComponent implements OnInit, OnChanges {
  @Input() selectedMonth!: number;
  @Input() selectedYear!: number;
  @Input() currentMonth!: string;

  productSubTab: string = 'products';
  searchQuery: string = '';
  showGross: boolean = false; // Zmienione na false - domyślnie netto

  constructor() {
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] || changes['selectedYear']) {
      // Reload data when month/year changes
      this.loadData();
    }
  }

  private loadData(): void {
    // Load data based on selected month/year
    console.log(`Loading product expenses for ${this.selectedMonth}/${this.selectedYear}`);
  }

  setProductSubTab(subTab: string): void {
    this.productSubTab = subTab;
  }

  toggleGross(): void {
    this.showGross = !this.showGross;
    console.log('Gross display toggled to:', this.showGross);
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;
  }
}
