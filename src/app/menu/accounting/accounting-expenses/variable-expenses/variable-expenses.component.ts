// src/app/menu/accounting/accounting-expenses/variable-expenses/variable-expenses.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil, finalize } from 'rxjs';
import {
  VariableExpenseService,
  VariableExpenseResponse,
  VariableExpenseSummaryResponse
} from '../../../../utility/service/variable-expense.service';
import {
  ExpenseDialogComponent,
  DeleteConfirmationDialogComponent
} from '../shared/expense-dialogs.component';

@Component({
  selector: 'app-variable-expenses',
  templateUrl: './variable-expenses.component.html',
  styleUrls: [
    './variable-expenses.component.css',
    '../shared/expenses-shared.styles.css',
  ]
})
export class VariableExpensesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() selectedMonth!: number;
  @Input() selectedYear!: number;
  @Input() currentMonth!: string;
  @Input() searchQuery!: string;
  @Input() showGross!: boolean;

  isLoading: boolean = false;
  variableExpenses: VariableExpenseResponse[] = [];
  expenseSummary: VariableExpenseSummaryResponse | null = null;
  filteredExpenses: VariableExpenseResponse[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private variableExpenseService: VariableExpenseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] || changes['selectedYear']) {
      this.loadData();
    }

    if (changes['searchQuery']) {
      this.filterExpenses();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    if (!this.selectedMonth || !this.selectedYear) {
      return;
    }

    this.isLoading = true;

    // Load expenses for the selected month
    this.variableExpenseService.getExpensesForMonth(this.selectedMonth, this.selectedYear)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (expenses) => {
          this.variableExpenses = expenses;
          this.filterExpenses();
          console.log(`Loaded ${expenses.length} variable expenses for ${this.selectedMonth}/${this.selectedYear}`);
        },
        error: (error) => {
          console.error('Error loading variable expenses:', error);
          this.showErrorMessage('Błąd podczas ładowania kosztów zmiennych');
          this.variableExpenses = [];
          this.filteredExpenses = [];
        }
      });

    // Load summary for the selected month
    this.loadExpenseSummary();
  }

  private loadExpenseSummary(): void {
    this.variableExpenseService.getExpenseSummary(this.selectedMonth, this.selectedYear)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.expenseSummary = summary;
        },
        error: (error) => {
          console.error('Error loading expense summary:', error);
          this.expenseSummary = null;
        }
      });
  }

  private filterExpenses(): void {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredExpenses = [...this.variableExpenses];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredExpenses = this.variableExpenses.filter(expense =>
      expense.name.toLowerCase().includes(query) ||
      expense.category.toLowerCase().includes(query) ||
      expense.supplier.toLowerCase().includes(query) ||
      expense.description.toLowerCase().includes(query)
    );
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  getVariableExpensesTotal(): number {
    const total = this.filteredExpenses.reduce((sum, expense) =>
      sum + (this.showGross ? expense.grossAmount : expense.netAmount), 0
    );
    return total;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL');
  }

  onAddExpense(): void {
    const dialogRef = this.dialog.open(ExpenseDialogComponent, {
      width: '500px',
      data: {
        type: 'variable',
        isEdit: false,
        expense: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createExpense(result);
      }
    });
  }

  onEditExpense(expense: VariableExpenseResponse): void {
    const dialogRef = this.dialog.open(ExpenseDialogComponent, {
      width: '500px',
      data: {
        type: 'variable',
        isEdit: true,
        expense: {
          ...expense,
          netAmount: expense.netAmount.toString(),
          date: expense.expenseDate
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateExpense(expense.id, result);
      }
    });
  }

  onDeleteExpense(expense: VariableExpenseResponse): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '400px',
      data: {
        type: 'variable',
        expenseName: expense.name
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed) {
        this.deleteExpense(expense.id);
      }
    });
  }

  private createExpense(expenseData: any): void {
    this.isLoading = true;

    const request = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      expenseDate: expenseData.date,
      supplier: expenseData.supplier,
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
          this.showErrorMessage('Błąd podczas dodawania kosztu');
        }
      });
  }

  private updateExpense(id: string, expenseData: any): void {
    this.isLoading = true;

    const request = {
      name: expenseData.name,
      category: expenseData.category,
      netAmount: expenseData.netAmount.toString(),
      expenseDate: expenseData.date,
      supplier: expenseData.supplier,
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
          this.showErrorMessage('Błąd podczas aktualizacji kosztu');
        }
      });
  }

  private deleteExpense(id: string): void {
    this.isLoading = true;

    this.variableExpenseService.deleteVariableExpense(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage('Koszt został usunięty');
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting expense:', error);
          this.showErrorMessage('Błąd podczas usuwania kosztu');
        }
      });
  }

  getCategorySummary(category: string): { amount: number; count: number } | null {
    if (!this.expenseSummary) {
      return null;
    }

    const categorySummary = this.expenseSummary.categorySummaries.find(c => c.category === category);
    if (!categorySummary) {
      return null;
    }

    return {
      amount: this.showGross ? categorySummary.grossAmount : categorySummary.netAmount,
      count: categorySummary.count
    };
  }

  getSupplierSummary(supplier: string): { amount: number; count: number } | null {
    if (!this.expenseSummary) {
      return null;
    }

    const supplierSummary = this.expenseSummary.supplierSummaries.find(s => s.supplier === supplier);
    if (!supplierSummary) {
      return null;
    }

    return {
      amount: this.showGross ? supplierSummary.grossAmount : supplierSummary.netAmount,
      count: supplierSummary.count
    };
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

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}
