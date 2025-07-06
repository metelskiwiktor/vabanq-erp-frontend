import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ExpenseItem {
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  amount: number;
  currency: string;
  date: string;
  tags: string[];
  itemsCount: number;
  invoicesCount: number;
}

interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  fixedAmount: number;
  fixedCount: number;
  variableAmount: number;
  variableCount: number;
  assignedInvoices: number;
  totalInvoices: number;
}

@Component({
  selector: 'app-accounting-expenses',
  templateUrl: './accounting-expenses.component.html',
  styleUrls: ['./accounting-expenses.component.css']
})
export class AccountingExpensesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  expenses: ExpenseItem[] = [];
  filteredExpenses: ExpenseItem[] = [];
  summary: ExpenseSummary = {
    totalAmount: 0,
    totalCount: 0,
    fixedAmount: 0,
    fixedCount: 0,
    variableAmount: 0,
    variableCount: 0,
    assignedInvoices: 0,
    totalInvoices: 0
  };

  // State
  isLoading = false;
  selectedMonth = new Date();

  // Filters
  searchText = '';
  typeFilter = '';
  categoryFilter = '';

  // Filter options
  typeOptions = [
    { value: '', label: 'Wszystkie typy' },
    { value: 'FIXED', label: 'Stałe' },
    { value: 'VARIABLE', label: 'Zmienne' }
  ];

  categoryOptions = [
    { value: '', label: 'Wszystkie kategorie' },
    { value: 'SERVICES', label: 'Usługi' },
    { value: 'OFFICE_SUPPLIES', label: 'Biuro' },
    { value: 'ACCOUNTING', label: 'Księgowość' },
    { value: 'MATERIALS', label: 'Materiały' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITIES', label: 'Media' },
    { value: 'OTHER', label: 'Inne' }
  ];

  constructor(
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadExpenses(): void {
    this.isLoading = true;

    // Mock data for now - replace with actual service call
    setTimeout(() => {
      this.expenses = this.getMockExpenses();
      this.applyFilters();
      this.calculateSummary();
      this.isLoading = false;
    }, 500);
  }

  private getMockExpenses(): ExpenseItem[] {
    return [
      {
        id: 'exp-001',
        name: 'Koszty biurowe - Maj 2024',
        description: 'Zakup materiałów biurowych, papieru i akcesoriów do drukarek',
        type: 'FIXED',
        category: 'OFFICE_SUPPLIES',
        amount: 4250.00,
        currency: 'PLN',
        date: '2024-05-15',
        tags: ['biuro', 'materiały'],
        itemsCount: 3,
        invoicesCount: 2
      },
      {
        id: 'exp-002',
        name: 'Serwis drukarek 3D',
        description: 'Przegląd techniczny i naprawa urządzeń drukujących',
        type: 'VARIABLE',
        category: 'SERVICES',
        amount: 1850.00,
        currency: 'PLN',
        date: '2024-05-10',
        tags: ['serwis', 'drukarki', 'naprawa'],
        itemsCount: 1,
        invoicesCount: 1
      },
      {
        id: 'exp-003',
        name: 'Energia elektryczna - Maj',
        description: 'Opłaty za energię elektryczną w hali produkcyjnej',
        type: 'FIXED',
        category: 'UTILITIES',
        amount: 3200.00,
        currency: 'PLN',
        date: '2024-05-05',
        tags: ['energia', 'media'],
        itemsCount: 1,
        invoicesCount: 1
      },
      {
        id: 'exp-004',
        name: 'Kampania marketingowa Q2',
        description: 'Reklama online, materiały promocyjne i kampanie społecznościowe',
        type: 'VARIABLE',
        category: 'MARKETING',
        amount: 8500.00,
        currency: 'PLN',
        date: '2024-05-01',
        tags: ['marketing', 'reklama', 'q2'],
        itemsCount: 5,
        invoicesCount: 3
      },
      {
        id: 'exp-005',
        name: 'Usługi księgowe - Maj 2024',
        description: 'Prowadzenie księgowości i obsługa podatkowa',
        type: 'FIXED',
        category: 'ACCOUNTING',
        amount: 2500.00,
        currency: 'PLN',
        date: '2024-04-25',
        tags: ['księgowość', 'podatki'],
        itemsCount: 1,
        invoicesCount: 1
      },
      {
        id: 'exp-006',
        name: 'Materiały do drukarek 3D',
        description: 'Filamenty PLA, ABS i materiały pomocnicze',
        type: 'VARIABLE',
        category: 'MATERIALS',
        amount: 3750.00,
        currency: 'PLN',
        date: '2024-05-12',
        tags: ['materiały', 'filamenty', 'drukarki'],
        itemsCount: 4,
        invoicesCount: 2
      },
      {
        id: 'exp-007',
        name: 'Abonament internetowy',
        description: 'Opłaty za internet w biurze i hali produkcyjnej',
        type: 'FIXED',
        category: 'UTILITIES',
        amount: 450.00,
        currency: 'PLN',
        date: '2024-05-01',
        tags: ['internet', 'abonament'],
        itemsCount: 1,
        invoicesCount: 1
      },
      {
        id: 'exp-008',
        name: 'Transport materiałów',
        description: 'Koszty dostawy materiałów od dostawców',
        type: 'VARIABLE',
        category: 'SERVICES',
        amount: 850.00,
        currency: 'PLN',
        date: '2024-05-18',
        tags: ['transport', 'dostawa'],
        itemsCount: 2,
        invoicesCount: 1
      }
    ];
  }

  // Month navigation
  previousMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.loadExpenses();
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.loadExpenses();
  }

  // Filters
  onSearchChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onCategoryFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredExpenses = this.expenses.filter(expense => {
      const matchesSearch = !this.searchText ||
        expense.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        expense.description.toLowerCase().includes(this.searchText.toLowerCase()) ||
        expense.tags.some(tag => tag.toLowerCase().includes(this.searchText.toLowerCase()));

      const matchesType = !this.typeFilter || expense.type === this.typeFilter;
      const matchesCategory = !this.categoryFilter || expense.category === this.categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });

    this.calculateSummary();
  }

  private calculateSummary(): void {
    const filtered = this.filteredExpenses;

    this.summary = {
      totalAmount: filtered.reduce((sum, exp) => sum + exp.amount, 0),
      totalCount: filtered.length,
      fixedAmount: filtered.filter(exp => exp.type === 'FIXED').reduce((sum, exp) => sum + exp.amount, 0),
      fixedCount: filtered.filter(exp => exp.type === 'FIXED').length,
      variableAmount: filtered.filter(exp => exp.type === 'VARIABLE').reduce((sum, exp) => sum + exp.amount, 0),
      variableCount: filtered.filter(exp => exp.type === 'VARIABLE').length,
      assignedInvoices: filtered.reduce((sum, exp) => sum + exp.invoicesCount, 0),
      totalInvoices: 23 // Mock total invoices available
    };
  }

  // Actions
  createNewExpense(): void {
    console.log('Creating new expense...');
    // TODO: Open create expense dialog
  }

  exportExpenses(): void {
    console.log('Exporting expenses...');
    // TODO: Implement export functionality
  }

  viewExpenseDetails(expense: ExpenseItem): void {
    console.log('Viewing expense details:', expense.id);
    // TODO: Open expense details dialog
  }

  viewExpenseInvoices(expense: ExpenseItem): void {
    console.log('Viewing expense invoices:', expense.id);
    // TODO: Open invoices dialog
  }

  addExpenseItem(expense: ExpenseItem): void {
    console.log('Adding item to expense:', expense.id);
    // TODO: Open add item dialog
  }

  editExpense(expense: ExpenseItem): void {
    console.log('Editing expense:', expense.id);
    // TODO: Open edit expense dialog
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pl-PL');
  }

  getMonthDisplayName(): string {
    return this.selectedMonth.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long'
    });
  }

  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'SERVICES': 'Usługi',
      'OFFICE_SUPPLIES': 'Biuro',
      'ACCOUNTING': 'Księgowość',
      'MATERIALS': 'Materiały',
      'MARKETING': 'Marketing',
      'UTILITIES': 'Media',
      'OTHER': 'Inne'
    };
    return categoryMap[category] || category;
  }

  getTypeDisplayName(type: 'FIXED' | 'VARIABLE'): string {
    return type === 'FIXED' ? 'STAŁY' : 'ZMIENNY';
  }
}
