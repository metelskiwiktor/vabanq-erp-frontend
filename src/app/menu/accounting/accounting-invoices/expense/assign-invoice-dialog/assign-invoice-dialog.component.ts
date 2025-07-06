import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {CostInvoice} from "../../../../../utility/service/cost-invoice.service";
import {
  CreateFixedExpenseRequest,
  FixedExpenseResponse,
  FixedExpenseService
} from "../../../../../utility/service/fixed-expense.service";
import {
  CreateVariableExpenseRequest,
  VariableExpenseResponse, VariableExpenseService
} from "../../../../../utility/service/variable-expense.service";
import {AssignInvoiceToExpenseRequest} from "../../../../../utility/model/expense-models";
import {ExpenseInvoiceService} from "../../../../../utility/service/expense-invoice.service";

interface ExpenseOption {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  netAmount: number;
  currency: string;
  period: string;
  description?: string;
}

export interface AssignInvoiceDialogData {
  invoice: CostInvoice;
}

@Component({
  selector: 'app-assign-invoice-dialog',
  templateUrl: './assign-invoice-dialog.component.html',
  styleUrls: ['./assign-invoice-dialog.component.css']
})
export class AssignInvoiceDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Forms
  createExpenseForm: FormGroup;

  // State
  currentView: 'assign' | 'create' = 'assign';
  selectedExpenseId: string | null = null;
  isLoading = false;
  isCreating = false;
  isAssigning = false;

  // Data
  availableExpenses: ExpenseOption[] = [];
  filteredExpenses: ExpenseOption[] = [];

  // Filters
  searchTerm = '';
  typeFilter: '' | 'FIXED' | 'VARIABLE' = '';
  categoryFilter = '';
  periodFilter = '';

  // Options
  availableCategories = [
    { key: 'MATERIALS', displayName: 'Materiały' },
    { key: 'OFFICE', displayName: 'Biuro' },
    { key: 'MARKETING', displayName: 'Marketing' },
    { key: 'UTILITIES', displayName: 'Media' },
    { key: 'SERVICES', displayName: 'Usługi' },
    { key: 'RENT', displayName: 'Czynsz' },
    { key: 'INSURANCE', displayName: 'Ubezpieczenia' },
    { key: 'SOFTWARE', displayName: 'Oprogramowanie' },
    { key: 'TRANSPORT', displayName: 'Transport' },
    { key: 'OTHER', displayName: 'Inne' }
  ];

  constructor(
    public dialogRef: MatDialogRef<AssignInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignInvoiceDialogData,
    private fb: FormBuilder,
    private fixedExpenseService: FixedExpenseService,
    private variableExpenseService: VariableExpenseService,
    private expenseInvoiceService: ExpenseInvoiceService,
    private snackBar: MatSnackBar
  ) {
    this.createExpenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      category: ['', Validators.required],
      month: [new Date().getMonth() + 1, Validators.required],
      year: [new Date().getFullYear(), Validators.required],
      expenseDate: [new Date().toISOString().split('T')[0]], // For variable expenses
      description: [''],
      isRecurring: [false]
    });
  }

  ngOnInit(): void {
    this.loadAvailableExpenses();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormSubscriptions(): void {
    // Watch type changes to toggle date fields
    this.createExpenseForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        const expenseDateControl = this.createExpenseForm.get('expenseDate');
        const monthControl = this.createExpenseForm.get('month');
        const yearControl = this.createExpenseForm.get('year');

        if (type === 'VARIABLE') {
          expenseDateControl?.setValidators([Validators.required]);
          monthControl?.clearValidators();
          yearControl?.clearValidators();
        } else {
          expenseDateControl?.clearValidators();
          monthControl?.setValidators([Validators.required]);
          yearControl?.setValidators([Validators.required]);
        }

        expenseDateControl?.updateValueAndValidity();
        monthControl?.updateValueAndValidity();
        yearControl?.updateValueAndValidity();
      });
  }

  private loadAvailableExpenses(): void {
    this.isLoading = true;

    // Load both fixed and variable expenses
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    Promise.all([
      this.fixedExpenseService.getExpensesForMonth(currentMonth, currentYear).toPromise(),
      this.variableExpenseService.getAllExpenses().toPromise()
    ]).then(([fixedExpenses, variableExpenses]) => {
      this.availableExpenses = [
        ...(fixedExpenses || []).map(expense => this.mapFixedExpenseToOption(expense)),
        ...(variableExpenses || []).map(expense => this.mapVariableExpenseToOption(expense))
      ];

      this.applyFilters();
      this.isLoading = false;
    }).catch(error => {
      console.error('Error loading expenses:', error);
      this.isLoading = false;
      this.snackBar.open('Błąd podczas ładowania wydatków', 'Zamknij', { duration: 3000 });
    });
  }

  private mapFixedExpenseToOption(expense: FixedExpenseResponse): ExpenseOption {
    return {
      id: expense.id,
      name: expense.name,
      type: 'FIXED',
      category: expense.category,
      netAmount: expense.netAmount,
      currency: 'PLN',
      period: expense.displayMonth,
      description: expense.description
    };
  }

  private mapVariableExpenseToOption(expense: VariableExpenseResponse): ExpenseOption {
    return {
      id: expense.id,
      name: expense.name,
      type: 'VARIABLE',
      category: expense.category,
      netAmount: expense.netAmount,
      currency: 'PLN',
      period: new Date(expense.expenseDate).toLocaleDateString('pl-PL'),
      description: expense.description
    };
  }

  // Filter methods
  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onTypeFilterChange(value: '' | 'FIXED' | 'VARIABLE'): void {
    this.typeFilter = value;
    this.applyFilters();
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter = value;
    this.applyFilters();
  }

  onPeriodFilterChange(value: string): void {
    this.periodFilter = value;
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredExpenses = this.availableExpenses.filter(expense => {
      const matchesSearch = !this.searchTerm ||
        expense.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (expense.description && expense.description.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesType = !this.typeFilter || expense.type === this.typeFilter;
      const matchesCategory = !this.categoryFilter || expense.category === this.categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }

  // Expense selection
  selectExpense(expense: ExpenseOption): void {
    this.selectedExpenseId = expense.id;
  }

  isExpenseSelected(expense: ExpenseOption): boolean {
    return this.selectedExpenseId === expense.id;
  }

  // View switching
  switchToCreateView(): void {
    this.currentView = 'create';
    // Pre-fill form with invoice data
    const invoice = this.data.invoice;
    this.createExpenseForm.patchValue({
      name: `Wydatek dla faktury ${invoice.number}`,
      description: invoice.description || `Wydatek utworzony automatycznie dla faktury ${invoice.number} od ${invoice.sellerName}`
    });
  }

  switchToAssignView(): void {
    this.currentView = 'assign';
    this.createExpenseForm.reset();
    this.setupFormSubscriptions();
  }

  // Assignment action
  async assignToSelectedExpense(): Promise<void> {
    if (!this.selectedExpenseId) return;

    this.isAssigning = true;

    try {
      const selectedExpense = this.availableExpenses.find(e => e.id === this.selectedExpenseId);
      if (!selectedExpense) throw new Error('Wybrany wydatek nie istnieje');

      const request: AssignInvoiceToExpenseRequest = {
        expenseId: this.selectedExpenseId,
        invoiceId: this.data.invoice.id,
        expenseType: selectedExpense.type.toLowerCase() as 'fixed' | 'variable'
      };

      await this.expenseInvoiceService.assignInvoiceToExpense(request).toPromise();

      this.snackBar.open('Faktura została przypisana do wydatku', 'Zamknij', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close({ success: true, action: 'assigned' });
    } catch (error) {
      console.error('Error assigning invoice:', error);
      this.snackBar.open('Błąd podczas przypisywania faktury', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.isAssigning = false;
    }
  }

  // Create expense action
  async createExpenseAndAssign(): Promise<void> {
    if (this.createExpenseForm.invalid) {
      this.markFormGroupTouched(this.createExpenseForm);
      return;
    }

    this.isCreating = true;

    try {
      const formValue = this.createExpenseForm.value;
      const expenseType = formValue.type;

      let createdExpense: any;

      if (expenseType === 'FIXED') {
        const request: CreateFixedExpenseRequest = {
          name: formValue.name,
          category: formValue.category,
          netAmount: this.data.invoice.netPrice.toString(),
          month: formValue.month,
          year: formValue.year,
          isRecurring: formValue.isRecurring,
          description: formValue.description
        };

        createdExpense = await this.fixedExpenseService.createFixedExpense(request).toPromise();
      } else {
        const request: CreateVariableExpenseRequest = {
          name: formValue.name,
          category: formValue.category,
          netAmount: this.data.invoice.netPrice.toString(),
          expenseDate: formValue.expenseDate,
          supplier: this.data.invoice.sellerName || 'Nieznany dostawca',
          description: formValue.description
        };

        createdExpense = await this.variableExpenseService.createVariableExpense(request).toPromise();
      }

      // Now assign the invoice to the created expense
      const assignRequest: AssignInvoiceToExpenseRequest = {
        expenseId: createdExpense.id,
        invoiceId: this.data.invoice.id,
        expenseType: expenseType.toLowerCase() as 'fixed' | 'variable'
      };

      await this.expenseInvoiceService.assignInvoiceToExpense(assignRequest).toPromise();

      this.snackBar.open('Wydatek został utworzony i faktura została przypisana', 'Zamknij', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close({ success: true, action: 'created' });
    } catch (error) {
      console.error('Error creating expense:', error);
      this.snackBar.open('Błąd podczas tworzenia wydatku', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.isCreating = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pl-PL');
  }

  getCategoryDisplayName(category: string): string {
    const found = this.availableCategories.find(c => c.key === category);
    return found?.displayName || category;
  }

  getTypeDisplayName(type: 'FIXED' | 'VARIABLE'): string {
    return type === 'FIXED' ? 'Stały' : 'Zmienny';
  }

  getMonthName(month: number): string {
    const months = [
      '', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    return months[month] || month.toString();
  }

  trackByExpenseId(index: number, expense: ExpenseOption): string {
    return expense.id;
  }

  // Form error methods
  getFieldError(fieldName: string): string {
    const field = this.createExpenseForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'To pole jest wymagane';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} znaków`;
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.createExpenseForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Close dialog
  closeDialog(): void {
    this.dialogRef.close({ success: false });
  }

  get isFormValid(): boolean {
    return this.createExpenseForm.valid;
  }

  get canAssign(): boolean {
    return !!this.selectedExpenseId && !this.isAssigning;
  }

  get canCreate(): boolean {
    return this.isFormValid && !this.isCreating;
  }

  get expenseTypeIsFixed(): boolean {
    return this.createExpenseForm.get('type')?.value === 'FIXED';
  }

  get expenseTypeIsVariable(): boolean {
    return this.createExpenseForm.get('type')?.value === 'VARIABLE';
  }
}
