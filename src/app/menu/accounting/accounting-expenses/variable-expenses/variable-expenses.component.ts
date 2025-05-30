// src/app/menu/accounting/accounting-expenses/variable-expenses/variable-expenses.component.ts
import {Component, Input, OnInit, OnChanges, SimpleChanges} from '@angular/core';

interface VariableExpense {
  id: number;
  category: string;
  name: string;
  amount: number; // netto
  date: string;
  supplier: string;
}

@Component({
  selector: 'app-variable-expenses',
  templateUrl: './variable-expenses.component.html',
  styleUrls: [
    './variable-expenses.component.css',
    '../shared/expenses-shared.styles.css',
  ]
})
export class VariableExpensesComponent implements OnInit, OnChanges {
  @Input() selectedMonth!: number;
  @Input() selectedYear!: number;
  @Input() currentMonth!: string;
  @Input() searchQuery!: string;
  @Input() showGross!: boolean;

  isLoading: boolean = false;

  // Mock data for variable expenses (until backend is implemented)
  variableExpenses: VariableExpense[] = [
    {
      id: 6,
      category: 'Materiały',
      name: 'Filament PLA czarny',
      amount: 122,
      date: '2023-06-05',
      supplier: 'FilamentWorld'
    },
    {
      id: 7,
      category: 'Materiały',
      name: 'Filament PETG transparent',
      amount: 146,
      date: '2023-06-05',
      supplier: 'FilamentWorld'
    },
    {id: 8, category: 'Materiały', name: 'Kartony 20x20x10', amount: 98, date: '2023-06-03', supplier: 'PackagingPro'},
    {
      id: 9,
      category: 'Materiały',
      name: 'Elementy złączne M4',
      amount: 37,
      date: '2023-06-02',
      supplier: 'HardwareShop'
    },
    {id: 10, category: 'Biuro', name: 'Artykuły biurowe', amount: 65, date: '2023-06-02', supplier: 'OfficeSupplies'}
  ];

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
    console.log(`Loading variable expenses for ${this.selectedMonth}/${this.selectedYear}`);
  }

  formatCurrency(value: number): string {
    const adjustedValue = this.showGross ? value * 1.23 : value;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(adjustedValue);
  }

  getVariableExpensesTotal(): number {
    const total = this.variableExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return this.showGross ? total * 1.23 : total;
  }
}
