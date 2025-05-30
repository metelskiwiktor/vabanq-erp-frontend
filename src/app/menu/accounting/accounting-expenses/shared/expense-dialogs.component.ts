// src/app/menu/accounting/accounting-expenses/shared/expense-dialogs.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// Dialog component for adding/editing expenses
@Component({
  selector: 'app-expense-dialog',
  template: `
    <h1 mat-dialog-title>{{ data.isEdit ? 'Edytuj wydatek' : 'Dodaj wydatek' }}</h1>
    <div mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Kategoria</mat-label>
        <mat-select [(ngModel)]="expense.category">
          <mat-option value="Biuro">Biuro</mat-option>
          <mat-option value="Materiały">Materiały</mat-option>
          <mat-option value="Opłaty">Opłaty</mat-option>
          <mat-option value="Transport">Transport</mat-option>
          <mat-option value="Marketing">Marketing</mat-option>
          <mat-option value="Inne">Inne</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nazwa wydatku</mat-label>
        <input matInput [(ngModel)]="expense.name" placeholder="Wpisz nazwę wydatku">
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Kwota netto (PLN)</mat-label>
        <input matInput type="number" step="0.01" [(ngModel)]="expense.netAmount"
               (input)="calculateGross()" placeholder="0.00">
      </mat-form-field>

      <div class="gross-amount-display">
        <strong>Kwota brutto: {{ formatCurrency(getGrossAmount()) }}</strong>
      </div>

      <!-- Dla wydatków zmiennych -->
      <div *ngIf="data.type === 'variable'">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Data</mat-label>
          <input matInput type="date" [(ngModel)]="expense.date">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Dostawca</mat-label>
          <input matInput [(ngModel)]="expense.supplier" placeholder="Nazwa dostawcy">
        </mat-form-field>
      </div>

      <!-- Dla wydatków stałych -->
      <div *ngIf="data.type === 'fixed'">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Opis (opcjonalny)</mat-label>
          <textarea matInput [(ngModel)]="expense.description"
                    placeholder="Dodatkowe informacje o wydatku"></textarea>
        </mat-form-field>

        <mat-checkbox [(ngModel)]="expense.isRecurring" class="recurring-checkbox">
          Wydatek cykliczny (powtarzaj w nowych miesiącach)
        </mat-checkbox>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Anuluj</button>
      <button mat-raised-button color="primary" (click)="onSave()"
              [disabled]="!isFormValid()">
        {{ data.isEdit ? 'Zapisz' : 'Dodaj' }}
      </button>
    </div>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .gross-amount-display {
      background-color: #e8f5e8;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      text-align: center;
    }
    .recurring-checkbox {
      margin-bottom: 16px;
    }
    mat-dialog-content {
      min-width: 400px;
    }
  `]
})
export class ExpenseDialogComponent {
  expense: any = {
    category: '',
    name: '',
    netAmount: 0,
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    isRecurring: true,
    description: ''
  };

  constructor(
    public dialogRef: MatDialogRef<ExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data.expense) {
      this.expense = { ...data.expense };
      if (data.type === 'variable' && this.expense.date) {
        // Ensure date is in correct format for input[type="date"]
        this.expense.date = new Date(this.expense.date).toISOString().split('T')[0];
      }
      // Convert netAmount to string for form binding if it's from backend
      if (typeof this.expense.netAmount === 'number') {
        this.expense.netAmount = this.expense.netAmount.toString();
      }
    }
  }

  calculateGross(): void {
    // Trigger change detection for gross amount
  }

  getGrossAmount(): number {
    const netAmount = parseFloat(this.expense.netAmount) || 0;
    return netAmount * 1.23;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  isFormValid(): boolean {
    if (!this.expense.category || !this.expense.name || !this.expense.netAmount) {
      return false;
    }

    if (this.data.type === 'variable') {
      return !!(this.expense.date && this.expense.supplier);
    }

    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isFormValid()) {
      this.dialogRef.close(this.expense);
    }
  }
}

// Dialog for delete confirmation
@Component({
  selector: 'app-delete-confirmation-dialog',
  template: `
    <h1 mat-dialog-title>Potwierdź usunięcie</h1>
    <div mat-dialog-content>
      <p>Czy na pewno chcesz usunąć wydatek "<strong>{{ data.expenseName }}</strong>"?</p>

      <div *ngIf="data.type === 'fixed'" class="future-months-option">
        <mat-checkbox [(ngModel)]="applyToFutureMonths">
          Usuń również z przyszłych miesięcy (wydatek nie będzie się już powtarzać)
        </mat-checkbox>
        <p class="help-text">
          Jeśli nie zaznaczysz tej opcji, wydatek zostanie usunięty tylko z bieżącego miesiąca,
          ale będzie nadal pojawiać się w nowych miesiącach.
        </p>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Anuluj</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">Usuń</button>
    </div>
  `,
  styles: [`
    .future-months-option {
      background-color: #fff3cd;
      padding: 16px;
      border-radius: 4px;
      margin: 16px 0;
      border-left: 4px solid #ffc107;
    }
    .help-text {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
      margin-bottom: 0;
    }
  `]
})
export class DeleteConfirmationDialogComponent {
  applyToFutureMonths: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    this.dialogRef.close({
      confirmed: true,
      applyToFutureMonths: this.applyToFutureMonths
    });
  }
}
