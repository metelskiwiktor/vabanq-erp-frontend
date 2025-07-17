// src/app/menu/accounting/accounting-expenses/accounting-expenses.component.ts - Updated with edit dialog integration
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  ExpenseService,
  ExpenseResponse,
  ExpenseCategory,
  ExpenseEntry
} from '../../../utility/service/expense.service';
import { CreateExpenseDialogComponent, CreateExpenseDialogData } from './create-expense-dialog/create-expense-dialog.component';
import {ElectricityUsageResponse, ElectricityUsageService} from "../../../utility/service/electricity-usage.service";

interface ExpenseItem {
  expanded: boolean;
  id: string;
  name: string;
  description: string;
  type: 'FIXED' | 'VARIABLE';
  category: ExpenseCategory;
  netAmount: number;        // Zaktualizowane pole
  grossAmount: number;      // Zaktualizowane pole
  currency: string;
  date: string;
  tags: string[];
  itemsCount: number;
  invoicesCount: number;
  cyclic: boolean;
  items: ExpenseEntry[];
}

interface ExpenseSummary {
  totalNetAmount: number;     // Zaktualizowane pole
  totalGrossAmount: number;   // Zaktualizowane pole
  totalCount: number;
  fixedNetAmount: number;     // Zaktualizowane pole
  fixedGrossAmount: number;   // Zaktualizowane pole
  fixedCount: number;
  variableNetAmount: number;  // Zaktualizowane pole
  variableGrossAmount: number; // Zaktualizowane pole
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
    totalNetAmount: 0,
    totalGrossAmount: 0,
    totalCount: 0,
    fixedNetAmount: 0,
    fixedGrossAmount: 0,
    fixedCount: 0,
    variableNetAmount: 0,
    variableGrossAmount: 0,
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
    private expenseService: ExpenseService,
    private dialog: MatDialog,
    private electricityService: ElectricityUsageService
  ) {}

  ngOnInit(): void {
    this.initializeCategoryOptions();
    this.loadExpenses();
    this.loadElectricityData();
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
          console.log('Loaded expenses:', expenses);
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
      expanded: false,
      name: expense.name,
      description: expense.description || '',
      type: expense.type,
      category: expense.category,
      netAmount: Number(expense.totalNetCost),      // Zaktualizowane pole
      grossAmount: Number(expense.totalGrossCost),  // Zaktualizowane pole
      currency: 'PLN', // Default currency
      date: expense.createdAt,
      tags: expense.tags || [],
      itemsCount: expense.items?.length || 0,
      invoicesCount: expense.items?.filter(item => item.costInvoiceId).length || 0,
      cyclic: expense.cyclic,
      items: expense.items || []
    };
  }

  // Toggle expense expansion
  toggleExpenseExpansion(expense: ExpenseItem): void {
    expense.expanded = !expense.expanded;

    // If expanding and no items loaded yet, load details
    if (expense.expanded && expense.items.length === 0) {
      this.loadExpenseDetails(expense);
    }
  }

  private loadExpenseDetails(expense: ExpenseItem): void {
    this.expenseService.getExpense(expense.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (detailedExpense: ExpenseResponse) => {
          expense.items = detailedExpense.items || [];
          expense.itemsCount = expense.items.length;
          expense.invoicesCount = expense.items.filter(item => item.costInvoiceId).length;
        },
        error: (error) => {
          console.error('Error loading expense details:', error);
          this.snackBar.open('Błąd podczas ładowania szczegółów wydatku', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Month navigation
  previousMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.loadExpenses();
    this.loadElectricityData();
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.loadExpenses();
    this.loadElectricityData();
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
      totalNetAmount: filtered.reduce((sum, exp) => sum + exp.netAmount, 0),
      totalGrossAmount: filtered.reduce((sum, exp) => sum + exp.grossAmount, 0),
      totalCount: filtered.length,
      fixedNetAmount: filtered.filter(exp => exp.type === 'FIXED').reduce((sum, exp) => sum + exp.netAmount, 0),
      fixedGrossAmount: filtered.filter(exp => exp.type === 'FIXED').reduce((sum, exp) => sum + exp.grossAmount, 0),
      fixedCount: filtered.filter(exp => exp.type === 'FIXED').length,
      variableNetAmount: filtered.filter(exp => exp.type === 'VARIABLE').reduce((sum, exp) => sum + exp.netAmount, 0),
      variableGrossAmount: filtered.filter(exp => exp.type === 'VARIABLE').reduce((sum, exp) => sum + exp.grossAmount, 0),
      variableCount: filtered.filter(exp => exp.type === 'VARIABLE').length,
      assignedInvoices: filtered.reduce((sum, exp) => sum + exp.invoicesCount, 0),
      totalInvoices: 0 // TODO: Get from backend
    };
  }

  // Actions - Updated with actual dialog implementation
  createNewExpense(): void {
    const dialogData: CreateExpenseDialogData = {
      mode: 'create',
      selectedMonth: this.selectedMonth
    };

    const dialogRef = this.dialog.open(CreateExpenseDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      panelClass: ['custom-dialog-panel', 'expense-dialog'],
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          this.snackBar.open('Wydatek został utworzony pomyślnie', 'Zamknij', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });

          // Reload expenses to show the new one
          this.loadExpenses();
        }
      });
  }

  editExpense(expense: ExpenseItem): void {
    const dialogData: CreateExpenseDialogData = {
      mode: 'edit',
      expenseId: expense.id
    };

    const dialogRef = this.dialog.open(CreateExpenseDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: false,
      panelClass: ['custom-dialog-panel', 'expense-dialog'],
      data: dialogData
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result?.success) {
          const actionText = result.action === 'updated' ? 'zaktualizowany' : 'zmodyfikowany';
          this.snackBar.open(`Wydatek został ${actionText} pomyślnie`, 'Zamknij', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });

          // Reload expenses to show changes
          this.loadExpenses();
        }
      });
  }

  viewExpenseDetails(expense: ExpenseItem): void {
    this.toggleExpenseExpansion(expense);
  }

  addExpenseItem(expense: ExpenseItem): void {
    // Will be handled in separate dialog - for now just show info
    this.snackBar.open('Aby dodać pozycje do wydatku, użyj przycisku "Edytuj"', 'Zamknij', {
      duration: 3000
    });
  }

  // Helper method to get manual items count for an expense
  getManualItemsCount(): number {
    // This would be implemented in the dialog, but here for reference
    return 1; // Default for create mode
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

  // Check if expense item is from invoice
  isInvoiceItem(item: ExpenseEntry): boolean {
    return !!item.costInvoiceId;
  }

  // Get item type display name
  getItemTypeDisplayName(item: ExpenseEntry): string {
    return this.isInvoiceItem(item) ? 'Faktura' : 'Manualny';
  }

  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  getCurrentYearMonth(): string {
    const month = (this.selectedMonth.getMonth()).toString().padStart(2, '0');
    return `${this.currentYear}-${month}`;
  }

  electricityData = {
    kwhPerHour: 0,
    pricePerKwh: 0,
    monthlyCost: 0
  };
  isElectricityLoading = false;
  isElectricitySaving = false;

  private loadElectricityData(): void {
    this.isElectricityLoading = true;
    const currentYearMonth = this.getCurrentYearMonth();

    this.electricityService.getUsage(currentYearMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ElectricityUsageResponse) => {
          this.electricityData = {
            kwhPerHour: response.kwhPerHour,
            pricePerKwh: response.pricePerKwh,
            monthlyCost: this.electricityService.calculateMonthlyCost(
              response.kwhPerHour,
              response.pricePerKwh
            )
          };
          this.isElectricityLoading = false;
        },
        error: (error) => {
          console.error('Error loading electricity data:', error);
          // W przypadku błędu (np. brak danych dla tego miesiąca), ustaw wartości domyślne
          this.electricityData = {
            kwhPerHour: 0,
            pricePerKwh: 0,
            monthlyCost: 0
          };
          this.isElectricityLoading = false;
        }
      });
  }

  calculateElectricityCost(): void {
    this.electricityData.monthlyCost = this.electricityService.calculateMonthlyCost(
      this.electricityData.kwhPerHour,
      this.electricityData.pricePerKwh
    );
  }

  saveElectricityData(): void {
    if (this.electricityData.kwhPerHour < 0 || this.electricityData.pricePerKwh < 0) {
      this.snackBar.open('Wartości nie mogą być ujemne', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isElectricitySaving = true;
    const currentYearMonth = this.getCurrentYearMonth();

    const request = {
      kwhPerHour: this.electricityData.kwhPerHour,
      pricePerKwh: this.electricityData.pricePerKwh
    };

    this.electricityService.updateUsage(currentYearMonth, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.calculateElectricityCost(); // Przelicz koszt po zapisaniu
          this.snackBar.open('Dane elektryczności zostały zapisane', 'Zamknij', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.isElectricitySaving = false;
        },
        error: (error) => {
          console.error('Error saving electricity data:', error);
          this.snackBar.open('Błąd podczas zapisywania danych elektryczności', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isElectricitySaving = false;
        }
      });
  }

}
