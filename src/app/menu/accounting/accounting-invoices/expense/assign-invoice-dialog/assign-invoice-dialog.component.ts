// assign-invoice-dialog.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, startWith, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CostInvoice, CostInvoiceCategory } from "../../../../../utility/service/cost-invoice.service";
import {
  ExpenseService,
  ExpenseResponse,
  CreateExpenseRequest,
  AttachInvoiceRequest,
  ExpenseCategory
} from "../../../../../utility/service/expense.service";
import { ExpenseCategoryMapperService } from "../../../../../utility/service/expense-category-mapper.service";

interface ExpenseOption {
  id: string;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  category: ExpenseCategory;
  totalGrossCost: number;
  totalNetCost: number;
  currency: string;
  period: string;
  description?: string;
  items?: Array<{
    id: string;
    name: string;
    costInvoiceId?: string;
    netAmount: number;
    grossAmount: number;
  }>;
}

export interface AssignInvoiceDialogData {
  invoice: CostInvoice;
}

type DialogView = 'assign' | 'create';

@Component({
  selector: 'app-assign-invoice-dialog',
  templateUrl: './assign-invoice-dialog.component.html',
  styleUrls: ['./assign-invoice-dialog.component.css']
})
export class AssignInvoiceDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form and state
  createExpenseForm!: FormGroup;
  currentView: DialogView = 'assign';

  // Data
  availableExpenses: ExpenseOption[] = [];
  filteredExpenses: ExpenseOption[] = [];
  availableCategories: { key: ExpenseCategory; displayName: string }[] = [];

  // Selection and filters
  selectedExpenseId: string | null = null;
  searchTerm: string = '';
  typeFilter: string = '';
  categoryFilter: string = '';

  // Loading states
  isLoading: boolean = false;
  isAssigning: boolean = false;
  isCreating: boolean = false;

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
      description: [''],
      type: ['VARIABLE', Validators.required],
      category: ['', Validators.required],
      tags: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableCategories();
    this.loadAvailableExpenses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableCategories(): void {
    this.availableCategories = this.expenseService.getAvailableCategories();
  }

  private loadAvailableExpenses(): void {
    this.isLoading = true;

    // Get current month expenses to check for existing assignments
    const currentDate = new Date();
    const yearMonth = { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 };

    this.expenseService.listExpensesForMonth(yearMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expenses: ExpenseResponse[]) => {
          this.availableExpenses = expenses.map(expense => ({
            id: expense.id,
            name: expense.name,
            type: expense.type,
            category: expense.category,
            totalGrossCost: expense.totalGrossCost || 0,
            totalNetCost: expense.totalNetCost || 0,
            currency: 'PLN', // Default currency
            period: this.formatExpensePeriod(expense.createdAt),
            description: expense.description,
            items: expense.items || []
          }));

          this.applyFilters();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading expenses:', error);
          this.snackBar.open('Błąd podczas ładowania wydatków', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        }
      });
  }

  private formatExpensePeriod(createdAt: string): string {
    const date = new Date(createdAt);
    return date.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' });
  }

  // Check if expense has invoice items assigned
  hasInvoiceAssigned(expense: ExpenseOption): boolean {
    return expense.items ? expense.items.some(item => !!item.costInvoiceId) : false;
  }

  // Count invoice items for an expense
  getInvoiceItemsCount(expense: ExpenseOption): number {
    return expense.items ? expense.items.filter(item => !!item.costInvoiceId).length : 0;
  }

  // Get selected expense object
  getSelectedExpense(): ExpenseOption | null {
    return this.availableExpenses.find(expense => expense.id === this.selectedExpenseId) || null;
  }

  // Search and filtering
  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  onTypeFilterChange(value: string): void {
    this.typeFilter = value;
    this.applyFilters();
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter = value;
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

  trackByExpenseId(index: number, expense: ExpenseOption): string {
    return expense.id;
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
      description: invoice.description && invoice.description !== 'null' ?
        invoice.description : '',
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
      console.error('Error creating expense and assigning invoice:', error);
      this.snackBar.open('Błąd podczas tworzenia wydatku', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.isCreating = false;
    }
  }

  // Helper methods
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pl-PL');
  }

  getCategoryDisplayName(category: CostInvoiceCategory | ExpenseCategory): string {
    if (typeof category === 'string') {
      // Handle CostInvoiceCategory
      const categoryDisplayNames: { [key: string]: string } = {
        'HOUSING_FEES': 'Opłaty mieszkaniowe',
        'ELECTRONIC_SERVICES': 'Usługi elektroniczne',
        'ACCOUNTING_SERVICES': 'Usługi księgowe',
        'ENTREPRENEUR_EXPENSES': 'Wydatki przedsiębiorcy',
        'SALARY': 'Wynagrodzenie',
        'EMPLOYEE_SOCIAL_SECURITY': 'ZUS za pracownika',
        'GOODS_OR_MATERIALS_PURCHASE': 'Zakup towarów i/lub materiałów',
        'NONE': 'Brak przypisanej kategorii',
        'OTHER': 'Inne',
        // ExpenseCategory mappings
        'SERVICES': 'Usługi',
        'ACCOUNTING': 'Księgowość',
        'OFFICE_SUPPLIES': 'Biuro',
        'TRAVEL': 'Podróże'
      };
      return categoryDisplayNames[category] || 'Nieznana kategoria';
    }
    return this.expenseService.getCategoryDisplayName(category as ExpenseCategory);
  }

  hasFieldError(fieldName: string, errorType: string = 'required'): boolean {
    const field = this.createExpenseForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

}
