// assign-invoice-to-expense-dialog.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import {CostInvoice} from "../../../../../utility/service/cost-invoice.service";
import {
  CreateInvoiceExpenseDialogComponent
} from "../create-invoice-expense-dialog/create-invoice-expense-dialog.component";

// Interfaces for expenses (adjust based on your actual expense model)
export interface ExpenseItem {
  id: string;
  name: string;
  description?: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  totalCost: number;
  currency: string;
  month?: number;
  year?: number;
  expenseDate?: string;
  tags?: string[];
}

export interface ExpenseDialogData {
  invoice: CostInvoice;
}

export interface ExpenseDialogResult {
  action: 'assign' | 'create';
  expenseId?: string;
  expenseData?: any;
}

@Component({
  selector: 'app-assign-invoice-to-expense-dialog',
  templateUrl: './assign-invoice-to-expense-dialog.component.html',
  styleUrls: ['./assign-invoice-to-expense-dialog.component.css']
})
export class AssignInvoiceToExpenseDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  invoice: CostInvoice;
  expenses: ExpenseItem[] = [];
  filteredExpenses: ExpenseItem[] = [];

  // State
  selectedExpenseId: string | null = null;
  isLoading = false;

  // Filters
  searchText = '';
  filterType = '';
  filterCategory = '';
  filterPeriod = '';

  // Filter options
  typeOptions = [
    { value: '', label: 'Wszystkie' },
    { value: 'FIXED', label: 'Stałe' },
    { value: 'VARIABLE', label: 'Zmienne' }
  ];

  categoryOptions = [
    { value: '', label: 'Wszystkie' },
    { value: 'MATERIALS', label: 'Materiały' },
    { value: 'OFFICE', label: 'Biuro' },
    { value: 'MARKETING', label: 'Marketing' },
    { value: 'UTILITIES', label: 'Media' },
    { value: 'SERVICES', label: 'Usługi' },
    { value: 'OTHER', label: 'Inne' }
  ];

  periodOptions = [
    { value: '', label: 'Wszystkie' },
    { value: 'current_month', label: 'Bieżący miesiąc' },
    { value: 'last_month', label: 'Poprzedni miesiąc' },
    { value: 'last_3_months', label: 'Ostatnie 3 miesiące' }
  ];

  constructor(
    public dialogRef: MatDialogRef<AssignInvoiceToExpenseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseDialogData,
    private dialog: MatDialog
    // Inject your expense service here
    // private expenseService: ExpenseService
  ) {
    this.invoice = data.invoice;
  }

  ngOnInit(): void {
    this.loadExpenses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadExpenses(): void {
    this.isLoading = true;

    // Mock data - replace with actual service call
    setTimeout(() => {
      this.expenses = this.getMockExpenses();
      this.applyFilters();
      this.isLoading = false;
    }, 500);

    // Actual implementation would be:
    // this.expenseService.getExpenses()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (expenses) => {
    //       this.expenses = expenses;
    //       this.applyFilters();
    //       this.isLoading = false;
    //     },
    //     error: (error) => {
    //       console.error('Error loading expenses:', error);
    //       this.isLoading = false;
    //     }
    //   });
  }

  private getMockExpenses(): ExpenseItem[] {
    return [
      {
        id: 'exp-001',
        name: 'Koszty materiałów - Maj 2024',
        description: 'Zakup materiałów do drukarek 3D',
        type: 'FIXED',
        category: 'MATERIALS',
        totalCost: 2450.00,
        currency: 'PLN',
        month: 5,
        year: 2024,
        tags: ['materiały', 'drukarki']
      },
      {
        id: 'exp-002',
        name: 'Zakup sprzętu biurowego',
        description: 'Meble i akcesoria biurowe',
        type: 'VARIABLE',
        category: 'OFFICE',
        totalCost: 890.00,
        currency: 'PLN',
        expenseDate: '2024-05-15',
        tags: ['biuro', 'meble']
      },
      {
        id: 'exp-003',
        name: 'Kampania marketingowa Q2',
        description: 'Reklama online i materiały promocyjne',
        type: 'FIXED',
        category: 'MARKETING',
        totalCost: 3200.00,
        currency: 'PLN',
        month: 4,
        year: 2024,
        tags: ['marketing', 'reklama']
      },
      {
        id: 'exp-004',
        name: 'Serwis drukarek 3D',
        description: 'Przegląd i naprawa urządzeń',
        type: 'VARIABLE',
        category: 'SERVICES',
        totalCost: 567.50,
        currency: 'PLN',
        expenseDate: '2024-05-10',
        tags: ['serwis', 'drukarki']
      },
      {
        id: 'exp-005',
        name: 'Energia elektryczna - Maj',
        description: 'Rachunki za prąd',
        type: 'FIXED',
        category: 'UTILITIES',
        totalCost: 1150.00,
        currency: 'PLN',
        month: 5,
        year: 2024,
        tags: ['media', 'prąd']
      }
    ];
  }

  selectExpense(expenseId: string): void {
    this.selectedExpenseId = expenseId;
  }

  openCreateExpenseDialog(): void {
    const createDialogRef = this.dialog.open(CreateInvoiceExpenseDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: { invoice: this.invoice },
      panelClass: 'custom-dialog-panel'
    });

    createDialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          // Close this dialog and return create result
          this.dialogRef.close({
            action: 'create',
            expenseData: result
          } as ExpenseDialogResult);
        }
      });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredExpenses = this.expenses.filter(expense => {
      // Search filter
      const searchMatch = !this.searchText ||
        expense.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (expense.description && expense.description.toLowerCase().includes(this.searchText.toLowerCase()));

      // Type filter
      const typeMatch = !this.filterType || expense.type === this.filterType;

      // Category filter
      const categoryMatch = !this.filterCategory || expense.category === this.filterCategory;

      // Period filter (simplified for demo)
      const periodMatch = !this.filterPeriod || true; // Implement based on your date logic

      return searchMatch && typeMatch && categoryMatch && periodMatch;
    });
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterType = '';
    this.filterCategory = '';
    this.filterPeriod = '';
    this.applyFilters();
  }

  assignToExpense(): void {
    if (!this.selectedExpenseId) return;

    this.dialogRef.close({
      action: 'assign',
      expenseId: this.selectedExpenseId
    } as ExpenseDialogResult);
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

  getExpenseTypeLabel(type: string): string {
    return type === 'FIXED' ? 'STAŁY' : 'ZMIENNY';
  }

  getCategoryDisplayName(category: string): string {
    const categoryMap: { [key: string]: string } = {
      'MATERIALS': 'Materiały',
      'OFFICE': 'Biuro',
      'MARKETING': 'Marketing',
      'UTILITIES': 'Media',
      'SERVICES': 'Usługi',
      'OTHER': 'Inne'
    };
    return categoryMap[category] || category;
  }

  getExpenseDisplayDate(expense: ExpenseItem): string {
    if (expense.type === 'FIXED' && expense.month && expense.year) {
      const monthNames = [
        'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
      ];
      return `${monthNames[expense.month - 1]} ${expense.year}`;
    } else if (expense.expenseDate) {
      return this.formatDate(expense.expenseDate);
    }
    return '';
  }
}
