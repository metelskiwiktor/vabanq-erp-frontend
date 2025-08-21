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
import {
  AssignInvoiceDialogComponent,
  AssignInvoiceDialogData
} from '../accounting-invoices/expense/assign-invoice-dialog/assign-invoice-dialog.component';
import { CostInvoiceService, CostInvoice } from '../../../utility/service/cost-invoice.service';

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
  cyclicFilter = '';
  dateRangeFilter = '';
  amountRangeFilter = { min: 0, max: 0 };
  tagsFilter: string[] = [];
  invoiceStatusFilter = '';

  // Filter options
  typeOptions = [
    { value: '', label: 'Wszystkie typy' },
    { value: 'FIXED', label: 'Stałe' },
    { value: 'VARIABLE', label: 'Zmienne' }
  ];

  categoryOptions: { value: string; label: string }[] = [];

  cyclicOptions = [
    { value: '', label: 'Wszystkie' },
    { value: 'true', label: 'Cykliczne' },
    { value: 'false', label: 'Jednorazowe' }
  ];

  invoiceStatusOptions = [
    { value: '', label: 'Wszystkie' },
    { value: 'with_invoices', label: 'Z fakturami' },
    { value: 'without_invoices', label: 'Bez faktur' },
    { value: 'partial_invoices', label: 'Częściowo z fakturami' }
  ];

  dateRangeOptions = [
    { value: '', label: 'Cały miesiąc' },
    { value: 'week1', label: 'Pierwszy tydzień' },
    { value: 'week2', label: 'Drugi tydzień' },
    { value: 'week3', label: 'Trzeci tydzień' },
    { value: 'week4', label: 'Czwarty tydzień' }
  ];

  availableTags: string[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private expenseService: ExpenseService,
    private dialog: MatDialog,
    private electricityService: ElectricityUsageService,
    private costInvoiceService: CostInvoiceService
  ) {}

  ngOnInit(): void {
    this.initializeCategoryOptions();
    this.loadExpenses();
    this.loadElectricityData();
    this.initializeAmountRange();
    this.extractAvailableTags();
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
          this.initializeAmountRange();
          this.extractAvailableTags();
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

  onCyclicFilterChange(): void {
    this.applyFilters();
  }

  onDateRangeFilterChange(): void {
    this.applyFilters();
  }

  onAmountRangeFilterChange(): void {
    this.applyFilters();
  }

  onInvoiceStatusFilterChange(): void {
    this.applyFilters();
  }

  onTagsFilterChange(): void {
    this.applyFilters();
  }

  toggleTagFilter(tag: string): void {
    const index = this.tagsFilter.indexOf(tag);
    if (index === -1) {
      this.tagsFilter.push(tag);
    } else {
      this.tagsFilter.splice(index, 1);
    }
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.searchText = '';
    this.typeFilter = '';
    this.categoryFilter = '';
    this.cyclicFilter = '';
    this.dateRangeFilter = '';
    this.amountRangeFilter = { min: 0, max: 0 };
    this.tagsFilter = [];
    this.invoiceStatusFilter = '';
    this.initializeAmountRange();
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredExpenses = this.expenses.filter(expense => {
      // Search filter
      const matchesSearch = !this.searchText ||
        expense.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        expense.description.toLowerCase().includes(this.searchText.toLowerCase()) ||
        expense.tags.some(tag => tag.toLowerCase().includes(this.searchText.toLowerCase()));

      // Type filter
      const matchesType = !this.typeFilter || expense.type === this.typeFilter;
      
      // Category filter
      const matchesCategory = !this.categoryFilter || expense.category === this.categoryFilter;
      
      // Cyclic filter
      const matchesCyclic = !this.cyclicFilter || 
        (this.cyclicFilter === 'true' && expense.cyclic) ||
        (this.cyclicFilter === 'false' && !expense.cyclic);

      // Amount range filter
      const matchesAmountRange = (this.amountRangeFilter.max === 0) ||
        (expense.grossAmount >= this.amountRangeFilter.min && 
         expense.grossAmount <= this.amountRangeFilter.max);

      // Tags filter
      const matchesTags = this.tagsFilter.length === 0 ||
        this.tagsFilter.every(filterTag => 
          expense.tags.some(expenseTag => expenseTag.toLowerCase().includes(filterTag.toLowerCase()))
        );

      // Invoice status filter
      const matchesInvoiceStatus = this.matchesInvoiceStatusFilter(expense);

      // Date range filter (by day of month)
      const matchesDateRange = this.matchesDateRangeFilter(expense);

      return matchesSearch && matchesType && matchesCategory && matchesCyclic && 
             matchesAmountRange && matchesTags && matchesInvoiceStatus && matchesDateRange;
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

  // Utility methods
  formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
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
    const monthString = this.formatMonthForBackend(this.selectedMonth);

    this.electricityService.getUsage(monthString)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ElectricityUsageResponse) => {
          this.electricityData = {
            kwhPerHour: response.kwhPerHour,
            pricePerKwh: response.grossPricePerKwh,
            monthlyCost: this.electricityService.calculateMonthlyCost(
              response.kwhPerHour,
              response.grossPricePerKwh
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
      grossPricePerKwh: this.electricityData.pricePerKwh
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

  // Click handler for invoice items
  onInvoiceItemClick(item: ExpenseEntry, expenseId: string): void {
    if (!item.costInvoiceId) {
      console.warn('No cost invoice ID found for item:', item);
      return;
    }

    console.log('Clicked on invoice item:', item);

    // Load the cost invoice details
    this.costInvoiceService.getCostInvoiceById(item.costInvoiceId).subscribe({
      next: (invoice) => {
        console.log('Loaded cost invoice:', invoice);

        // Get current expense details for target month
        this.expenseService.getExpense(expenseId).subscribe({
          next: (expense) => {
            console.log('Loaded current expense:', expense);

            // Extract month from expense createdAt
            const expenseDate = new Date(expense.createdAt);
            const targetMonth = {
              year: expenseDate.getFullYear(),
              month: expenseDate.getMonth() + 1
            };

            const dialogData: AssignInvoiceDialogData = {
              invoice: invoice,
              currentExpenseId: expenseId,
              targetMonth: targetMonth
            };

            this.openAssignInvoiceDialog(dialogData);
          },
          error: (error) => {
            console.error('Error loading current expense:', error);
            // Fallback without target month
            const dialogData: AssignInvoiceDialogData = {
              invoice: invoice,
              currentExpenseId: expenseId
            };

            this.openAssignInvoiceDialog(dialogData);
          }
        });
      },
      error: (error) => {
        console.error('Error loading cost invoice:', error);
        this.snackBar.open('Błąd podczas ładowania faktury kosztowej', 'Zamknij', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private openAssignInvoiceDialog(dialogData: AssignInvoiceDialogData): void {
    console.log('Opening assign invoice dialog with data:', dialogData);

    const dialogRef = this.dialog.open(AssignInvoiceDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      panelClass: ['custom-dialog-panel', 'expense-dialog'],
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Assign invoice dialog closed with result:', result);
      if (result?.success) {
        this.snackBar.open(
          result.action === 'created'
            ? 'Wydatek został utworzony i faktura została przypisana'
            : 'Faktura została przypisana do wydatku',
          'Zamknij',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        // Reload expenses to reflect changes
        this.loadExpenses();
      }
    });
  }

  // Helper methods for advanced filtering
  private matchesInvoiceStatusFilter(expense: ExpenseItem): boolean {
    if (!this.invoiceStatusFilter) return true;

    switch (this.invoiceStatusFilter) {
      case 'with_invoices':
        return expense.invoicesCount > 0 && expense.invoicesCount === expense.itemsCount;
      case 'without_invoices':
        return expense.invoicesCount === 0;
      case 'partial_invoices':
        return expense.invoicesCount > 0 && expense.invoicesCount < expense.itemsCount;
      default:
        return true;
    }
  }

  private matchesDateRangeFilter(expense: ExpenseItem): boolean {
    if (!this.dateRangeFilter) return true;

    const expenseDate = new Date(expense.date);
    const dayOfMonth = expenseDate.getDate();

    switch (this.dateRangeFilter) {
      case 'week1':
        return dayOfMonth >= 1 && dayOfMonth <= 7;
      case 'week2':
        return dayOfMonth >= 8 && dayOfMonth <= 14;
      case 'week3':
        return dayOfMonth >= 15 && dayOfMonth <= 21;
      case 'week4':
        return dayOfMonth >= 22 && dayOfMonth <= 31;
      default:
        return true;
    }
  }

  private initializeAmountRange(): void {
    if (this.expenses.length === 0) {
      this.amountRangeFilter = { min: 0, max: 0 };
      return;
    }

    const amounts = this.expenses.map(e => e.grossAmount);
    this.amountRangeFilter = {
      min: 0,
      max: Math.max(...amounts)
    };
  }

  private extractAvailableTags(): void {
    const tagSet = new Set<string>();
    this.expenses.forEach(expense => {
      expense.tags.forEach(tag => tagSet.add(tag));
    });
    this.availableTags = Array.from(tagSet).sort();
  }

  // Get active filters count
  getActiveFiltersCount(): number {
    let count = 0;
    if (this.searchText) count++;
    if (this.typeFilter) count++;
    if (this.categoryFilter) count++;
    if (this.cyclicFilter) count++;
    if (this.dateRangeFilter) count++;
    if (this.amountRangeFilter.max > 0 && this.amountRangeFilter.min > 0) count++;
    if (this.tagsFilter.length > 0) count++;
    if (this.invoiceStatusFilter) count++;
    return count;
  }

  // Delete expense with confirmation
  deleteExpense(expense: ExpenseItem): void {
    const confirmMessage = `Czy na pewno chcesz usunąć wydatek "${expense.name}"?\n\nTa akcja jest nieodwracalna.`;
    
    if (confirm(confirmMessage)) {
      console.log('Deleting expense:', expense);

      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          console.log('Expense deleted successfully');
          this.snackBar.open('Wydatek został usunięty', 'Zamknij', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          // Reload expenses to reflect changes
          this.loadExpenses();
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          this.snackBar.open('Błąd podczas usuwania wydatku', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

}
