// src/app/menu/accounting/accounting-expenses/power-expense/power-expense.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  PowerExpenseService,
  PowerExpenseResponse,
  CreatePowerExpenseRequest,
  UpdatePowerExpenseRequest
} from '../../../../utility/service/power-expense.service';
import { PowerExpenseDialogComponent } from '../shared/power-expense-dialog.component';
import { DeleteConfirmationDialogComponent } from '../shared/expense-dialogs.component';

@Component({
  selector: 'app-power-expense',
  templateUrl: './power-expense.component.html',
  styleUrls: [
    './power-expense.component.css',
    '../shared/expenses-shared.styles.css'
  ]
})
export class PowerExpenseComponent implements OnInit, OnChanges {
  @Input() selectedMonth!: number;
  @Input() selectedYear!: number;
  @Input() currentMonth!: string;
  @Input() showGross!: boolean;

  isLoading: boolean = false;
  powerExpense: PowerExpenseResponse | null = null;

  constructor(
    private dialog: MatDialog,
    private powerExpenseService: PowerExpenseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadPowerExpenseForCurrentMonth();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] || changes['selectedYear']) {
      this.loadPowerExpenseForCurrentMonth();
    }
  }

  private loadPowerExpenseForCurrentMonth(): void {
    this.isLoading = true;

    this.powerExpenseService.getPowerExpenseForMonth(this.selectedMonth, this.selectedYear)
      .pipe(
        catchError(error => {
          console.error('Error loading power expense:', error);
          if (error.status !== 404) {
            this.showErrorMessage('Błąd podczas ładowania wydatku na prąd');
          }
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(expense => {
        this.powerExpense = expense;
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  getPowerExpenseAmount(): number {
    if (!this.powerExpense) {
      return 0;
    }
    return this.showGross ? this.powerExpense.grossAmount : this.powerExpense.netAmount;
  }

  addOrUpdatePowerExpense(): void {
    const dialogRef = this.dialog.open(PowerExpenseDialogComponent, {
      width: '600px',
      data: {
        isEdit: !!this.powerExpense,
        expense: this.powerExpense ? { ...this.powerExpense } : null,
        currentMonth: this.currentMonth,
        selectedMonth: this.selectedMonth,
        selectedYear: this.selectedYear
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (this.powerExpense) {
          this.updatePowerExpense(this.powerExpense.id, result);
        } else {
          this.createPowerExpense(result);
        }
      }
    });
  }

  private createPowerExpense(expenseData: any): void {
    const request: CreatePowerExpenseRequest = {
      month: this.selectedMonth,
      year: this.selectedYear,
      powerConsumptionKw: expenseData.powerConsumptionKw,
      pricePerKwh: expenseData.pricePerKwh,
      description: expenseData.description || ''
    };

    this.isLoading = true;
    this.powerExpenseService.createPowerExpense(request)
      .pipe(
        catchError(error => {
          console.error('Error creating power expense:', error);
          this.showErrorMessage('Błąd podczas tworzenia wydatku na prąd');
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(expense => {
        if (expense) {
          this.showSuccessMessage('Wydatek na prąd został utworzony');
          this.powerExpense = expense;
        }
      });
  }

  private updatePowerExpense(id: string, expenseData: any): void {
    const request: UpdatePowerExpenseRequest = {
      powerConsumptionKw: expenseData.powerConsumptionKw,
      pricePerKwh: expenseData.pricePerKwh,
      description: expenseData.description || ''
    };

    this.isLoading = true;
    this.powerExpenseService.updatePowerExpense(id, request)
      .pipe(
        catchError(error => {
          console.error('Error updating power expense:', error);
          this.showErrorMessage('Błąd podczas aktualizacji wydatku na prąd');
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(expense => {
        if (expense) {
          this.showSuccessMessage('Wydatek na prąd został zaktualizowany');
          this.powerExpense = expense;
        }
      });
  }

  deletePowerExpense(): void {
    if (!this.powerExpense) return;

    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '450px',
      data: {
        type: 'power',
        expenseName: `Prąd (${this.currentMonth})`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.confirmed && this.powerExpense) {
        this.deletePowerExpenseConfirmed(this.powerExpense.id);
      }
    });
  }

  private deletePowerExpenseConfirmed(id: string): void {
    this.isLoading = true;
    this.powerExpenseService.deletePowerExpense(id)
      .pipe(
        catchError(error => {
          console.error('Error deleting power expense:', error);
          this.showErrorMessage('Błąd podczas usuwania wydatku na prąd');
          return of(null);
        }),
        finalize(() => this.isLoading = false)
      )
      .subscribe(() => {
        this.showSuccessMessage('Wydatek na prąd został usunięty');
        this.powerExpense = null;
      });
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
}
