import {Component, OnInit} from '@angular/core';
import {
  MatCell, MatCellDef, MatColumnDef, MatFooterCell, MatFooterRow,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef, MatTable
} from "@angular/material/table";
import {NgClass, NgIf} from "@angular/common";
import {MatCheckbox} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatIcon} from "@angular/material/icon";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatTooltip} from "@angular/material/tooltip";
import {MatInput} from "@angular/material/input";
import {MatSelect} from "@angular/material/select";
import {MatOption} from "@angular/material/core";
import {MatDialog, MatDialogModule} from "@angular/material/dialog";
import {MatDialogRef, MAT_DIALOG_DATA} from "@angular/material/dialog";
import {Inject} from "@angular/core";
import {
  FixedExpenseService,
  FixedExpenseResponse,
  CreateFixedExpenseRequest,
  UpdateFixedExpenseRequest,
  DeleteFixedExpenseRequest,
  ExpenseSummaryResponse
} from '../../../utility/service/fixed-expense.service';
import {catchError, finalize} from 'rxjs/operators';
import {of} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

interface VariableExpense {
  id: number;
  category: string;
  name: string;
  amount: number; // netto
  date: string;
  supplier: string;
}

interface Product {
  id: number;
  name: string;
  ean: string;
  materialCost: number;
  powerCost: number;
  packagingCost: number;
  laborCost: number;
  totalCost: number;
  retailPrice: number;
  margin: number;
}

interface Offer {
  id: number;
  name: string;
  productsIncluded: string;
  totalCost: number;
  offerPrice: number;
  margin: number;
}

interface MonthYear {
  month: number;
  year: number;
  displayName: string;
}

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

@Component({
  selector: 'app-accounting-expenses',
  templateUrl: './accounting-expenses.component.html',
  styleUrl: './accounting-expenses.component.css'
})
export class AccountingExpensesComponent implements OnInit {
  activeTab: string = 'company';
  activeSubTab: string = 'fixed';
  productSubTab: string = 'products';
  searchQuery: string = '';
  showGross: boolean = true;
  isLoading: boolean = false;

  // Date selection properties
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  currentMonth: string = '';

  // Available months and years
  months: Array<{value: number, name: string}> = [
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

  // Backend data
  fixedExpenses: FixedExpenseResponse[] = [];
  expenseSummary: ExpenseSummaryResponse | null = null;

  // Mock data for tabs not yet implemented
  variableExpenses: VariableExpense[] = [
    { id: 6, category: 'Materiały', name: 'Filament PLA czarny', amount: 122, date: '2023-06-05', supplier: 'FilamentWorld' },
    { id: 7, category: 'Materiały', name: 'Filament PETG transparent', amount: 146, date: '2023-06-05', supplier: 'FilamentWorld' },
    { id: 8, category: 'Materiały', name: 'Kartony 20x20x10', amount: 98, date: '2023-06-03', supplier: 'PackagingPro' },
    { id: 9, category: 'Materiały', name: 'Elementy złączne M4', amount: 37, date: '2023-06-02', supplier: 'HardwareShop' },
    { id: 10, category: 'Biuro', name: 'Artykuły biurowe', amount: 65, date: '2023-06-02', supplier: 'OfficeSupplies' }
  ];

  products: Product[] = [
    {
      id: 1,
      name: 'Znacznik magnetyczny',
      ean: '5901234123457',
      materialCost: 6.65,
      powerCost: 0.40,
      packagingCost: 1.20,
      laborCost: 6.25,
      totalCost: 14.50,
      retailPrice: 29.99,
      margin: 51.65
    },
    {
      id: 2,
      name: 'Organizer na biurko',
      ean: '5901234123458',
      materialCost: 22.35,
      powerCost: 0.96,
      packagingCost: 2.50,
      laborCost: 12.50,
      totalCost: 38.31,
      retailPrice: 59.99,
      margin: 36.14
    },
    {
      id: 3,
      name: 'Uchwyt na słuchawki',
      ean: '5901234123459',
      materialCost: 17.80,
      powerCost: 0.64,
      packagingCost: 1.80,
      laborCost: 8.75,
      totalCost: 28.99,
      retailPrice: 49.99,
      margin: 42.01
    }
  ];

  offers: Offer[] = [
    {
      id: 1,
      name: 'Zestaw biurkowy Premium',
      productsIncluded: 'Organizer na biurko, Uchwyt na słuchawki, Stojak na telefon',
      totalCost: 84.53,
      offerPrice: 129.99,
      margin: 34.97
    },
    {
      id: 2,
      name: 'Zestaw magnetycznych organizerów',
      productsIncluded: 'Znacznik magnetyczny (5 szt.)',
      totalCost: 72.50,
      offerPrice: 129.99,
      margin: 44.23
    }
  ];

  constructor(
    private dialog: MatDialog,
    private fixedExpenseService: FixedExpenseService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.initializeYears();
    this.updateCurrentMonth();
    this.loadExpensesForCurrentMonth();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = 2020; year <= currentYear + 2; year++) {
      this.years.push(year);
    }
  }

  private updateCurrentMonth(): void {
    const monthName = this.months.find(m => m.value === this.selectedMonth)?.name || '';
    this.currentMonth = `${monthName} ${this.selectedYear}`;
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

  onMonthYearChange(): void {
    this.updateCurrentMonth();
    this.loadExpensesForCurrentMonth();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  setActiveSubTab(subTab: string): void {
    this.activeSubTab = subTab;
  }

  setProductSubTab(subTab: string): void {
    this.productSubTab = subTab;
  }

  toggleGross(): void {
    this.showGross = !this.showGross;
  }

  formatCurrency(value: number): string {
    const adjustedValue = this.showGross ? value * 1.23 : value;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(adjustedValue);
  }

  formatCurrencyFromBackend(expense: FixedExpenseResponse): string {
    const value = this.showGross ? expense.grossAmount : expense.netAmount;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  getFixedExpensesTotal(): number {
    if (!this.expenseSummary) {
      return 0;
    }
    return this.showGross ? this.expenseSummary.totalGrossAmount : this.expenseSummary.totalNetAmount;
  }

  getVariableExpensesTotal(): number {
    const total = this.variableExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return this.showGross ? total * 1.23 : total;
  }

  getTotalExpenses(): number {
    return this.getFixedExpensesTotal() + this.getVariableExpensesTotal();
  }

  getMarginClass(margin: number): string {
    if (margin > 45) return 'margin-high';
    if (margin > 30) return 'margin-medium';
    return 'margin-low';
  }

  addExpense(): void {
    const expenseType = this.activeSubTab === 'fixed' ? 'fixed' : 'variable';

    const dialogRef = this.dialog.open(ExpenseDialogComponent, {
      width: '500px',
      data: {
        type: expenseType,
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && expenseType === 'fixed') {
        this.createFixedExpense(result);
      } else if (result && expenseType === 'variable') {
        // TODO: Implement variable expense creation when backend is ready
        this.showInfoMessage('Koszty zmienne będą dostępne wkrótce');
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

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;
    // TODO: Implement search filtering
  }

  // Navigation methods for quick month/year changes
  goToPreviousMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.onMonthYearChange();
  }

  goToNextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.onMonthYearChange();
  }

  goToCurrentMonth(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.onMonthYearChange();
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

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}
