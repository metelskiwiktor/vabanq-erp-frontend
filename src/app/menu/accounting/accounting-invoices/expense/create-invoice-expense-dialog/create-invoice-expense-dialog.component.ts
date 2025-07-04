// create-expense-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {CostInvoice} from "../../../../../utility/service/cost-invoice.service";

export interface CreateExpenseDialogData {
  invoice: CostInvoice;
}

export interface CreateExpenseFormData {
  name: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  month?: number;
  year?: number;
  expenseDate?: string;
  description?: string;
  tags?: string[];
  isRecurring?: boolean;
}

@Component({
  selector: 'app-create-expense-dialog',
  templateUrl: './create-invoice-expense-dialog.component.html',
  styleUrls: ['./create-invoice-expense-dialog.component.css']
})
export class CreateInvoiceExpenseDialogComponent implements OnInit {
  // @ts-ignore
  expenseForm: FormGroup;
  invoice: CostInvoice;
  isRecurring = false;

  // Form options
  typeOptions = [
    { value: 'FIXED', label: 'Stały' },
    { value: 'VARIABLE', label: 'Zmienny' }
  ];

  categoryOptions = [
    { value: 'MATERIALS', label: 'Materiały' },
    { value: 'OFFICE', label: 'Biuro' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITIES', label: 'Media' },
    { value: 'SERVICES', label: 'Usługi' },
    { value: 'OTHER', label: 'Inne' }
  ];

  monthOptions = [
    { value: 1, label: 'Styczeń' },
    { value: 2, label: 'Luty' },
    { value: 3, label: 'Marzec' },
    { value: 4, label: 'Kwiecień' },
    { value: 5, label: 'Maj' },
    { value: 6, label: 'Czerwiec' },
    { value: 7, label: 'Lipiec' },
    { value: 8, label: 'Sierpień' },
    { value: 9, label: 'Wrzesień' },
    { value: 10, label: 'Październik' },
    { value: 11, label: 'Listopad' },
    { value: 12, label: 'Grudzień' }
  ];

  yearOptions = [
    { value: 2023, label: '2023' },
    { value: 2024, label: '2024' },
    { value: 2025, label: '2025' }
  ];

  constructor(
    public dialogRef: MatDialogRef<CreateInvoiceExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateExpenseDialogData,
    private fb: FormBuilder
  ) {
    this.invoice = data.invoice;
    this.initForm();
  }

  ngOnInit(): void {
    // Pre-fill form with invoice data if applicable
    this.prefillFormWithInvoiceData();

    // Watch for type changes
    this.expenseForm.get('type')?.valueChanges.subscribe(type => {
      this.onTypeChange(type);
    });
  }

  private initForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const todayString = currentDate.toISOString().split('T')[0];

    this.expenseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      type: ['', Validators.required],
      category: ['', Validators.required],
      month: [currentMonth, Validators.required],
      year: [currentYear, Validators.required],
      expenseDate: [todayString, Validators.required],
      description: [''],
      tags: ['']
    });
  }

  private prefillFormWithInvoiceData(): void {
    // Try to suggest category based on invoice category
    const categoryMapping: { [key: string]: string } = {
      'GOODS_OR_MATERIALS_PURCHASE': 'MATERIALS',
      'ELECTRONIC_SERVICES': 'SERVICES',
      'ACCOUNTING_SERVICES': 'SERVICES',
      'HOUSING_FEES': 'UTILITIES',
      'OTHER': 'OTHER'
    };

    const suggestedCategory = categoryMapping[this.invoice.category || ''] || 'OTHER';

    // Pre-fill form
    this.expenseForm.patchValue({
      name: this.generateExpenseName(),
      category: suggestedCategory,
      description: this.invoice.description !== 'null' ? this.invoice.description : ''
    });
  }

  private generateExpenseName(): string {
    const currentDate = new Date();
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];

    const month = monthNames[currentDate.getMonth()];
    const year = currentDate.getFullYear();

    // Try to create a meaningful name based on invoice
    if (this.invoice.description && this.invoice.description !== 'null') {
      return `${this.invoice.description} - ${month} ${year}`;
    } else if (this.invoice.sellerName && this.invoice.sellerName !== 'null') {
      return `Wydatek ${this.invoice.sellerName} - ${month} ${year}`;
    } else {
      return `Wydatek - ${month} ${year}`;
    }
  }

  onTypeChange(type: string): void {
    const monthControl = this.expenseForm.get('month');
    const yearControl = this.expenseForm.get('year');
    const expenseDateControl = this.expenseForm.get('expenseDate');

    if (type === 'VARIABLE') {
      // For variable expenses, use specific date
      monthControl?.clearValidators();
      yearControl?.clearValidators();
      expenseDateControl?.setValidators([Validators.required]);
    } else if (type === 'FIXED') {
      // For fixed expenses, use month/year
      monthControl?.setValidators([Validators.required]);
      yearControl?.setValidators([Validators.required]);
      expenseDateControl?.clearValidators();
    }

    monthControl?.updateValueAndValidity();
    yearControl?.updateValueAndValidity();
    expenseDateControl?.updateValueAndValidity();
  }

  toggleRecurring(): void {
    this.isRecurring = !this.isRecurring;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.expenseForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.expenseForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'To pole jest wymagane';
      }
      if (field.errors['minlength']) {
        return `Minimalna długość: ${field.errors['minlength'].requiredLength} znaków`;
      }
    }
    return '';
  }

  createExpense(): void {
    if (this.expenseForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.expenseForm.markAllAsTouched();
      return;
    }

    const formValue = this.expenseForm.value;

    // Parse tags
    const tags = formValue.tags ?
      formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) :
      [];

    const expenseData: CreateExpenseFormData = {
      name: formValue.name,
      type: formValue.type,
      category: formValue.category,
      description: formValue.description || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isRecurring: this.isRecurring
    };

    // Add date fields based on type
    if (formValue.type === 'VARIABLE') {
      expenseData.expenseDate = formValue.expenseDate;
    } else {
      expenseData.month = formValue.month;
      expenseData.year = formValue.year;
    }

    this.dialogRef.close(expenseData);
  }

  cancel(): void {
    this.dialogRef.close();
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
    const categoryMap: { [key: string]: string } = {
      'HOUSING_FEES': 'Opłaty mieszkaniowe',
      'ELECTRONIC_SERVICES': 'Usługi elektroniczne',
      'ACCOUNTING_SERVICES': 'Usługi księgowe',
      'ENTREPRENEUR_EXPENSES': 'Wydatki przedsiębiorcy',
      'SALARY': 'Wynagrodzenie',
      'EMPLOYEE_SOCIAL_SECURITY': 'ZUS za pracownika',
      'GOODS_OR_MATERIALS_PURCHASE': 'Zakup towarów i/lub materiałów',
      'NONE': 'Brak przypisanej kategorii',
      'OTHER': 'Inne'
    };
    return categoryMap[category] || 'Nieznana kategoria';
  }

  get isFixedExpense(): boolean {
    return this.expenseForm.get('type')?.value === 'FIXED';
  }

  get isVariableExpense(): boolean {
    return this.expenseForm.get('type')?.value === 'VARIABLE';
  }
}
