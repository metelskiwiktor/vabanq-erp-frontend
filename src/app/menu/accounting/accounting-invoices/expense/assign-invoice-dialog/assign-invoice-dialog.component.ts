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
  selectedMonth!: { year: number; month: number };

  // Loading states
  isLoading: boolean = false;
  isAssigning: boolean = false;
  isCreating: boolean = false;
  isLoadingMonth: boolean = false;

  // Invoice month for filtering
  invoiceMonth!: { year: number; month: number };

  // Cache for loaded expenses by month
  private expenseCache = new Map<string, ExpenseOption[]>();

  // Pre-computed arrays for template to avoid calling methods in *ngFor
  availableYears: number[] = [];
  availableMonths: { value: number; name: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<AssignInvoiceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignInvoiceDialogData,
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private expenseCategoryMapper: ExpenseCategoryMapperService,
    private snackBar: MatSnackBar
  ) {
    console.log('AssignInvoiceDialogComponent constructor started with data:', data);
    
    try {
      console.log('Initializing forms...');
      this.initializeForms();
      console.log('Forms initialized successfully');
      
      console.log('Calculating invoice month...');
      this.calculateInvoiceMonth();
      console.log('Invoice month calculated:', this.invoiceMonth);
      
      console.log('Constructor completed successfully');
    } catch (error) {
      console.error('Error in AssignInvoiceDialogComponent constructor:', error);
    }
  }

  ngOnInit(): void {
    console.log('ngOnInit started');
    
    try {
      console.log('Loading categories...');
      this.loadCategories();
      console.log('Categories loaded:', this.availableCategories.length);
      
      console.log('Initializing available years and months...');
      this.initializeAvailableOptions();
      console.log('Available years and months initialized');
      
      // Set initial month to invoice month with fallback
      console.log('Setting initial month. Invoice month:', this.invoiceMonth);
      if (this.invoiceMonth && this.invoiceMonth.year && this.invoiceMonth.month) {
        this.selectedMonth = { ...this.invoiceMonth };
        console.log('Selected month set from invoice month:', this.selectedMonth);
      } else {
        // Fallback to current month if invoice month is invalid
        const now = new Date();
        this.selectedMonth = {
          year: now.getFullYear(),
          month: now.getMonth() + 1
        };
        console.log('Selected month set as fallback:', this.selectedMonth);
      }
      
      console.log('About to load expenses for month:', this.selectedMonth);
      this.loadExpensesForMonth(this.selectedMonth);
      console.log('ngOnInit completed successfully');
    } catch (error) {
      console.error('Error in ngOnInit:', error);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateInvoiceMonth(): void {
    if (!this.data?.invoice?.createdAt) {
      console.error('Invoice or createdAt is missing:', this.data);
      const now = new Date();
      this.invoiceMonth = {
        year: now.getFullYear(),
        month: now.getMonth() + 1
      };
      return;
    }
    
    const invoiceDate = new Date(this.data.invoice.createdAt);
    
    // Check if date is valid
    if (isNaN(invoiceDate.getTime())) {
      console.error('Invalid invoice date:', this.data.invoice.createdAt);
      const now = new Date();
      this.invoiceMonth = {
        year: now.getFullYear(),
        month: now.getMonth() + 1
      };
      return;
    }
    
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

    // Reset cyclic to false when type changes to VARIABLE
    this.createExpenseForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        if (type === 'VARIABLE') {
          this.createExpenseForm.get('cyclic')?.setValue(false);
        }
      });
  }

  private loadCategories(): void {
    this.availableCategories = this.expenseService.getAvailableCategories();
  }

  private initializeAvailableOptions(): void {
    // Initialize available years (current year and 2 previous years, no future years)
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let i = currentYear - 2; i <= currentYear; i++) {
      this.availableYears.push(i);
    }
    
    // Initialize available months
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    
    this.availableMonths = monthNames.map((name, index) => ({
      value: index + 1,
      name: name
    }));
  }

  private loadExpensesForMonth(monthYear: { year: number; month: number }): void {
    console.log('loadExpensesForMonth called with:', monthYear);
    
    if (!monthYear || !monthYear.year || !monthYear.month) {
      console.error('Invalid monthYear provided to loadExpensesForMonth:', monthYear);
      return;
    }
    
    const cacheKey = `${monthYear.year}-${monthYear.month}`;
    console.log('Cache key:', cacheKey);
    
    // Check cache first
    if (this.expenseCache.has(cacheKey)) {
      console.log('Found in cache, using cached data');
      this.availableExpenses = this.expenseCache.get(cacheKey) || [];
      this.applyFilters();
      this.preselectCurrentExpense();
      return;
    }

    console.log('Not in cache, loading from service...');
    this.isLoading = true;

    // Load expenses for specific month only
    try {
      this.expenseService.listExpensesForMonth(monthYear)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (expenses) => {
            try {
              const mappedExpenses = expenses.map(expense => ({
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

              // Cache the results
              this.expenseCache.set(cacheKey, mappedExpenses);
              this.availableExpenses = mappedExpenses;

              this.applyFilters();
              this.preselectCurrentExpense();
              this.isLoading = false;
            } catch (mappingError) {
              console.error('Error mapping expenses:', mappingError);
              this.availableExpenses = [];
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error('Error loading expenses:', error);
            this.snackBar.open('Błąd podczas ładowania wydatków', 'Zamknij', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
            this.availableExpenses = [];
            this.isLoading = false;
          }
        });
    } catch (subscriptionError) {
      console.error('Error setting up expenses subscription:', subscriptionError);
      this.availableExpenses = [];
      this.isLoading = false;
    }
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

  // Month navigation
  previousMonth(): void {
    if (!this.selectedMonth || !this.selectedMonth.year || !this.selectedMonth.month) {
      console.error('selectedMonth is not properly initialized:', this.selectedMonth);
      return;
    }
    
    const currentDate = new Date(this.selectedMonth.year, this.selectedMonth.month - 1, 1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    
    this.selectedMonth = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
    };
    
    this.loadExpensesForMonth(this.selectedMonth);
  }

  nextMonth(): void {
    if (!this.selectedMonth || !this.selectedMonth.year || !this.selectedMonth.month) {
      console.error('selectedMonth is not properly initialized:', this.selectedMonth);
      return;
    }
    
    const currentDate = new Date(this.selectedMonth.year, this.selectedMonth.month - 1, 1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    
    this.selectedMonth = {
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
    };
    
    this.loadExpensesForMonth(this.selectedMonth);
  }

  onYearChange(year: number): void {
    if (!this.selectedMonth || !year || year < 2020 || year > 2030) {
      console.error('Invalid year or selectedMonth not initialized:', year, this.selectedMonth);
      return;
    }
    
    this.selectedMonth = {
      year: year,
      month: this.selectedMonth.month
    };
    
    this.loadExpensesForMonth(this.selectedMonth);
  }

  onMonthChange(month: number): void {
    if (!this.selectedMonth || !month || month < 1 || month > 12) {
      console.error('Invalid month or selectedMonth not initialized:', month, this.selectedMonth);
      return;
    }
    
    this.selectedMonth = {
      year: this.selectedMonth.year,
      month: month
    };
    
    this.loadExpensesForMonth(this.selectedMonth);
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

  // Helper methods for month display
  getMonthName(month: number): string {
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];
    return monthNames[month - 1] || '';
  }

  // Removed getAvailableYears() and getAvailableMonths() methods
  // Now using pre-computed arrays: availableYears and availableMonths

  // View switching
  switchToCreateView(): void {
    this.currentView = 'create';
    // Set default month to invoice month if not already selected
    if (!this.selectedMonth) {
      this.selectedMonth = this.invoiceMonth;
    }
    
    console.log('Selected month for new expense:', this.selectedMonth);
    // No need to patch form - we'll use selectedMonth directly
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

      // Get selected month for expense creation
      const selectedMonth = this.selectedMonth || this.invoiceMonth;
      
      // Validate selected month
      if (!selectedMonth || !selectedMonth.year || !selectedMonth.month) {
        console.error('Invalid selected month for expense creation:', selectedMonth);
        throw new Error('Nieprawidłowy miesiąc dla wydatku');
      }
      
      console.log('Creating expense for month:', selectedMonth);
      const expenseDate = new Date(selectedMonth.year, selectedMonth.month - 1, 1);
      
      // Validate created date
      if (isNaN(expenseDate.getTime())) {
        console.error('Invalid expense date created:', expenseDate, 'from month:', selectedMonth);
        throw new Error('Nie można utworzyć poprawnej daty dla wydatku');
      }

      // Create expense request with selected month date
      const createRequest: CreateExpenseRequest = {
        name: formValue.name,
        description: formValue.description || undefined,
        type: formValue.type,
        cyclic: formValue.cyclic || false,
        category: formValue.category,
        tags: tags,
        createdAt: expenseDate.toISOString() // Use selected month date for expense
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

  // Check if current expense type is VARIABLE (to hide cyclic option)
  get isVariableType(): boolean {
    return this.createExpenseForm.get('type')?.value === 'VARIABLE';
  }
}
