// assign-invoice-dialog.component.ts - Updated with pre-selection and month filtering
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
  currentExpenseId?: string; // Add current expense ID for pre-selection
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

  // Invoice month for filtering
  invoiceMonth!: { year: number; month: number };

  constructor(
    public dialogRef: MatDialogRef<AssignInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignInvoiceDialogData,
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private expenseCategoryMapper: ExpenseCategoryMapperService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForms();
    this.calculateInvoiceMonth();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadExpensesForInvoiceMonth();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateInvoiceMonth(): void {
    const invoiceDate = new Date(this.data.invoice.createdAt);
    this.invoiceMonth = {
      year: invoiceDate.getFullYear(),
      month: invoiceDate.getMonth() + 1 // Convert to 1-12
    };
  }

  private initializeForms(): void {
    this.createExpenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['VARIABLE', Validators.required],
      category: ['', Validators.required],
      cyclic: [false],
      tags: ['']
    });
  }

  private loadCategories(): void {
    this.availableCategories = this.expenseService.getAvailableCategories();
  }

  private loadExpensesForInvoiceMonth(): void {
    this.isLoading = true;

    // Load expenses only for the month of the invoice
    this.expenseService.listExpensesForMonth(this.invoiceMonth)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expenses) => {
          this.availableExpenses = expenses.map(expense => ({
            id: expense.id,
            name: expense.name,
            type: expense.type,
            category: expense.category,
            totalGrossCost: expense.totalGrossCost,
            totalNetCost: expense.totalNetCost,
            currency: 'PLN',
            period: this.formatPeriod(expense.createdAt),
            description: expense.description,
            items: expense.items
          }));

          this.applyFilters();
          this.preselectCurrentExpense();
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

  private preselectCurrentExpense(): void {
    if (this.data.currentExpenseId) {
      // Find and pre-select the current expense
      const currentExpense = this.availableExpenses.find(exp => exp.id === this.data.currentExpenseId);
      if (currentExpense) {
        this.selectedExpenseId = this.data.currentExpenseId;
      }
    }
  }

  protected formatPeriod(createdAt: string): string {
    const date = new Date(createdAt);
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  // Filtering
  applyFilters(): void {
    let filtered = this.availableExpenses;

    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.name.toLowerCase().includes(searchLower) ||
        (expense.description && expense.description.toLowerCase().includes(searchLower))
      );
    }

    if (this.typeFilter) {
      filtered = filtered.filter(expense => expense.type === this.typeFilter);
    }

    if (this.categoryFilter) {
      filtered = filtered.filter(expense => expense.category === this.categoryFilter);
    }

    this.filteredExpenses = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onCategoryFilterChange(): void {
    this.applyFilters();
  }

  // Expense selection
  selectExpense(expense: ExpenseOption): void {
    this.selectedExpenseId = expense.id;
  }

  isExpenseSelected(expense: ExpenseOption): boolean {
    return this.selectedExpenseId === expense.id;
  }

  getSelectedExpense(): ExpenseOption | null {
    return this.availableExpenses.find(exp => exp.id === this.selectedExpenseId) || null;
  }

  // Utility methods
  hasInvoiceAssigned(expense: ExpenseOption): boolean {
    return expense.items! && expense.items.length > 0 &&
      expense.items.some(item => item.costInvoiceId);
  }

  getInvoiceItemsCount(expense: ExpenseOption): number {
    if (!expense.items) return 0;
    return expense.items.filter(item => item.costInvoiceId).length;
  }

  getCategoryDisplayName(category: ExpenseCategory): string {
    return this.expenseService.getCategoryDisplayName(category);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  }

  // View switching
  switchToCreateView(): void {
    this.currentView = 'create';
    // this.prefillCreateForm();
  }

  private prefillCreateForm(): void {
    const invoice = this.data.invoice;

    // Generate suggested name
    const suggestedName = this.expenseCategoryMapper.generateExpenseNameFromInvoice(
      invoice.number,
      invoice.sellerName,
      invoice.description
    );

    // Generate tags
    const suggestedTags = this.expenseCategoryMapper.generateTagsFromInvoice(
      invoice.category,
      invoice.sellerName,
      invoice.description
    );

    this.createExpenseForm.patchValue({
      name: suggestedName,
      description: invoice.description !== 'null' ? invoice.description : '',
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

      // Create expense request with invoice date for proper month assignment
      const createRequest: CreateExpenseRequest = {
        name: formValue.name,
        description: formValue.description || undefined,
        type: formValue.type,
        cyclic: formValue.cyclic || false,
        category: formValue.category,
        tags: tags,
        createdAt: this.data.invoice.createdAt // Use invoice date for expense month
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

      this.dialogRef.close({ success: true, action: 'created', expenseId: createdExpense.id });
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

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.createExpenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.createExpenseForm.get(fieldName);
    if (field?.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) return `Pole ${fieldName} jest wymagane`;
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} znaków`;
    }
    return '';
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
