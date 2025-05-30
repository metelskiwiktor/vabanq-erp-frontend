// src/app/menu/accounting/accounting-expenses/fixed-expenses/fixed-expenses.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  FixedExpenseService,
  FixedExpenseResponse,
  CreateFixedExpenseRequest,
  UpdateFixedExpenseRequest,
  DeleteFixedExpenseRequest,
  ExpenseSummaryResponse
} from '../../../../utility/service/fixed-expense.service';
import { ExpenseDialogComponent, DeleteConfirmationDialogComponent } from '../shared/expense-dialogs.component';

@Component({
  selector: 'app-fixed-expenses',
  templateUrl: './fixed-expenses.component.html',
  styleUrls: [
    './fixed-expenses.component.css',
    '../shared/expenses-shared.styles.css']
})
export class FixedExpensesComponent implements OnInit, OnChanges {
  @Input() selectedMonth!: number;
  @Input() selectedYear!: number;
  @Input() currentMonth!: string;
  @Input() searchQuery!: string;
  @Input() showGross!: boolean;

  isLoading: boolean = false;
  fixedExpenses: FixedExpenseResponse[] = [];
  expenseSummary: ExpenseSummaryResponse | null = null;

  constructor(
    private dialog: MatDialog,
    private fixedExpenseService: FixedExpenseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadExpensesForCurrentMonth();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] || changes['selectedYear']) {
      this.loadExpensesForCurrentMonth();
    }
  }

  private loadExpensesForCurrentMonth(): void {
    this.isLoading = true;

    this.fixedExpenseService.getExpensesForMonth(this.selectedMonth, this.selectedYear)
      .pipe(
        catchError(error => {
          console.error('Error loading expenses:', error);
          this.showErrorMessage('Błąd podczas ładowania wydatków');
          return of([]);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(expenses => {
        this.fixedExpenses = expenses;
        this.loadExpenseSummary();
      });
  }

  private loadExpenseSummary(): void {
    this.fixedExpenseService.getExpenseSummary(this.selectedMonth, this.selectedYear)
      .pipe(
        catchError(error => {
          console.error('Error loading expense summary:', error);
          return of(null);
        })
      )
      .subscribe(summary => {
        this.expenseSummary = summary;
      });
  }

  formatCurrencyFromBackend(expense: FixedExpenseResponse): string {
    const value = this.showGross ? expense.grossAmount : expense.netAmount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  formatCurrency(value: number): string {
    const adjustedValue = this.showGross ? value * 1.23 : value;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(adjustedValue);
  }

  getFixedExpensesTotal(): number {
    if (!this.expenseSummary) {
      return 0;
    }
    return this.showGross ? this.expenseSummary.totalGrossAmount : this.expenseSummary.totalNetAmount;
  }

  addExpense(): void {
    const dialogRef = this.dialog.open(ExpenseDialogComponent, {
      width: '500px',
      data: {
        type: 'fixed',
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createFixedExpense(result);
      }
    });
  }

  private createFixedExpense(expenseData: any): void {
    const request: CreateFixedExpenseRequest = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      month: this.selectedMonth,
      year: this.selectedYear,
      isRecurring: expenseData.isRecurring,
      description: expenseData.description || ''
    };

    this.isLoading = true;
    this.fixedExpenseService.createFixedExpense(request)
      .pipe(
        catchError(error => {
          console.error('Error creating expense:', error);
          this.showErrorMessage('Błąd podczas tworzenia wydatku');
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(expense => {
        if (expense) {
          this.showSuccessMessage('Wydatek został utworzony');
          this.loadExpensesForCurrentMonth();
        }
      });
  }

  editExpense(id: string): void {
    const expense = this.fixedExpenses.find(e => e.id === id);
    if (!expense) return;

    const dialogRef = this.dialog.open(ExpenseDialogComponent, {
      width: '500px',
      data: {
        type: 'fixed',
        isEdit: true,
        expense: { ...expense }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateFixedExpense(id, result);
      }
    });
  }

  private updateFixedExpense(id: string, expenseData: any): void {
    const request: UpdateFixedExpenseRequest = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      isRecurring: expenseData.isRecurring,
      description: expenseData.description || ''
    };

    this.isLoading = true;
    this.fixedExpenseService.updateFixedExpense(id, request)
      .pipe(
        catchError(error => {
          console.error('Error updating expense:', error);
          this.showErrorMessage('Błąd podczas aktualizacji wydatku');
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(expense => {
        if (expense) {
          this.showSuccessMessage('Wydatek został zaktualizowany');
          this.loadExpensesForCurrentMonth();
        }
      });
  }

  deleteExpense(id: string): void {
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
        this.deleteFixedExpense(id, result.applyToFutureMonths);
      }
    });
  }

  private deleteFixedExpense(id: string, applyToFutureMonths: boolean): void {
    const request: DeleteFixedExpenseRequest = {
      applyToFutureMonths: applyToFutureMonths
    };

    this.isLoading = true;
    this.fixedExpenseService.deleteFixedExpense(id, request)
      .pipe(
        catchError(error => {
          console.error('Error deleting expense:', error);
          this.showErrorMessage('Błąd podczas usuwania wydatku');
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(() => {
        this.showSuccessMessage('Wydatek został usunięty');
        this.loadExpensesForCurrentMonth();
      });
  }

  // Utility methods for notifications
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
