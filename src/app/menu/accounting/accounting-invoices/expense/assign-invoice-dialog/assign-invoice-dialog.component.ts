// src/app/menu/accounting/accounting-invoices/expense/assign-invoice-dialog/assign-invoice-dialog.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, startWith, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CostInvoice, CostInvoiceCategory } from "../../../../../utility/service/cost-invoice.service";
import { ExpenseService, ExpenseResponse, CreateExpenseRequest, AttachInvoiceRequest, ExpenseCategory } from "../../../../../utility/service/expense.service";
import { ExpenseCategoryMapperService } from "../../../../../utility/service/expense-category-mapper.service";

interface ExpenseOption {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  category: ExpenseCategory;
  totalCost: number;
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
  availableCategories: { key: ExpenseCategory; displayName: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<AssignInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignInvoiceDialogData,
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private expenseCategoryMapper: ExpenseCategoryMapperService,
    private snackBar: MatSnackBar
  ) {
    this.createExpenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      tags: ['']
    });
  }

  ngOnInit(): void {
    this.availableCategories = this.expenseService.getAvailableCategories();
    this.loadAvailableExpenses();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormSubscriptions(): void {
    // Setup any form subscriptions if needed
  }

  private loadAvailableExpenses(): void {
    this.isLoading = true;

    // Load expenses for current month
    const currentDate = new Date();
    const yearMonth = this.formatMonthForBackend(currentDate);

    this.expenseService.listExpenses(yearMonth)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading expenses:', error);
          this.snackBar.open('Błąd podczas ładowania wydatków', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          return of([]);
        })
      )
      .subscribe(expenses => {
        this.availableExpenses = expenses.map(expense => this.mapExpenseToOption(expense));
        this.applyFilters();
        this.isLoading = false;
      });
  }

  private formatMonthForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private mapExpenseToOption(expense: ExpenseResponse): ExpenseOption {
    return {
      id: expense.id,
      name: expense.name,
      type: expense.type,
      category: expense.category,
      totalCost: Number(expense.totalCost),
      netAmount: Number(expense.totalCost),
      currency: 'PLN',
      period: this.formatDateToPeriod(expense.createdAt),
      description: expense.description
    };
  }

  private formatDateToPeriod(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long'
    });
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
    // Pre-fill form with invoice data using mapper service
    const invoice = this.data.invoice;

    // Use mapper service to generate smart defaults
    const suggestedName = this.expenseCategoryMapper.generateExpenseNameFromInvoice(
      invoice.number,
      invoice.sellerName,
      invoice.description
    );

    const suggestedCategory = this.expenseCategoryMapper.mapInvoiceCategoryToExpenseCategory(
      invoice.category
    );

    const suggestedType = this.expenseCategoryMapper.suggestExpenseType(
      invoice.category,
      invoice.sellerName,
      invoice.netPrice
    );

    const suggestedTags = this.expenseCategoryMapper.generateTagsFromInvoice(
      invoice.category,
      invoice.sellerName,
      invoice.description
    );

    this.createExpenseForm.patchValue({
      name: suggestedName,
      type: suggestedType,
      category: suggestedCategory,
      description: invoice.description && invoice.description !== 'null' ? invoice.description : '',
      tags: suggestedTags.join(', ')
    });
  }

  switchToAssignView(): void {
    this.currentView = 'assign';
    this.createExpenseForm.reset();
  }

  // Assignment action
  async assignToSelectedExpense(): Promise<void> {
    if (!this.selectedExpenseId) return;

    this.isAssigning = true;

    try {
      const request: AttachInvoiceRequest = {
        costInvoiceId: this.data.invoice.id
      };

      await this.expenseService.attachInvoiceToExpense(this.selectedExpenseId, request).toPromise();

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

      // Parse tags
      const tags = formValue.tags ?
        formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) :
        [];

      // Create expense request
      const createRequest: CreateExpenseRequest = {
        name: formValue.name,
        description: formValue.description || undefined,
        type: formValue.type,
        cyclic: false, // Default to false for now
        category: formValue.category,
        tags: tags
      };

      // Create the expense
      const createdExpense = await this.expenseService.createExpense(createRequest).toPromise();

      if (!createdExpense) {
        throw new Error('Failed to create expense');
      }

      // Attach the invoice to the created expense
      const attachRequest: AttachInvoiceRequest = {
        costInvoiceId: this.data.invoice.id
      };

      await this.expenseService.attachInvoiceToExpense(createdExpense.id, attachRequest).toPromise();

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

  getCategoryDisplayName(category: ExpenseCategory | string): string {
    // Handle both ExpenseCategory and CostInvoiceCategory
    if (typeof category === 'string') {
      // If it's a string, try to map it from CostInvoiceCategory to ExpenseCategory first
      const mappedCategory = this.expenseCategoryMapper.mapInvoiceCategoryToExpenseCategory(category as any);
      return this.expenseService.getCategoryDisplayName(mappedCategory);
    }
    return this.expenseService.getCategoryDisplayName(category);
  }

  getTypeDisplayName(type: 'FIXED' | 'VARIABLE'): string {
    return this.expenseService.getTypeDisplayName(type);
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
