// accounting-invoices.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import {CostInvoice, CostInvoiceService, CostInvoiceCategory, CostInvoicePage} from "../../../utility/service/cost-invoice.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {
  AssignInvoiceDialogComponent,
  AssignInvoiceDialogData
} from "./expense/assign-invoice-dialog/assign-invoice-dialog.component";
import { ExpenseService } from '../../../utility/service/expense.service';

interface CurrencyTotal {
  currency: string;
  netTotal: number;
  grossTotal: number;
}

interface InvoiceAssignmentStatus {
  [invoiceId: string]: boolean;
}

@Component({
  selector: 'app-accounting-invoices',
  templateUrl: './accounting-invoices.component.html',
  styleUrls: ['./accounting-invoices.component.css']
})
export class AccountingInvoicesComponent implements OnInit, OnDestroy {
  invoices: CostInvoice[] = [];
  invoiceAssignmentStatus: InvoiceAssignmentStatus = {};

  // Pagination - controlled by backend
  currentPage: number = 0;
  pageSize: number = 15;
  totalElements: number = 0;
  totalPages: number = 0;
  pageSizeOptions: number[] = [15, 30, 50];

  // Loading states
  isLoading: boolean = false;
  isSynchronizing: boolean = false;
  synchronizeAttempts: number = 0;
  maxSynchronizeAttempts: number = 10;
  synchronizeInterval: any;
  lastKnownTotalElements: number = 0;

  // Filters
  filterText: string = '';
  filterCategory: CostInvoiceCategory | '' = '';
  filterCurrency: string = '';
  selectedMonth: Date = new Date();

  // Custom date range filters
  dateFrom: Date | null = null;
  dateTo: Date | null = null;
  useCustomDateRange: boolean = false;

  // Helper properties for date inputs
  get dateFromString(): string {
    return this.dateFrom ? this.dateFrom.toISOString().split('T')[0] : '';
  }

  get dateToString(): string {
    return this.dateTo ? this.dateTo.toISOString().split('T')[0] : '';
  }

  // Search debounce
  searchTimeout: any;

  constructor(
    private costInvoiceService: CostInvoiceService,
    private expenseService: ExpenseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInvoices();
    this.loadInvoiceAssignmentStatuses();
  }

  ngOnDestroy(): void {
    if (this.synchronizeInterval) {
      clearInterval(this.synchronizeInterval);
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // Data loading
  loadInvoices(): void {
    this.isLoading = true;

    const createdFrom = this.useCustomDateRange ? this.dateFrom :
      new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);

    const createdTo = this.useCustomDateRange ? this.dateTo :
      new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);

    this.costInvoiceService.getCostInvoices(
      this.currentPage,
      this.pageSize,
      this.filterText || undefined,
      this.filterCurrency || undefined,
      this.filterCategory || undefined,
      createdFrom || undefined,
      createdTo || undefined
    ).subscribe({
      next: (response: CostInvoicePage) => {
        this.invoices = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.number;
        this.isLoading = false;

        // Load assignment statuses for current invoices
        this.loadInvoiceAssignmentStatuses();
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.snackBar.open('Błąd podczas ładowania faktur', 'Zamknij', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isLoading = false;
      }
    });
  }

  // Load invoice assignment statuses
  loadInvoiceAssignmentStatuses(): void {
    if (this.invoices.length === 0) return;

    // Check which invoices are already assigned to expenses
    // This would require a new endpoint in the backend to check assignment status
    // For now, we'll implement a simple check using the expense service
    this.expenseService.listExpensesForMonth(
      this.useCustomDateRange ?
        { year: this.dateFrom?.getFullYear() || new Date().getFullYear(), month: this.dateFrom?.getMonth() || new Date().getMonth() + 1 } :
        { year: this.selectedMonth.getFullYear(), month: this.selectedMonth.getMonth() + 1 }
    ).subscribe({
      next: (expenses) => {
        const assignedInvoiceIds = new Set<string>();

        expenses.forEach(expense => {
          expense.items?.forEach(item => {
            if (item.costInvoiceId) {
              assignedInvoiceIds.add(item.costInvoiceId);
            }
          });
        });

        // Update assignment status for current invoices
        this.invoiceAssignmentStatus = {};
        this.invoices.forEach(invoice => {
          this.invoiceAssignmentStatus[invoice.id] = assignedInvoiceIds.has(invoice.id);
        });
      },
      error: (error) => {
        console.error('Error loading invoice assignment statuses:', error);
      }
    });
  }

  // Check if invoice is assigned to an expense
  isInvoiceAssigned(invoice: CostInvoice): boolean {
    return !!this.invoiceAssignmentStatus[invoice.id];
  }

  // Generate Infakt URL for invoice
  getInfaktUrl(invoice: CostInvoice): string {
    // This would typically be configured in environment or fetched from backend
    // For now, we'll use a placeholder URL structure
    return `https://app.infakt.pl/app/faktury/koszty/${invoice.id}`;
  }

  private getInfaktApiKey(): string | null {
    const infaktData = localStorage.getItem('infakt-credentials');
    if (infaktData) {
      try {
        const credentials = JSON.parse(infaktData);
        return credentials.apiKey || null;
      } catch (e) {
        console.error('Error parsing Infakt credentials:', e);
        return null;
      }
    }
    return null;
  }

  // Synchronization
  synchronizeWithInfakt(): void {
    // Get API key from local storage or environment
    const infaktApiKey =  this.getInfaktApiKey();

    if (!infaktApiKey) {
      this.snackBar.open('Brak klucza API Infakt. Skonfiguruj integrację w ustawieniach.', 'Zamknij', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    this.isSynchronizing = true;
    this.synchronizeAttempts = 0;
    this.lastKnownTotalElements = this.totalElements;

    this.costInvoiceService.synchronizeCosts(infaktApiKey).subscribe({
      next: (response) => {
        this.startSynchronizationPolling();
      },
      error: (error) => {
        console.error('Synchronization error:', error);
        this.snackBar.open('Błąd podczas synchronizacji z Infakt', 'Zamknij', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.isSynchronizing = false;
      }
    });
  }

  private startSynchronizationPolling(): void {
    this.synchronizeInterval = setInterval(() => {
      this.synchronizeAttempts++;

      this.costInvoiceService.getCostInvoices(0, 1).subscribe({
        next: (response) => {
          if (response.totalElements > this.lastKnownTotalElements ||
            this.synchronizeAttempts >= this.maxSynchronizeAttempts) {
            this.stopSynchronizationPolling();

            if (response.totalElements > this.lastKnownTotalElements) {
              this.snackBar.open(
                `Synchronizacja zakończona. Pobrano ${response.totalElements - this.lastKnownTotalElements} nowych faktur.`,
                'Zamknij',
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
            } else {
              this.snackBar.open('Synchronizacja zakończona bez nowych danych.', 'Zamknij', {
                duration: 3000
              });
            }

            this.loadInvoices();
          }
        },
        error: () => {
          this.stopSynchronizationPolling();
          this.snackBar.open('Błąd podczas sprawdzania statusu synchronizacji', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }, 2000);
  }

  private stopSynchronizationPolling(): void {
    if (this.synchronizeInterval) {
      clearInterval(this.synchronizeInterval);
      this.synchronizeInterval = null;
    }
    this.isSynchronizing = false;
    this.synchronizeAttempts = 0;
  }

  // Date navigation
  previousMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    if (!this.useCustomDateRange) {
      this.currentPage = 0;
      this.loadInvoices();
    }
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    if (!this.useCustomDateRange) {
      this.currentPage = 0;
      this.loadInvoices();
    }
  }

  onCustomDateRangeToggle(): void {
    this.currentPage = 0;
    this.loadInvoices();
  }

  onDateFromChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateFrom = target.value ? new Date(target.value) : null;
    if (this.useCustomDateRange) {
      this.applyFilters();
    }
  }

  onDateToChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.dateTo = target.value ? new Date(target.value) : null;
    if (this.useCustomDateRange) {
      this.applyFilters();
    }
  }

  // Pagination
  changePageSize(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 0;
    this.loadInvoices();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadInvoices();
    }
  }

  getVisiblePages(): number[] {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(0, this.currentPage - delta);
         i <= Math.min(this.totalPages - 1, this.currentPage + delta);
         i++) {
      range.push(i);
    }

    if (range[0] > 1) {
      rangeWithDots.push(0);
      if (range[0] > 2) {
        rangeWithDots.push(-1); // Represents dots
      }
    }

    rangeWithDots.push(...range);

    if (range[range.length - 1] < this.totalPages - 2) {
      if (range[range.length - 1] < this.totalPages - 3) {
        rangeWithDots.push(-1); // Represents dots
      }
      rangeWithDots.push(this.totalPages - 1);
    }

    return rangeWithDots.filter(page => page >= 0);
  }

  // Filter methods
  onFilterTextChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filterText = target.value;
    // Debounce search - only apply after user stops typing for 500ms
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  onCategoryFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filterCategory = target.value as CostInvoiceCategory | '';
    this.applyFilters();
  }

  onCurrencyFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filterCurrency = target.value;
    this.applyFilters();
  }

  clearSearch(): void {
    this.filterText = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.filterText = '';
    this.filterCategory = '';
    this.filterCurrency = '';
    this.selectedMonth = new Date();
    this.dateFrom = null;
    this.dateTo = null;
    this.useCustomDateRange = false;
    this.currentPage = 0;
    this.loadInvoices();
  }

  private applyFilters(): void {
    this.currentPage = 0;
    this.loadInvoices();
  }

  // Actions - Updated to use real API
  openExpenseDialog(invoice: CostInvoice): void {
    const dialogData: AssignInvoiceDialogData = {
      invoice: invoice
    };

    const dialogRef = this.dialog.open(AssignInvoiceDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      panelClass: ['custom-dialog-panel', 'expense-dialog'],
      disableClose: false,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.success) {
        console.log('Invoice assignment result:', result);

        // Show success message
        this.snackBar.open(
          result.action === 'created'
            ? 'Wydatek został utworzony i faktura została przypisana'
            : 'Faktura została przypisana do wydatku',
          'Zamknij',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

        // Reload data to refresh assignment statuses
        this.loadInvoices();
      }
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

  getMonthDisplayName(): string {
    return this.selectedMonth.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long'
    });
  }

  getCategoryDisplayName(category: CostInvoiceCategory | string | undefined): string {
    return this.costInvoiceService.getCategoryDisplayName(category as CostInvoiceCategory);
  }

  getAvailableCategories(): { key: CostInvoiceCategory; displayName: string }[] {
    return this.costInvoiceService.getAvailableCategories();
  }

  // Add Math reference for template
  Math = Math;
}
