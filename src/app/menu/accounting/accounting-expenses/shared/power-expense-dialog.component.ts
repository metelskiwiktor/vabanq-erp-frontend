// src/app/menu/accounting/accounting-expenses/shared/power-expense-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-power-expense-dialog',
  template: `
    <h1 mat-dialog-title>{{ data.isEdit ? 'Edytuj wydatek na prąd' : 'Dodaj wydatek na prąd' }}</h1>
    <div mat-dialog-content>
      <div class="power-expense-form">

        <!-- Power Consumption Input -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Zużycie energii (kWh)</mat-label>
          <input matInput
                 type="number"
                 step="0.01"
                 min="0"
                 [(ngModel)]="powerExpense.powerConsumptionKw"
                 (input)="calculateAmount()"
                 placeholder="0.00">
          <mat-icon matSuffix>flash_on</mat-icon>
        </mat-form-field>

        <!-- Price per kWh Input -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Cena za kWh (PLN)</mat-label>
          <input matInput
                 type="number"
                 step="0.001"
                 min="0"
                 [(ngModel)]="powerExpense.pricePerKwh"
                 (input)="calculateAmount()"
                 placeholder="0.000">
          <span matSuffix>PLN/kWh</span>
        </mat-form-field>

        <!-- Calculation Display -->
        <div class="calculation-display">
          <div class="calculation-row">
            <span class="label">Zużycie:</span>
            <span class="value">{{ formatNumber(powerExpense.powerConsumptionKw || 0) }} kWh</span>
          </div>
          <div class="calculation-row">
            <span class="label">Cena za kWh:</span>
            <span class="value">{{ formatCurrency(powerExpense.pricePerKwh || 0) }}</span>
          </div>
          <div class="calculation-divider"></div>
          <div class="calculation-row total">
            <span class="label">Kwota netto:</span>
            <span class="value">{{ formatCurrency(getNetAmount()) }}</span>
          </div>
          <div class="calculation-row total-gross">
            <span class="label">Kwota brutto (23% VAT):</span>
            <span class="value">{{ formatCurrency(getGrossAmount()) }}</span>
          </div>
        </div>

        <!-- Month/Year Display for new expenses -->
        <div *ngIf="!data.isEdit" class="period-display">
          <mat-icon>calendar_today</mat-icon>
          <span>Okres: {{ data.currentMonth }}</span>
        </div>

        <!-- Description -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Opis (opcjonalny)</mat-label>
          <textarea matInput
                    [(ngModel)]="powerExpense.description"
                    placeholder="Dodatkowe informacje o zużyciu energii"
                    rows="3"></textarea>
        </mat-form-field>

        <!-- Information box -->
        <div class="info-box">
          <mat-icon>info</mat-icon>
          <div class="info-content">
            <p><strong>Informacja:</strong></p>
            <p>Może istnieć tylko jeden wydatek na prąd w miesiącu. Jeśli już istnieje, zostanie zaktualizowany.</p>
            <p>Kwota jest automatycznie obliczana na podstawie zużycia i ceny za kWh.</p>
          </div>
        </div>
      </div>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Anuluj</button>
      <button mat-raised-button
              color="primary"
              (click)="onSave()"
              [disabled]="!isFormValid()">
        {{ data.isEdit ? 'Zaktualizuj' : 'Dodaj' }}
      </button>
    </div>
  `,
  styles: [`
    .power-expense-form {
      min-width: 450px;
      padding: 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .calculation-display {
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      border: 1px solid #bbdefb;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }

    .calculation-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .calculation-row.total {
      font-weight: 600;
      color: #1976d2;
      font-size: 16px;
    }

    .calculation-row.total-gross {
      font-weight: 700;
      color: #2e7d32;
      font-size: 18px;
    }

    .calculation-divider {
      height: 1px;
      background: #ccc;
      margin: 12px 0;
    }

    .label {
      color: #555;
    }

    .value {
      font-weight: 600;
    }

    .period-display {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 6px;
      margin: 16px 0;
      color: #666;
      font-weight: 500;
    }

    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      margin: 16px 0;
    }

    .info-box mat-icon {
      color: #f39c12;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .info-content {
      flex: 1;
    }

    .info-content p {
      margin: 0 0 8px 0;
      font-size: 13px;
      line-height: 1.4;
    }

    .info-content p:last-child {
      margin-bottom: 0;
    }

    mat-dialog-content {
      overflow: visible !important;
    }

    /* Remove spinner arrows from number inputs */
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    input[type="number"] {
      -moz-appearance: textfield;
    }
  `]
})
export class PowerExpenseDialogComponent implements OnInit {
  powerExpense: any = {
    powerConsumptionKw: 0,
    pricePerKwh: 0,
    description: ''
  };

  constructor(
    public dialogRef: MatDialogRef<PowerExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data.expense) {
      this.powerExpense = { ...this.data.expense };
    } else {
      // Set default values for new power expense
      this.powerExpense = {
        powerConsumptionKw: 0,
        pricePerKwh: 0.65, // Default price in Poland
        description: ''
      };
    }
  }

  calculateAmount(): void {
    // Force change detection
  }

  getNetAmount(): number {
    const consumption = parseFloat(this.powerExpense.powerConsumptionKw) || 0;
    const price = parseFloat(this.powerExpense.pricePerKwh) || 0;
    return consumption * price;
  }

  getGrossAmount(): number {
    return this.getNetAmount() * 1.23;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(value);
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  isFormValid(): boolean {
    const consumption = parseFloat(this.powerExpense.powerConsumptionKw);
    const price = parseFloat(this.powerExpense.pricePerKwh);

    return consumption > 0 && price > 0 && this.getNetAmount() > 0;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isFormValid()) {
      const result = {
        ...this.powerExpense,
        powerConsumptionKw: parseFloat(this.powerExpense.powerConsumptionKw),
        pricePerKwh: parseFloat(this.powerExpense.pricePerKwh),
        netAmount: this.getNetAmount(),
        grossAmount: this.getGrossAmount()
      };
      this.dialogRef.close(result);
    }
  }
}
