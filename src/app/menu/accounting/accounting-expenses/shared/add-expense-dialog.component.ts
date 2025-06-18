// src/app/menu/accounting/accounting-expenses/shared/add-expense-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface AddExpenseDialogData {
  type?: 'fixed' | 'variable'; // Typ wydatku
  expenseType?: 'fixed' | 'variable' | null; // Dla wyboru z poziomu dialogu
  isEdit: boolean;
  expense?: any;
  allowTypeSelection?: boolean; // Czy pozwalać na wybór typu (dla faktury)
  selectedExpenseType?: 'fixed' | 'variable'; // Predefiniowany typ
  isFromInvoice?: boolean; // Czy wywołane z panelu faktur
}

export interface ExpenseFormData {
  name: string;
  category: string;
  netAmount: number;
  description?: string;
  expenseType: 'fixed' | 'variable';

  // Dla wydatków zmiennych
  date?: string;
  supplier?: string;

  // Dla wydatków stałych
  isRecurring?: boolean;
}

@Component({
  selector: 'app-add-expense-dialog',
  template: `
    <div class="dialog-container">
      <h1 mat-dialog-title class="dialog-title">
        <div class="title-content">
          <mat-icon class="title-icon">{{ getTitleIcon() }}</mat-icon>
          <div class="title-text">
            <div class="main-title">{{ getDialogTitle() }}</div>
            <div class="subtitle" *ngIf="!data.isEdit">{{ getDialogSubtitle() }}</div>
          </div>
        </div>
      </h1>

      <div mat-dialog-content class="dialog-content">
        <!-- Expense Type Selection (tylko jeśli allowTypeSelection = true) -->
        <div *ngIf="data.allowTypeSelection && !data.isEdit" class="expense-type-selection">
          <h3>Typ wydatku</h3>
          <div class="type-cards">
            <div class="type-card"
                 [class.selected]="expenseForm.expenseType === 'fixed'"
                 (click)="selectExpenseType('fixed')">
              <div class="type-icon fixed-icon">
                <mat-icon>account_balance</mat-icon>
              </div>
              <div class="type-info">
                <div class="type-name">Koszt stały</div>
                <div class="type-description">Regularne, cykliczne wydatki</div>
              </div>
            </div>

            <div class="type-card"
                 [class.selected]="expenseForm.expenseType === 'variable'"
                 (click)="selectExpenseType('variable')">
              <div class="type-icon variable-icon">
                <mat-icon>trending_up</mat-icon>
              </div>
              <div class="type-info">
                <div class="type-name">Koszt zmienny</div>
                <div class="type-description">Jednorazowe, nieprzewidywalne wydatki</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="form-fields" *ngIf="expenseForm.expenseType">
          <!-- Category Selection -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Kategoria</mat-label>
            <mat-select [(ngModel)]="expenseForm.category" required>
              <mat-option value="Biuro">
                <div class="option-content">
                  <mat-icon>business</mat-icon>
                  <span>Biuro</span>
                </div>
              </mat-option>
              <mat-option value="Materiały">
                <div class="option-content">
                  <mat-icon>inventory</mat-icon>
                  <span>Materiały</span>
                </div>
              </mat-option>
              <mat-option value="Opłaty">
                <div class="option-content">
                  <mat-icon>receipt</mat-icon>
                  <span>Opłaty</span>
                </div>
              </mat-option>
              <mat-option value="Transport">
                <div class="option-content">
                  <mat-icon>local_shipping</mat-icon>
                  <span>Transport</span>
                </div>
              </mat-option>
              <mat-option value="Marketing">
                <div class="option-content">
                  <mat-icon>campaign</mat-icon>
                  <span>Marketing</span>
                </div>
              </mat-option>
              <mat-option value="Prąd">
                <div class="option-content">
                  <mat-icon>flash_on</mat-icon>
                  <span>Prąd</span>
                </div>
              </mat-option>
              <mat-option value="Inne">
                <div class="option-content">
                  <mat-icon>more_horiz</mat-icon>
                  <span>Inne</span>
                </div>
              </mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Expense Name -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nazwa wydatku</mat-label>
            <input matInput
                   [(ngModel)]="expenseForm.name"
                   placeholder="Wpisz nazwę wydatku"
                   required>
            <mat-icon matSuffix>edit</mat-icon>
          </mat-form-field>

          <!-- Net Amount -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Kwota netto (PLN)</mat-label>
            <input matInput
                   type="number"
                   step="0.01"
                   min="0"
                   [(ngModel)]="expenseForm.netAmount"
                   (input)="updateGrossAmount()"
                   placeholder="0.00"
                   required>
            <span matPrefix>PLN&nbsp;</span>
            <mat-icon matSuffix>euro_symbol</mat-icon>
          </mat-form-field>

          <!-- Gross Amount Display -->
          <div class="gross-amount-display">
            <div class="gross-label">Kwota brutto (23% VAT):</div>
            <div class="gross-value">{{ formatCurrency(getGrossAmount()) }}</div>
          </div>

          <!-- Variable Expense Fields -->
          <div *ngIf="expenseForm.expenseType === 'variable'" class="variable-fields">
            <div class="fields-header">
              <mat-icon>trending_up</mat-icon>
              <span>Szczegóły kosztu zmiennego</span>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Data wydatku</mat-label>
              <input matInput
                     type="date"
                     [(ngModel)]="expenseForm.date"
                     required>
              <mat-icon matSuffix>event</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Dostawca</mat-label>
              <input matInput
                     [(ngModel)]="expenseForm.supplier"
                     placeholder="Nazwa dostawcy lub kontrahenta"
                     required>
              <mat-icon matSuffix>business</mat-icon>
            </mat-form-field>
          </div>

          <!-- Fixed Expense Fields -->
          <div *ngIf="expenseForm.expenseType === 'fixed'" class="fixed-fields">
            <div class="fields-header">
              <mat-icon>account_balance</mat-icon>
              <span>Szczegóły kosztu stałego</span>
            </div>

            <div class="recurring-option">
              <mat-checkbox [(ngModel)]="expenseForm.isRecurring">
                <div class="checkbox-content">
                  <div class="checkbox-label">Wydatek cykliczny</div>
                  <div class="checkbox-description">
                    Automatycznie dodawaj ten wydatek w kolejnych miesiącach
                  </div>
                </div>
              </mat-checkbox>
            </div>
          </div>

          <!-- Description -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Opis (opcjonalny)</mat-label>
            <textarea matInput
                      [(ngModel)]="expenseForm.description"
                      placeholder="Dodatkowe informacje o wydatku"
                      rows="3"
                      maxlength="500"></textarea>
            <mat-hint align="end">{{ expenseForm.description?.length || 0 }}/500</mat-hint>
            <mat-icon matSuffix>description</mat-icon>
          </mat-form-field>
        </div>

        <!-- Summary Panel -->
        <div class="summary-panel" *ngIf="expenseForm.expenseType && isFormValid()">
          <div class="summary-header">
            <mat-icon>summarize</mat-icon>
            <span>Podsumowanie wydatku</span>
          </div>
          <div class="summary-content">
            <div class="summary-row">
              <span class="label">Typ:</span>
              <span class="value">{{ expenseForm.expenseType === 'fixed' ? 'Koszt stały' : 'Koszt zmienny' }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Kategoria:</span>
              <span class="value">{{ expenseForm.category }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Kwota netto:</span>
              <span class="value">{{ formatCurrency(expenseForm.netAmount) }}</span>
            </div>
            <div class="summary-row total">
              <span class="label">Kwota brutto:</span>
              <span class="value">{{ formatCurrency(getGrossAmount()) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button
                (click)="onCancel()"
                class="cancel-btn">
          <mat-icon>close</mat-icon>
          Anuluj
        </button>

        <button mat-raised-button
                color="primary"
                (click)="onSave()"
                [disabled]="!isFormValid()"
                class="save-btn">
          <mat-icon>{{ data.isEdit ? 'save' : 'add' }}</mat-icon>
          {{ data.isEdit ? 'Zapisz zmiany' : 'Dodaj wydatek' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-width: 600px;
      width: 100%;
    }

    .dialog-title {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: -24px -24px 0 -24px;
      padding: 2rem 2rem 1.5rem 2rem;
      border-radius: 8px 8px 0 0;
    }

    .title-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .title-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 0.75rem;
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .main-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .subtitle {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-top: 0.25rem;
    }

    .dialog-content {
      padding: 2rem 0 1rem 0;
      max-height: 70vh;
      overflow-y: auto;
    }

    .expense-type-selection {
      margin-bottom: 2rem;
    }

    .expense-type-selection h3 {
      margin: 0 0 1rem 0;
      color: #2d3748;
      font-weight: 600;
    }

    .type-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .type-card {
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .type-card:hover {
      border-color: #667eea;
      background: #f8faff;
    }

    .type-card.selected {
      border-color: #667eea;
      background: linear-gradient(135deg, #f8faff 0%, #e8f0ff 100%);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .type-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .fixed-icon {
      background: linear-gradient(45deg, #4caf50, #8bc34a);
    }

    .variable-icon {
      background: linear-gradient(45deg, #ff9800, #ffc107);
    }

    .type-name {
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 0.25rem;
    }

    .type-description {
      font-size: 0.85rem;
      color: #718096;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .full-width {
      width: 100%;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .gross-amount-display {
      background: linear-gradient(135deg, #f8faff 0%, #e8f0ff 100%);
      border: 2px solid #e8f0ff;
      border-radius: 12px;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .gross-label {
      font-weight: 500;
      color: #4a5568;
    }

    .gross-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #667eea;
    }

    .variable-fields,
    .fixed-fields {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      background: #fafbfc;
    }

    .fields-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      font-weight: 600;
      color: #2d3748;
    }

    .recurring-option {
      margin-bottom: 1rem;
    }

    .checkbox-content {
      margin-left: 0.5rem;
    }

    .checkbox-label {
      font-weight: 500;
      color: #2d3748;
    }

    .checkbox-description {
      font-size: 0.85rem;
      color: #718096;
      margin-top: 0.25rem;
    }

    .summary-panel {
      background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
      border: 2px solid #9ae6b4;
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1rem;
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      font-weight: 600;
      color: #22543d;
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
    }

    .summary-row.total {
      border-top: 2px solid #9ae6b4;
      margin-top: 0.5rem;
      padding-top: 1rem;
      font-weight: 600;
    }

    .summary-row .label {
      color: #2d3748;
    }

    .summary-row .value {
      font-weight: 600;
      color: #22543d;
    }

    .dialog-actions {
      padding: 1.5rem 0 0 0;
      border-top: 1px solid #e2e8f0;
      margin-top: 1rem;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
    }

    .cancel-btn {
      color: #718096;
    }

    .save-btn {
      background: linear-gradient(45deg, #4caf50, #8bc34a);
      color: white;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    .save-btn:hover:not([disabled]) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
    }

    .save-btn:disabled {
      background: #e2e8f0;
      color: #a0aec0;
      box-shadow: none;
    }

    @media (max-width: 768px) {
      .dialog-container {
        max-width: 100%;
        margin: 0;
      }

      .type-cards {
        grid-template-columns: 1fr;
      }

      .type-card {
        flex-direction: column;
        text-align: center;
        gap: 0.75rem;
      }

      .gross-amount-display {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
      }

      .summary-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .dialog-actions {
        flex-direction: column-reverse;
      }

      .dialog-actions button {
        width: 100%;
      }
    }
  `]
})
export class AddExpenseDialogComponent implements OnInit {
  expenseForm: ExpenseFormData = {
    name: '',
    category: '',
    netAmount: 0,
    description: '',
    expenseType: 'fixed',
    isRecurring: true
  };

  constructor(
    public dialogRef: MatDialogRef<AddExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddExpenseDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    // Ustaw typ wydatku na podstawie przekazanych danych
    if (this.data.type) {
      this.expenseForm.expenseType = this.data.type;
    } else if (this.data.selectedExpenseType) {
      this.expenseForm.expenseType = this.data.selectedExpenseType;
    } else if (this.data.allowTypeSelection) {
      // Jeśli pozwalamy na wybór typu, nie ustawiamy domyślnego
      this.expenseForm.expenseType = null as any;
    }

    // Jeśli to edycja, wypełnij formularz danymi
    if (this.data.isEdit && this.data.expense) {
      this.expenseForm = {
        ...this.expenseForm,
        ...this.data.expense,
        netAmount: parseFloat(this.data.expense.netAmount) || 0
      };
    }

    // Ustaw domyślną datę dla wydatków zmiennych
    if (this.expenseForm.expenseType === 'variable' && !this.data.isEdit) {
      this.expenseForm.date = new Date().toISOString().split('T')[0];
    }
  }

  selectExpenseType(type: 'fixed' | 'variable'): void {
    this.expenseForm.expenseType = type;

    // Ustaw domyślne wartości dla każdego typu
    if (type === 'variable') {
      this.expenseForm.date = new Date().toISOString().split('T')[0];
      this.expenseForm.isRecurring = undefined;
    } else {
      this.expenseForm.isRecurring = true;
      this.expenseForm.date = undefined;
      this.expenseForm.supplier = undefined;
    }
  }

  updateGrossAmount(): void {
    // Metoda wywoływana przy zmianie kwoty netto
    // Obliczenia są wykonywane w getGrossAmount()
  }

  getGrossAmount(): number {
    return (this.expenseForm.netAmount || 0) * 1.23;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount || 0);
  }

  getTitleIcon(): string {
    if (this.data.allowTypeSelection) {
      return 'receipt_long';
    }

    if (!this.expenseForm.expenseType) {
      return 'receipt_long';
    }

    return this.expenseForm.expenseType === 'fixed' ? 'account_balance' : 'trending_up';
  }

  getDialogTitle(): string {
    if (this.data.isEdit) {
      return 'Edytuj wydatek';
    }

    if (this.data.allowTypeSelection || !this.expenseForm.expenseType) {
      return 'Dodaj wydatek';
    }

    return this.expenseForm.expenseType === 'fixed' ?
      'Dodaj koszt stały' : 'Dodaj koszt zmienny';
  }

  getDialogSubtitle(): string {
    if (this.data.allowTypeSelection) {
      return 'Wybierz typ wydatku i wprowadź szczegóły';
    }

    if (!this.expenseForm.expenseType) {
      return 'Wprowadź szczegóły wydatku';
    }

    return this.expenseForm.expenseType === 'fixed' ?
      'Regularne, cykliczne wydatki firmowe' :
      'Jednorazowe, nieprzewidywalne wydatki';
  }

  isFormValid(): boolean {
    if (!this.expenseForm.expenseType) {
      return false;
    }

    const basicFieldsValid =
      this.expenseForm.name?.trim() &&
      this.expenseForm.category &&
      this.expenseForm.netAmount > 0;

    if (!basicFieldsValid) {
      return false;
    }

    if (this.expenseForm.expenseType === 'variable') {
      return !!(this.expenseForm.date && this.expenseForm.supplier?.trim());
    }

    return true;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.isFormValid()) {
      const result: ExpenseFormData = {
        ...this.expenseForm,
        netAmount: this.expenseForm.netAmount
      };

      this.dialogRef.close(result);
    }
  }
}
