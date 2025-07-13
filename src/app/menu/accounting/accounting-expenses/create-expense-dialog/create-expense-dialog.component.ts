// src/app/menu/accounting/accounting-expenses/create-expense-dialog/create-expense-dialog.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ExpenseService,
  CreateExpenseRequest,
  CreateExpenseItemRequest,
  ExpenseCategory
} from '../../../../utility/service/expense.service';

interface ExpenseItemForm {
  name: string;
  netAmount: number;
  grossAmount: number;
  taxPercentage: number; // Added for UI calculations only
  autoCalculate: boolean; // Added for auto-calculation toggle
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

  // Available options
  typeOptions = [
    { value: 'FIXED', label: 'Stały' },
    { value: 'VARIABLE', label: 'Zmienny' }
  ];

  categoryOptions: { key: ExpenseCategory; displayName: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateExpenseDialogComponent>,
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.categoryOptions = this.expenseService.getAvailableCategories();
    this.prefillWithDefaults();
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

    // Add one default item
    this.addExpenseItem();
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
  }

  get itemsFormArray(): FormArray {
    return this.expenseForm.get('items') as FormArray;
  }

  get expenseItems(): FormGroup[] {
    return this.itemsFormArray.controls as FormGroup[];
  }

  addExpenseItem(): void {
    const itemForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      netAmount: [0, [Validators.required, Validators.min(0.01)]],
      grossAmount: [0, [Validators.required, Validators.min(0.01)]],
      taxPercentage: [23, [Validators.required, Validators.min(0), Validators.max(100)]],
      autoCalculate: [true] // New field for auto-calculation toggle
    });

    this.setupTaxCalculations(itemForm);
    this.itemsFormArray.push(itemForm);
  }

  private setupTaxCalculations(itemForm: FormGroup): void {
    let isCalculating = false; // Flag to prevent infinite loops

    // Calculate gross amount when net amount or tax percentage changes
    itemForm.get('netAmount')?.valueChanges.subscribe(netAmount => {
      if (isCalculating || !itemForm.get('autoCalculate')?.value) return;

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
      if (isCalculating || !itemForm.get('autoCalculate')?.value) return;

      const taxPercentage = itemForm.get('taxPercentage')?.value || 23;
      if (grossAmount && grossAmount > 0 && taxPercentage >= 0) {
        isCalculating = true;
        const multiplier = 1 + (taxPercentage / 100);
        const netAmount = Number((grossAmount / multiplier).toFixed(2));
        itemForm.get('netAmount')?.setValue(netAmount, { emitEvent: false });
        isCalculating = false;
      }
    });

    // Recalculate when tax percentage changes (uses net as base)
    itemForm.get('taxPercentage')?.valueChanges.subscribe(taxPercentage => {
      if (isCalculating || !itemForm.get('autoCalculate')?.value) return;

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
    if (this.itemsFormArray.length > 1) {
      this.itemsFormArray.removeAt(index);
    } else {
      this.snackBar.open('Wydatek musi mieć przynajmniej jedną pozycję', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    }
  }

  async createExpense(): Promise<void> {
    if (this.expenseForm.invalid) {
      this.markFormGroupTouched(this.expenseForm);
      return;
    }

    this.isCreating = true;

    try {
      const formValue = this.expenseForm.value;

      // Parse tags
      const tags = formValue.tags ?
        formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) :
        [];

      // Create expense request
      const createRequest: CreateExpenseRequest = {
        name: formValue.name,
        description: formValue.description || undefined,
        type: formValue.type,
        cyclic: formValue.cyclic || false,
        category: formValue.category,
        tags: tags
      };

      // Create the expense
      const createdExpense = await this.expenseService.createExpense(createRequest).toPromise();

      if (!createdExpense) {
        throw new Error('Failed to create expense');
      }

      // Add all manual items
      const items: ExpenseItemForm[] = formValue.items;
      for (const item of items) {
        if (item.name && item.netAmount > 0 && item.grossAmount > 0) {
          const itemRequest: CreateExpenseItemRequest = {
            name: item.name,
            netAmount: Number(item.netAmount),
            grossAmount: Number(item.grossAmount)
            // Note: taxPercentage is not sent to backend - it's only for UI calculations
          };

          await this.expenseService.addManualItem(createdExpense.id, itemRequest).toPromise();
        }
      }

      this.snackBar.open('Wydatek został utworzony pomyślnie', 'Zamknij', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close({ success: true, expense: createdExpense });
    } catch (error) {
      console.error('Error creating expense:', error);
      this.snackBar.open('Błąd podczas tworzenia wydatku', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      this.isCreating = false;
    }
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

  // Check if item has auto-calculation enabled
  isAutoCalculateEnabled(index: number): boolean {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    return itemGroup.get('autoCalculate')?.value || false;
  }

  // Toggle auto-calculation for specific item
  toggleAutoCalculate(index: number): void {
    const itemGroup = this.itemsFormArray.at(index) as FormGroup;
    const currentValue = itemGroup.get('autoCalculate')?.value;
    itemGroup.get('autoCalculate')?.setValue(!currentValue);
  }

  get canCreate(): boolean {
    return this.expenseForm.valid && !this.isCreating && this.itemsFormArray.length > 0;
  }

  get isFixedExpense(): boolean {
    return this.expenseForm.get('type')?.value === 'FIXED';
  }

  get isVariableExpense(): boolean {
    return this.expenseForm.get('type')?.value === 'VARIABLE';
  }
}
