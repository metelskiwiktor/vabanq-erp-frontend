// src/app/menu/accounting/accounting-expenses/create-expense-dialog/create-expense-dialog.component.ts
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ExpenseService,
  CreateExpenseRequest,
  CreateExpenseItemRequest,
  UpdateExpenseRequest,
  UpdateExpenseItemRequest,
  ExpenseCategory,
  ExpenseResponse,
  ExpenseEntry
} from '../../../../utility/service/expense.service';

interface ExpenseItemForm {
  id?: string; // Add id for existing items
  name: string;
  netAmount: number;
  grossAmount: number;
  taxPercentage: number;
  autoCalculate: boolean;
  costInvoiceId?: string; // For invoice items
  isInvoiceItem?: boolean; // Flag to identify invoice items
}

export interface CreateExpenseDialogData {
  mode: 'create' | 'edit';
  expenseId?: string;
  initialData?: Partial<ExpenseResponse>;
}

@Component({
  selector: 'app-create-expense-dialog',
  templateUrl: './create-expense-dialog.component.html',
  styleUrls: ['./create-expense-dialog.component.css']
})
export class CreateExpenseDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  expenseForm!: FormGroup;
  isCreating = false;
  isLoading = false;

  // Dialog mode
  isEditMode = false;
  expenseId?: string;
  originalExpense?: ExpenseResponse;

  // Available options
  typeOptions = [
    { value: 'FIXED', label: 'Stały' },
    { value: 'VARIABLE', label: 'Zmienny' }
  ];

  categoryOptions: { key: ExpenseCategory; displayName: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateExpenseDialogData,
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
    this.isEditMode = data?.mode === 'edit';
    this.expenseId = data?.expenseId;
  }

  ngOnInit(): void {
    this.categoryOptions = this.expenseService.getAvailableCategories();

    if (this.isEditMode && this.expenseId) {
      this.loadExpenseForEdit();
    } else {
      this.prefillWithDefaults();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      category: ['', Validators.required],
      description: [''],
      tags: [''],
      cyclic: [false],
      items: this.fb.array([])
    });
  }

  private loadExpenseForEdit(): void {
    if (!this.expenseId) return;

    this.isLoading = true;

    this.expenseService.getExpense(this.expenseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (expense: ExpenseResponse) => {
          this.originalExpense = expense;
          this.populateFormWithExpense(expense);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading expense for edit:', error);
          this.snackBar.open('Błąd podczas ładowania wydatku', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
          this.dialogRef.close({ success: false });
        }
      });
  }

  private populateFormWithExpense(expense: ExpenseResponse): void {
    // Populate basic fields
    this.expenseForm.patchValue({
      name: expense.name,
      type: expense.type,
      category: expense.category,
      description: expense.description || '',
      tags: expense.tags ? expense.tags.join(', ') : '',
      cyclic: expense.cyclic
    });

    // Clear existing items and add loaded items
    this.itemsFormArray.clear();

    if (expense.items && expense.items.length > 0) {
      expense.items.forEach(item => {
        this.addExpenseItemFromData(item);
      });
    }

    // If no items exist, don't add any - allow empty expenses
  }

  private addExpenseItemFromData(item: ExpenseEntry): void {
    const isInvoiceItem = !!item.costInvoiceId;

    const itemForm = this.fb.group({
      id: [item.id],
      name: [item.name, [Validators.required, Validators.minLength(2)]],
      netAmount: [item.netAmount, [Validators.required, Validators.min(0.01)]],
      grossAmount: [item.grossAmount, [Validators.required, Validators.min(0.01)]],
      taxPercentage: [this.calculateTaxPercentage(item.netAmount, item.grossAmount), [Validators.required, Validators.min(0), Validators.max(100)]],
      autoCalculate: [!isInvoiceItem], // Invoice items should not auto-calculate
      costInvoiceId: [item.costInvoiceId || null],
      isInvoiceItem: [isInvoiceItem]
    });

    // Only setup tax calculations for non-invoice items
    if (!isInvoiceItem) {
      this.setupTaxCalculations(itemForm);
    } else {
      // Disable form controls for invoice items
      itemForm.get('netAmount')?.disable();
      itemForm.get('grossAmount')?.disable();
      itemForm.get('taxPercentage')?.disable();
      itemForm.get('autoCalculate')?.disable();
    }

    this.itemsFormArray.push(itemForm);
  }

  private calculateTaxPercentage(netAmount: number, grossAmount: number): number {
    if (netAmount <= 0) return 23; // Default VAT
    const taxAmount = grossAmount - netAmount;
    return Math.round((taxAmount / netAmount) * 100);
  }

  private prefillWithDefaults(): void {
    const currentDate = new Date();
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];

    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    this.expenseForm.patchValue({
      name: `Wydatek - ${month} ${year}`,
      type: 'VARIABLE',
      category: ExpenseCategory.OTHER
    });

    // Add one default item for create mode
    this.addExpenseItem();
  }

  get itemsFormArray(): FormArray {
    return this.expenseForm.get('items') as FormArray;
  }

  get expenseItems(): FormGroup[] {
    return this.itemsFormArray.controls as FormGroup[];
  }

  addExpenseItem(): void {
    const itemForm = this.fb.group({
      id: [null], // No ID for new items
      name: ['', [Validators.required, Validators.minLength(2)]],
      netAmount: [0, [Validators.required, Validators.min(0.01)]],
      grossAmount: [0, [Validators.required, Validators.min(0.01)]],
      taxPercentage: [23, [Validators.required, Validators.min(0), Validators.max(100)]],
      autoCalculate: [true],
      costInvoiceId: [null],
      isInvoiceItem: [false]
    });

    this.setupTaxCalculations(itemForm);
    this.itemsFormArray.push(itemForm);
  }

  private setupTaxCalculations(itemForm: FormGroup): void {
    let isCalculating = false;

    // Calculate gross amount when net amount or tax percentage changes
    itemForm.get('netAmount')?.valueChanges.subscribe(netAmount => {
      if (isCalculating || !itemForm.get('autoCalculate')?.value || itemForm.get('isInvoiceItem')?.value) return;

      const taxPercentage = itemForm.get('taxPercentage')?.value || 23;
      if (netAmount && netAmount > 0 && taxPercentage >= 0) {
        isCalculating = true;
        const multiplier = 1 + (taxPercentage / 100);
        const grossAmount = Number((netAmount * multiplier).toFixed(2));
        itemForm.get('grossAmount')?.setValue(grossAmount, { emitEvent: false });
        isCalculating = false;
      }
    });

    // Calculate net amount when gross amount changes
    itemForm.get('grossAmount')?.valueChanges.subscribe(grossAmount => {
      if (isCalculating || !itemForm.get('autoCalculate')?.value || itemForm.get('isInvoiceItem')?.value) return;

      const taxPercentage = itemForm.get('taxPercentage')?.value || 23;
      if (grossAmount && grossAmount > 0 && taxPercentage >= 0) {
        isCalculating = true;
        const multiplier = 1 + (taxPercentage / 100);
        const netAmount = Number((grossAmount / multiplier).toFixed(2));
        itemForm.get('netAmount')?.setValue(netAmount, { emitEvent: false });
        isCalculating = false;
      }
    });

    // Recalculate when tax percentage changes
    itemForm.get('taxPercentage')?.valueChanges.subscribe(taxPercentage => {
      if (isCalculating || !itemForm.get('autoCalculate')?.value || itemForm.get('isInvoiceItem')?.value) return;

      const netAmount = itemForm.get('netAmount')?.value;
      if (netAmount && netAmount > 0 && taxPercentage >= 0) {
        isCalculating = true;
        const multiplier = 1 + (taxPercentage / 100);
        const grossAmount = Number((netAmount * multiplier).toFixed(2));
        itemForm.get('grossAmount')?.setValue(grossAmount, { emitEvent: false });
        isCalculating = false;
      }
    });
  }

  removeExpenseItem(index: number): void {
    const itemForm = this.itemsFormArray.at(index) as FormGroup;
    const isInvoiceItem = itemForm.get('isInvoiceItem')?.value;

    if (isInvoiceItem) {
      // For invoice items, we'll detach them from the expense
      this.detachInvoiceItem(index);
      return;
    }

    // For manual items, we can always remove them - no minimum required
    this.itemsFormArray.removeAt(index);
  }

  async detachInvoiceItem(index: number): Promise<void> {
    const itemForm = this.itemsFormArray.at(index) as FormGroup;
    const costInvoiceId = itemForm.get('costInvoiceId')?.value;
    const itemId = itemForm.get('id')?.value;

    if (!costInvoiceId || !this.expenseId || !this.isEditMode) {
      // For non-persisted items, just remove from form
      this.itemsFormArray.removeAt(index);
      return;
    }

    try {
      // Call backend to detach invoice
      await this.expenseService.detachInvoiceFromExpense(this.expenseId, costInvoiceId).toPromise();

      // Remove from form array
      this.itemsFormArray.removeAt(index);

      this.snackBar.open('Faktura została odłączona od wydatku', 'Zamknij', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      console.error('Error detaching invoice:', error);
      this.snackBar.open('Błąd podczas odłączania faktury', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  protected getManualItemsCount(): number {
    return this.itemsFormArray.controls.filter(control =>
      !control.get('isInvoiceItem')?.value
    ).length;
  }

  async saveExpense(): Promise<void> {
    if (this.expenseForm.invalid) {
      this.markFormGroupTouched(this.expenseForm);
      return;
    }

    this.isCreating = true;

    try {
      if (this.isEditMode) {
        await this.updateExpense();
      } else {
        await this.createExpense();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      this.snackBar.open(
        this.isEditMode ? 'Błąd podczas aktualizacji wydatku' : 'Błąd podczas tworzenia wydatku',
        'Zamknij',
        {
          duration: 3000,
          panelClass: ['error-snackbar']
        }
      );
      this.isCreating = false;
    }
  }

  private async createExpense(): Promise<void> {
    const formValue = this.expenseForm.value;
    const tags = this.parseTags(formValue.tags);

    const createRequest: CreateExpenseRequest = {
      name: formValue.name,
      description: formValue.description || undefined,
      type: formValue.type,
      cyclic: formValue.cyclic || false,
      category: formValue.category,
      tags: tags
    };

    const createdExpense = await this.expenseService.createExpense(createRequest).toPromise();

    if (!createdExpense) {
      throw new Error('Failed to create expense');
    }

    // Add manual items only
    const items: ExpenseItemForm[] = formValue.items;
    for (const item of items) {
      if (!item.isInvoiceItem && item.name && item.netAmount > 0 && item.grossAmount > 0) {
        const itemRequest: CreateExpenseItemRequest = {
          name: item.name,
          netAmount: Number(item.netAmount),
          grossAmount: Number(item.grossAmount)
        };

        await this.expenseService.addManualItem(createdExpense.id, itemRequest).toPromise();
      }
    }

    this.snackBar.open('Wydatek został utworzony pomyślnie', 'Zamknij', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    this.dialogRef.close({ success: true, expense: createdExpense, action: 'created' });
  }

  private async updateExpense(): Promise<void> {
    if (!this.expenseId || !this.originalExpense) return;

    const formValue = this.expenseForm.value;
    const tags = this.parseTags(formValue.tags);

    // Update basic expense info
    const updateRequest: UpdateExpenseRequest = {
      name: formValue.name,
      description: formValue.description || undefined,
      type: formValue.type,
      cyclic: formValue.cyclic || false,
      category: formValue.category
    };

    await this.expenseService.updateExpense(this.expenseId, updateRequest).toPromise();

    // Handle item updates
    const items: ExpenseItemForm[] = formValue.items;
    const originalItems = this.originalExpense.items || [];

    for (const item of items) {
      if (item.isInvoiceItem) {
        // Skip invoice items - they cannot be modified here
        continue;
      }

      if (item.id) {
        // Update existing manual item
        const updateItemRequest: UpdateExpenseItemRequest = {
          name: item.name,
          netAmount: Number(item.netAmount),
          grossAmount: Number(item.grossAmount)
        };

        await this.expenseService.updateExpenseItem(this.expenseId, item.id, updateItemRequest).toPromise();
      } else {
        // Add new manual item
        if (item.name && item.netAmount > 0 && item.grossAmount > 0) {
          const createItemRequest: CreateExpenseItemRequest = {
            name: item.name,
            netAmount: Number(item.netAmount),
            grossAmount: Number(item.grossAmount)
          };

          await this.expenseService.addManualItem(this.expenseId, createItemRequest).toPromise();
        }
      }
    }

    // Check for deleted manual items
    const currentItemIds = items.filter(item => item.id).map(item => item.id);
    const deletedItems = originalItems.filter(originalItem =>
      !originalItem.costInvoiceId && // Only manual items
      !currentItemIds.includes(originalItem.id)
    );

    for (const deletedItem of deletedItems) {
      await this.expenseService.deleteExpenseItem(this.expenseId, deletedItem.id).toPromise();
    }

    this.snackBar.open('Wydatek został zaktualizowany pomyślnie', 'Zamknij', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    this.dialogRef.close({ success: true, action: 'updated' });
  }

  private parseTags(tagsString: string): string[] {
    return tagsString ?
      tagsString.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) :
      [];
  }

  cancel(): void {
    this.dialogRef.close({ success: false });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // Form validation helpers
  hasFieldError(fieldName: string, itemIndex?: number): boolean {
    if (itemIndex !== undefined) {
      const itemGroup = this.itemsFormArray.at(itemIndex) as FormGroup;
      const field = itemGroup.get(fieldName);
      return !!(field?.errors && field.touched);
    }

    const field = this.expenseForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  getFieldError(fieldName: string, itemIndex?: number): string {
    if (itemIndex !== undefined) {
      const itemGroup = this.itemsFormArray.at(itemIndex) as FormGroup;
      const field = itemGroup.get(fieldName);
      if (field?.errors && field.touched) {
        if (field.errors['required']) return 'To pole jest wymagane';
        if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} znaków`;
        if (field.errors['min']) return `Minimalna wartość: ${field.errors['min'].min}`;
        if (field.errors['max']) return `Maksymalna wartość: ${field.errors['max'].max}`;
      }
      return '';
    }

    const field = this.expenseForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return 'To pole jest wymagane';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} znaków`;
    }
    return '';
  }

  // Utility methods
  formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  getTotalNetAmount(): number {
    return this.itemsFormArray.controls.reduce((total, control) => {
      const netAmount = control.get('netAmount')?.value || 0;
      return total + Number(netAmount);
    }, 0);
  }

  getTotalGrossAmount(): number {
    return this.itemsFormArray.controls.reduce((total, control) => {
      const grossAmount = control.get('grossAmount')?.value || 0;
      return total + Number(grossAmount);
    }, 0);
  }

  getTotalTaxAmount(): number {
    return this.getTotalGrossAmount() - this.getTotalNetAmount();
  }

  // Check if item has auto-calculation enabled and is not invoice item
  isAutoCalculateEnabled(index: number): boolean {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    const autoCalculate = itemGroup.get('autoCalculate')?.value || false;
    const isInvoiceItem = itemGroup.get('isInvoiceItem')?.value || false;
    return autoCalculate && !isInvoiceItem;
  }

  // Check if item is from invoice
  isItemFromInvoice(index: number): boolean {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    return itemGroup.get('isInvoiceItem')?.value || false;
  }

  // Check if item can be removed - Updated to allow removing all items
  canRemoveItem(index: number): boolean {
    // All items can be removed now - no minimum requirements
    return true;
  }

  // Toggle auto-calculation for specific item
  toggleAutoCalculate(index: number): void {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    const currentValue = itemGroup.get('autoCalculate')?.value;
    const isInvoiceItem = itemGroup.get('isInvoiceItem')?.value;

    if (!isInvoiceItem) {
      itemGroup.get('autoCalculate')?.setValue(!currentValue);
    }
  }

  get canSave(): boolean {
    return this.expenseForm.valid && !this.isCreating;
  }

  get isFixedExpense(): boolean {
    return this.expenseForm.get('type')?.value === 'FIXED';
  }

  get isVariableExpense(): boolean {
    return this.expenseForm.get('type')?.value === 'VARIABLE';
  }

  get dialogTitle(): string {
    return this.isEditMode ? 'Edytuj wydatek' : 'Utwórz nowy wydatek';
  }

  get dialogSubtitle(): string {
    return this.isEditMode ?
      'Edytuj informacje o wydatku i jego pozycje' :
      'Dodaj wydatek z pozycjami manualnymi';
  }

  get saveButtonText(): string {
    if (this.isCreating) {
      return this.isEditMode ? 'Aktualizowanie...' : 'Tworzenie...';
    }
    return this.isEditMode ? 'Zaktualizuj wydatek' : 'Utwórz wydatek';
  }
}
