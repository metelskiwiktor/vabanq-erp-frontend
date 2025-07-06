// src/app/menu/accounting/accounting-expenses/accounting-expenses.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExpenseService, ExpenseResponse, ExpenseCategory } from '../../../utility/service/expense.service';

interface ExpenseItem {
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'VARIABLE';
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date: string;
  tags: string[];
  itemsCount: number;
  invoicesCount: number;
  cyclic: boolean;
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

  categoryOptions: { value: string; label: string }[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private expenseService: ExpenseService
  ) {}

  ngOnInit(): void {
    this.initializeCategoryOptions();
    this.loadExpenses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCategoryOptions(): void {
    this.categoryOptions = [
      { value: '', label: 'Wszystkie kategorie' },
      ...this.expenseService.getAvailableCategories().map(cat => ({
        value: cat.key,
        label: cat.displayName
      }))
    ];
  }

  loadExpenses(): void {
    this.isLoading = true;

    // Format month as YYYY-MM for backend
    const monthString = this.formatMonthForBackend(this.selectedMonth);

    this.expenseService.listExpenses(monthString)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expenses: ExpenseResponse[]) => {
          this.expenses = expenses.map(expense => this.mapExpenseResponseToItem(expense));
          this.applyFilters();
          this.calculateSummary();
          this.isLoading = false;
          console.log(`Loaded ${this.expenses.length} expenses for ${monthString}`);
        },
        error: (error) => {
          console.error('Error loading expenses:', error);
          this.snackBar.open('Błąd podczas ładowania wydatków', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
          this.expenses = [];
          this.filteredExpenses = [];
          this.calculateSummary();
        }
      });
  }

  private formatMonthForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private mapExpenseResponseToItem(expense: ExpenseResponse): ExpenseItem {
    return {
      id: expense.id,
      name: expense.name,
      description: expense.description || '',
      type: expense.type,
      category: expense.category,
      amount: Number(expense.totalCost),
      currency: 'PLN', // Default currency
      date: expense.createdAt,
      tags: expense.tags || [],
      itemsCount: 0, // Will be determined by backend later
      invoicesCount: 0, // Will be determined by backend later
      cyclic: expense.cyclic
    };
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
      totalInvoices: 0 // TODO: Get from backend
    };
  }

  // Actions - placeholders for now
  createNewExpense(): void {
    console.log('Creating new expense...');
    this.snackBar.open('Funkcja tworzenia wydatku będzie wkrótce dostępna', 'Zamknij', {
      duration: 3000
    });
  }

  exportExpenses(): void {
    console.log('Exporting expenses...');
    this.snackBar.open('Funkcja eksportu będzie wkrótce dostępna', 'Zamknij', {
      duration: 3000
    });
  }

  viewExpenseDetails(expense: ExpenseItem): void {
    console.log('Viewing expense details:', expense.id);
    this.snackBar.open('Funkcja szczegółów wydatku będzie wkrótce dostępna', 'Zamknij', {
      duration: 3000
    });
  }

  viewExpenseInvoices(expense: ExpenseItem): void {
    console.log('Viewing expense invoices:', expense.id);
    this.snackBar.open('Funkcja przeglądania faktur będzie wkrótce dostępna', 'Zamknij', {
      duration: 3000
    });
  }

  addExpenseItem(expense: ExpenseItem): void {
    console.log('Adding item to expense:', expense.id);
    this.snackBar.open('Funkcja dodawania pozycji będzie wkrótce dostępna', 'Zamknij', {
      duration: 3000
    });
  }

  editExpense(expense: ExpenseItem): void {
    console.log('Editing expense:', expense.id);
    this.snackBar.open('Funkcja edycji wydatku będzie wkrótce dostępna', 'Zamknij', {
      duration: 3000
    });
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

  getCategoryDisplayName(category: ExpenseCategory): string {
    return this.expenseService.getCategoryDisplayName(category);
  }

  getTypeDisplayName(type: 'FIXED' | 'VARIABLE'): string {
    return this.expenseService.getTypeDisplayName(type);
  }
}
