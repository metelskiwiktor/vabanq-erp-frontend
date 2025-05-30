// src/app/menu/accounting/accounting-expenses/shared/expense-dialogs.component.ts
import { Component, Inject, OnInit } from '@angular/core';
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

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Opis (opcjonalny)</mat-label>
          <textarea matInput [(ngModel)]="expense.description"
                    placeholder="Dodatkowe informacje o wydatku"></textarea>
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
export class ExpenseDialogComponent implements OnInit {
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
  ) {}

  ngOnInit(): void {
    if (this.data.expense) {
      this.expense = { ...this.data.expense };

      // Handle different date formats for variable expenses
      if (this.data.type === 'variable') {
        if (this.expense.expenseDate) {
          // Backend returns date as string in ISO format
          this.expense.date = new Date(this.expense.expenseDate).toISOString().split('T')[0];
        } else if (this.expense.date) {
          // Ensure date is in correct format for input[type="date"]
          this.expense.date = new Date(this.expense.date).toISOString().split('T')[0];
        }
      }

      // Convert netAmount to string for form binding if it's from backend
      if (typeof this.expense.netAmount === 'number') {
        this.expense.netAmount = this.expense.netAmount.toString();
      }
    } else {
      // Set default date for new variable expenses
      if (this.data.type === 'variable') {
        this.expense.date = new Date().toISOString().split('T')[0];
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

      <!-- Special message for power expenses -->
      <div *ngIf="data.type === 'power'" class="power-delete-info">
        <div class="info-box">
          <mat-icon>flash_on</mat-icon>
          <div class="info-text">
            <p><strong>Wydatek na energię elektryczną</strong></p>
            <p>Po usunięciu będzie można ponownie dodać wydatek na prąd dla tego miesiąca.</p>
          </div>
        </div>
      </div>

      <!-- Options for fixed expenses -->
      <div *ngIf="data.type === 'fixed'" class="future-months-option">
        <mat-checkbox [(ngModel)]="applyToFutureMonths">
          Usuń również z przyszłych miesięcy (wydatek nie będzie się już powtarzać)
        </mat-checkbox>
        <p class="help-text">
          Jeśli nie zaznaczysz tej opcji, wydatek zostanie usunięty tylko z bieżącego miesiąca,
          ale będzie nadal pojawiać się w nowych miesiącach.
        </p>
      </div>

      <!-- Standard message for variable expenses -->
      <div *ngIf="data.type === 'variable'" class="variable-delete-info">
        <p class="info-text">Ta operacja nie może być cofnięta.</p>
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
    .power-delete-info {
      margin: 16px 0;
    }
    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #fff8e1;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }
    .info-box mat-icon {
      color: #f57c00;
      font-size: 24px;
      width: 24px;
      height: 24px;
      margin-top: 2px;
    }
    .info-text {
      flex: 1;
    }
    .info-text p {
      margin: 0 0 8px 0;
      color: #856404;
      line-height: 1.4;
    }
    .info-text p:last-child {
      margin-bottom: 0;
    }
    .info-text strong {
      color: #663c00;
    }
    .variable-delete-info {
      margin: 16px 0;
      padding: 12px;
      background: #ffebee;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }
    .variable-delete-info .info-text {
      color: #c62828;
      font-weight: 500;
      margin: 0;
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
