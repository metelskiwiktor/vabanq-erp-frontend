// src/app/menu/accounting/accounting-expenses/accounting-expenses.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importy serwisów

// Importy dialogów
import { AddExpenseDialogComponent, AddExpenseDialogData, ExpenseFormData } from './shared/add-expense-dialog.component';
import { DeleteConfirmationDialogComponent } from './shared/expense-dialogs.component';
import {
  CreateFixedExpenseRequest,
  ExpenseSummaryResponse,
  FixedExpenseResponse,
  FixedExpenseService, UpdateFixedExpenseRequest
} from "../../../utility/service/fixed-expense.service";
import {
  CreateVariableExpenseRequest, UpdateVariableExpenseRequest,
  VariableExpenseResponse,
  VariableExpenseService
} from "../../../utility/service/variable-expense.service";

@Component({
  selector: 'app-accounting-expenses',
  templateUrl: './accounting-expenses.component.html',
  styleUrls: ['./accounting-expenses.component.css']
})
export class AccountingExpensesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State variables
  isLoading = false;
  showGross = false;

  // Date management
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  currentMonth = '';

  // Data arrays
  fixedExpenses: FixedExpenseResponse[] = [];
  variableExpenses: VariableExpenseResponse[] = [];
  filteredVariableExpenses: VariableExpenseResponse[] = [];
  expenseSummary: ExpenseSummaryResponse | null = null;

  // Mock data for revenue (should come from service)
  totalRevenue = 50000;

  // Available months and years for selector
  months = [
    { value: 1, name: 'Styczeń' },
    { value: 2, name: 'Luty' },
    { value: 3, name: 'Marzec' },
    { value: 4, name: 'Kwiecień' },
    { value: 5, name: 'Maj' },
    { value: 6, name: 'Czerwiec' },
    { value: 7, name: 'Lipiec' },
    { value: 8, name: 'Sierpień' },
    { value: 9, name: 'Wrzesień' },
    { value: 10, name: 'Październik' },
    { value: 11, name: 'Listopad' },
    { value: 12, name: 'Grudzień' }
  ];

  years: number[] = [];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fixedExpenseService: FixedExpenseService,
    private variableExpenseService: VariableExpenseService
  ) {
    this.generateYears();
    this.updateCurrentMonth();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private generateYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      this.years.push(year);
    }
  }

  private updateCurrentMonth(): void {
    const monthName = this.months.find(m => m.value === this.selectedMonth)?.name || '';
    this.currentMonth = `${monthName} ${this.selectedYear}`;
  }

  // Navigation methods
  goToPreviousMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.updateCurrentMonth();
    this.loadData();
  }

  goToNextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.updateCurrentMonth();
    this.loadData();
  }

  goToCurrentMonth(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.updateCurrentMonth();
    this.loadData();
  }

  onMonthYearChange(): void {
    this.updateCurrentMonth();
    this.loadData();
  }

  // Toggle amount display type
  toggleAmountType(): void {
    this.showGross = !this.showGross;
  }

  // Data loading
  private loadData(): void {
    this.isLoading = true;

    forkJoin({
      fixedExpenses: this.fixedExpenseService.getExpensesForMonth(this.selectedMonth, this.selectedYear),
      variableExpenses: this.variableExpenseService.getExpensesForMonth(this.selectedMonth, this.selectedYear),
      summary: this.fixedExpenseService.getExpenseSummary(this.selectedMonth, this.selectedYear)
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data) => {
        this.fixedExpenses = data.fixedExpenses;
        this.variableExpenses = data.variableExpenses;
        this.filteredVariableExpenses = data.variableExpenses;
        this.expenseSummary = data.summary;
      },
      error: (error) => {
        console.error('Error loading expenses data:', error);
        this.showErrorMessage('Błąd podczas ładowania danych');
      }
    });
  }

  // Dialog methods
  openAddExpenseDialog(type?: 'fixed' | 'variable'): void {
    const dialogData: AddExpenseDialogData = {
      type: type,
      isEdit: false,
      allowTypeSelection: !type // Jeśli nie podano typu, pozwól na wybór
    };

    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ExpenseFormData) => {
      if (result) {
        this.createExpense(result);
      }
    });
  }

  // Metoda do wywołania z zewnątrz (np. z faktury)
  openAddExpenseDialogFromInvoice(preselectedType?: 'fixed' | 'variable'): void {
    const dialogData: AddExpenseDialogData = {
      isEdit: false,
      allowTypeSelection: true,
      selectedExpenseType: preselectedType,
      isFromInvoice: true
    };

    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ExpenseFormData) => {
      if (result) {
        this.createExpense(result);
      }
    });
  }

  // CRUD operations
  private createExpense(expenseData: ExpenseFormData): void {
    this.isLoading = true;

    if (expenseData.expenseType === 'fixed') {
      this.createFixedExpense(expenseData);
    } else {
      this.createVariableExpense(expenseData);
    }
  }

  private createFixedExpense(expenseData: ExpenseFormData): void {
    const request: CreateFixedExpenseRequest = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      month: this.selectedMonth,
      year: this.selectedYear,
      isRecurring: expenseData.isRecurring || false,
      description: expenseData.description || ''
    };

    this.fixedExpenseService.createFixedExpense(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Koszt stały został dodany');
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating fixed expense:', error);
          this.showErrorMessage('Błąd podczas dodawania kosztu stałego');
        }
      });
  }

  private createVariableExpense(expenseData: ExpenseFormData): void {
    const request: CreateVariableExpenseRequest = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      expenseDate: expenseData.date!,
      supplier: expenseData.supplier!,
      description: expenseData.description || ''
    };

    this.variableExpenseService.createVariableExpense(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Koszt zmienny został dodany');
          this.loadData();
        },
        error: (error) => {
          console.error('Error creating variable expense:', error);
          this.showErrorMessage('Błąd podczas dodawania kosztu zmiennego');
        }
      });
  }

  // Edit methods
  editFixedExpense(id: string): void {
    const expense = this.fixedExpenses.find(e => e.id === id);
    if (!expense) return;

    const dialogData: AddExpenseDialogData = {
      type: 'fixed',
      isEdit: true,
      expense: {
        ...expense,
        netAmount: expense.netAmount.toString()
      }
    };

    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ExpenseFormData) => {
      if (result) {
        this.updateFixedExpense(id, result);
      }
    });
  }

  editVariableExpense(expense: VariableExpenseResponse): void {
    const dialogData: AddExpenseDialogData = {
      type: 'variable',
      isEdit: true,
      expense: {
        ...expense,
        netAmount: expense.netAmount.toString(),
        date: expense.expenseDate
      }
    };

    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ExpenseFormData) => {
      if (result) {
        this.updateVariableExpense(expense.id, result);
      }
    });
  }

  private updateFixedExpense(id: string, expenseData: ExpenseFormData): void {
    this.isLoading = true;

    const request: UpdateFixedExpenseRequest = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      isRecurring: expenseData.isRecurring || false,
      description: expenseData.description || ''
    };

    this.fixedExpenseService.updateFixedExpense(id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Koszt stały został zaktualizowany');
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating fixed expense:', error);
          this.showErrorMessage('Błąd podczas aktualizacji kosztu stałego');
        }
      });
  }

  private updateVariableExpense(id: string, expenseData: ExpenseFormData): void {
    this.isLoading = true;

    const request: UpdateVariableExpenseRequest = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      expenseDate: expenseData.date!,
      supplier: expenseData.supplier!,
      description: expenseData.description || ''
    };

    this.variableExpenseService.updateVariableExpense(id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Koszt zmienny został zaktualizowany');
          this.loadData();
        },
        error: (error) => {
          console.error('Error updating variable expense:', error);
          this.showErrorMessage('Błąd podczas aktualizacji kosztu zmiennego');
        }
      });
  }

  // Delete methods
  deleteFixedExpense(id: string): void {
    const expense = this.fixedExpenses.find(e => e.id === id);
    if (!expense) return;

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '450px',
      data: {
        type: 'fixed',
        expenseName: expense.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.performDeleteFixedExpense(id, result.applyToFutureMonths);
      }
    });
  }

  deleteVariableExpense(expense: VariableExpenseResponse): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '450px',
      data: {
        type: 'variable',
        expenseName: expense.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.performDeleteVariableExpense(expense.id);
      }
    });
  }

  private performDeleteFixedExpense(id: string, applyToFutureMonths: boolean): void {
    this.isLoading = true;

    const request = { applyToFutureMonths };
    this.fixedExpenseService.deleteFixedExpense(id, request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Koszt stały został usunięty');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting fixed expense:', error);
          this.showErrorMessage('Błąd podczas usuwania kosztu stałego');
        }
      });
  }

  private performDeleteVariableExpense(id: string): void {
    this.isLoading = true;

    this.variableExpenseService.deleteVariableExpense(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Koszt zmienny został usunięty');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting variable expense:', error);
          this.showErrorMessage('Błąd podczas usuwania kosztu zmiennego');
        }
      });
  }

  // Calculation methods
  getFixedExpensesTotal(): number {
    if (!this.expenseSummary) {
      return this.fixedExpenses.reduce((total, expense) => {
        const amount = this.showGross ? expense.grossAmount : expense.netAmount;
        return total + amount;
      }, 0);
    }
    return this.showGross ? this.expenseSummary.totalGrossAmount : this.expenseSummary.totalNetAmount;
  }

  getVariableExpensesTotal(): number {
    return this.filteredVariableExpenses.reduce((total, expense) => {
      const amount = this.showGross ? expense.grossAmount : expense.netAmount;
      return total + amount;
    }, 0);
  }

  getTotalExpenses(): number {
    return this.getFixedExpensesTotal() + this.getVariableExpensesTotal();
  }

  getCategorySummary(): Array<{name: string, amount: number, color: string}> {
    const categoryMap = new Map<string, number>();

    // Add fixed expenses
    this.fixedExpenses.forEach(expense => {
      const amount = this.showGross ? expense.grossAmount : expense.netAmount;
      categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + amount);
    });

    // Add variable expenses
    this.filteredVariableExpenses.forEach(expense => {
      const amount = this.showGross ? expense.grossAmount : expense.netAmount;
      categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + amount);
    });

    const colors = ['#4caf50', '#ff9800', '#2196f3', '#9c27b0', '#f44336', '#ffeb3b', '#607d8b'];

    return Array.from(categoryMap.entries())
      .map(([name, amount], index) => ({
        name,
        amount,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Formatting methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount || 0);
  }

  formatCurrencyFromBackend(expense: FixedExpenseResponse): string {
    const amount = this.showGross ? expense.grossAmount : expense.netAmount;
    return this.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  }

  // Notification methods
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
