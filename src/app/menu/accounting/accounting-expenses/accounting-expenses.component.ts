// src/app/menu/accounting/accounting-expenses/accounting-expenses.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importy serwisów
import {
  CreateFixedExpenseRequest,
  ExpenseSummaryResponse,
  FixedExpenseResponse,
  FixedExpenseService,
  UpdateFixedExpenseRequest
} from "../../../utility/service/fixed-expense.service";
import {
  CreateVariableExpenseRequest,
  UpdateVariableExpenseRequest,
  VariableExpenseResponse,
  VariableExpenseService
} from "../../../utility/service/variable-expense.service";

// Importy dialogów
import { AddExpenseDialogComponent, AddExpenseDialogData, ExpenseFormData } from './shared/add-expense-dialog.component';
import { DeleteConfirmationDialogComponent } from './shared/expense-dialogs.component';

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
  searchQuery = '';

  // Date management
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  currentMonth = '';

  // Data arrays
  fixedExpenses: FixedExpenseResponse[] = [];
  variableExpenses: VariableExpenseResponse[] = [];
  filteredVariableExpenses: VariableExpenseResponse[] = [];
  expenseSummary: ExpenseSummaryResponse | null = null;

  // Month names
  private monthNames = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fixedExpenseService: FixedExpenseService,
    private variableExpenseService: VariableExpenseService
  ) {}

  ngOnInit(): void {
    this.updateCurrentMonth();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Utility methods
  private updateCurrentMonth(): void {
    this.currentMonth = this.monthNames[this.selectedMonth - 1];
  }

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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount || 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
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

  // Toggle amount display type
  toggleAmountType(): void {
    this.showGross = !this.showGross;
  }

  // Search functionality
  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.filteredVariableExpenses = [...this.variableExpenses];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredVariableExpenses = this.variableExpenses.filter(expense =>
      expense.name.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query) ||
      (expense.description && expense.description.toLowerCase().includes(query))
    );
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

  // Calculate totals
  getFixedExpensesTotal(): number {
    return this.fixedExpenses.reduce((total, expense) => {
      return total + (this.showGross ? expense.grossAmount : expense.netAmount);
    }, 0);
  }

  getVariableExpensesTotal(): number {
    return this.filteredVariableExpenses.reduce((total, expense) => {
      return total + (this.showGross ? expense.grossAmount : expense.netAmount);
    }, 0);
  }

  getTotalExpenses(): number {
    return this.getFixedExpensesTotal() + this.getVariableExpensesTotal();
  }

  // Dialog methods
  openAddExpenseDialog(type?: 'fixed' | 'variable'): void {
    const dialogData: AddExpenseDialogData = {
      type: type,
      isEdit: false,
      allowTypeSelection: !type // Jeśli nie podano typu, pozwól na wybór
    };

    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-panel'
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
      width: '700px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-panel'
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
      width: '700px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-panel'
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
      width: '400px',
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

  deleteVariableExpense(id: string): void {
    const expense = this.variableExpenses.find(e => e.id === id);
    if (!expense) return;

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '400px',
      data: {
        type: 'variable',
        expenseName: expense.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.performDeleteVariableExpense(id);
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

  // Method for calling from invoice panel (if needed)
  openAddExpenseDialogFromInvoice(preselectedType?: 'fixed' | 'variable'): void {
    const dialogData: AddExpenseDialogData = {
      isEdit: false,
      allowTypeSelection: true,
      selectedExpenseType: preselectedType,
      isFromInvoice: true
    };

    const dialogRef = this.dialog.open(AddExpenseDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: dialogData,
      disableClose: true,
      panelClass: 'custom-dialog-panel'
    });

    dialogRef.afterClosed().subscribe((result: ExpenseFormData) => {
      if (result) {
        this.createExpense(result);
      }
    });
  }
}
