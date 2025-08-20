// accounting-invoices.component.ts - Updated with per-month synchronization
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

interface InvoiceAssignmentStatus {
  [invoiceId: string]: {
    isAssigned: boolean;
    expenseId?: string;
    expenseName?: string;
  };
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
  maxSynchronizeAttempts: number = 15; // Increased for per-month sync
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

  // Load invoice assignment statuses using new endpoint
  loadInvoiceAssignmentStatuses(): void {
    if (this.invoices.length === 0) return;

    // Reset assignment status
    this.invoiceAssignmentStatus = {};

    // Use current month filter as default
    const targetDate = this.useCustomDateRange && this.dateFrom ? this.dateFrom : this.selectedMonth;
    const yearMonth = this.costInvoiceService.formatToYearMonth(targetDate);

    // Load all expenses with invoices from all months
    this.expenseService.findExpensesWithInvoices(yearMonth).subscribe({
      next: (expensesWithInvoices) => {
        // Build a map of invoice ID to expense info
        const invoiceToExpenseMap = new Map<string, { expenseId: string; expenseName: string }>();

        expensesWithInvoices.forEach(expense => {
          expense.invoices.forEach(invoice => {
            invoiceToExpenseMap.set(invoice.id, {
              expenseId: expense.id,
              expenseName: expense.name
            });
          });
        });

        // Update assignment status for current invoices
        this.invoices.forEach(invoice => {
          const assignmentInfo = invoiceToExpenseMap.get(invoice.id);
          this.invoiceAssignmentStatus[invoice.id] = {
            isAssigned: !!assignmentInfo,
            expenseId: assignmentInfo?.expenseId,
            expenseName: assignmentInfo?.expenseName
          };
        });
      },
      error: (error) => {
        console.error('Error loading invoice assignment statuses:', error);
        // Initialize empty status for all invoices
        this.invoices.forEach(invoice => {
          this.invoiceAssignmentStatus[invoice.id] = {
            isAssigned: false
          };
        });
      }
    });
  }

  // Check if invoice is assigned to an expense
  isInvoiceAssigned(invoice: CostInvoice): boolean {
    return this.invoiceAssignmentStatus[invoice.id]?.isAssigned || false;
  }

  getAssignedExpenseId(invoice: CostInvoice): string | undefined {
    return this.invoiceAssignmentStatus[invoice.id]?.expenseId;
  }

  getAssignedExpenseName(invoice: CostInvoice): string | undefined {
    return this.invoiceAssignmentStatus[invoice.id]?.expenseName;
  }

  // Generate Infakt URL for invoice
  getInfaktUrl(invoice: CostInvoice): string {
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

  // Updated synchronization with month parameter
  synchronizeWithInfakt(): void {
    const infaktApiKey = this.getInfaktApiKey();

    if (!infaktApiKey) {
      this.snackBar.open('Brak klucza API Infakt. Skonfiguruj integrację w ustawieniach.', 'Zamknij', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Get target month for synchronization
    const targetDate = this.useCustomDateRange && this.dateFrom ? this.dateFrom : this.selectedMonth;
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;

    // Check if trying to synchronize future month
    if (this.costInvoiceService.isMonthInFuture(targetYear, targetMonth)) {
      this.snackBar.open(
        'Nie można synchronizować przyszłych miesięcy. Wybierz miesiąc do aktualnej daty włącznie.',
        'Zamknij',
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
      return;
    }

    const yearMonthString = this.costInvoiceService.formatToYearMonth(targetDate);
    const displayMonth = this.costInvoiceService.parseYearMonthToDisplayName(yearMonthString);

    this.isSynchronizing = true;
    this.synchronizeAttempts = 0;
    this.lastKnownTotalElements = this.totalElements;

    this.snackBar.open(`Rozpoczynanie synchronizacji dla: ${displayMonth}`, 'Zamknij', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });

    this.costInvoiceService.synchronizeCosts(infaktApiKey, yearMonthString).subscribe({
      next: (response) => {
        console.log('Synchronization started for month:', yearMonthString);
        this.startSynchronizationPolling(yearMonthString, displayMonth);
      },
      error: (error) => {
        console.error('Synchronization error:', error);
        let errorMessage = 'Błąd podczas synchronizacji z Infakt';

        if (error.error?.message) {
          errorMessage += ': ' + error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Nieprawidłowe parametry synchronizacji';
        } else if (error.status === 401) {
          errorMessage = 'Nieprawidłowy klucz API Infakt';
        } else if (error.status === 403) {
          errorMessage = 'Brak uprawnień do synchronizacji danych';
        }

        this.snackBar.open(errorMessage, 'Zamknij', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.isSynchronizing = false;
      }
    });
  }

  private startSynchronizationPolling(yearMonth: string, displayMonth: string): void {
    this.synchronizeInterval = setInterval(() => {
      this.synchronizeAttempts++;

      // Load current page to check for new invoices
      this.costInvoiceService.getCostInvoices(
        this.currentPage,
        this.pageSize,
        this.filterText || undefined,
        this.filterCurrency || undefined,
        this.filterCategory || undefined,
        this.useCustomDateRange ? this.dateFrom || undefined :
          new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1),
        this.useCustomDateRange ? this.dateTo || undefined :
          new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0)
      ).subscribe({
        next: (response) => {
          const hasNewData = response.totalElements > this.lastKnownTotalElements;
          const maxAttemptsReached = this.synchronizeAttempts >= this.maxSynchronizeAttempts;

          if (hasNewData || maxAttemptsReached) {
            this.stopSynchronizationPolling();

            if (hasNewData) {
              const newInvoicesCount = response.totalElements - this.lastKnownTotalElements;
              this.snackBar.open(
                `Synchronizacja ${displayMonth} zakończona. Pobrano ${newInvoicesCount} nowych faktur.`,
                'Zamknij',
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
            } else {
              this.snackBar.open(
                `Synchronizacja ${displayMonth} zakończona bez nowych danych.`,
                'Zamknij',
                { duration: 3000 }
              );
            }

            this.loadInvoices();
          }
        },
        error: (error) => {
          console.error('Error during synchronization polling:', error);
          this.stopSynchronizationPolling();
          this.snackBar.open('Błąd podczas sprawdzania statusu synchronizacji', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }, 2000); // Check every 2 seconds
  }

  private stopSynchronizationPolling(): void {
    if (this.synchronizeInterval) {
      clearInterval(this.synchronizeInterval);
      this.synchronizeInterval = null;
    }
    this.isSynchronizing = false;
    this.synchronizeAttempts = 0;
  }

  // Check if current month can be synchronized
  canSynchronizeCurrentMonth(): boolean {
    const targetDate = this.useCustomDateRange && this.dateFrom ? this.dateFrom : this.selectedMonth;
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;

    return !this.costInvoiceService.isMonthInFuture(targetYear, targetMonth);
  }

  // Get synchronization button text
  getSynchronizeButtonText(): string {
    if (this.isSynchronizing) {
      const targetDate = this.useCustomDateRange && this.dateFrom ? this.dateFrom : this.selectedMonth;
      const displayMonth = this.costInvoiceService.parseYearMonthToDisplayName(
        this.costInvoiceService.formatToYearMonth(targetDate)
      );
      return `Synchronizowanie ${displayMonth}... (${this.synchronizeAttempts}/${this.maxSynchronizeAttempts})`;
    }

    if (!this.canSynchronizeCurrentMonth()) {
      return 'Nie można synchronizować';
    }

    const targetDate = this.useCustomDateRange && this.dateFrom ? this.dateFrom : this.selectedMonth;
    const displayMonth = this.costInvoiceService.parseYearMonthToDisplayName(
      this.costInvoiceService.formatToYearMonth(targetDate)
    );
    return `Synchronizuj ${displayMonth}`;
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

  // Actions
  openExpenseDialog(invoice: CostInvoice): void {
    console.log('openExpenseDialog called with invoice:', invoice);
    
    try {
      const currentExpenseId = this.getAssignedExpenseId(invoice);
      console.log('Current expense ID:', currentExpenseId);
      
      // If there's a current expense, get its month to pre-select in dialog
      if (currentExpenseId) {
        this.expenseService.getExpense(currentExpenseId).subscribe({
          next: (expense) => {
            console.log('Loaded current expense:', expense);
            
            // Extract month from expense createdAt
            const expenseDate = new Date(expense.createdAt);
            const targetMonth = {
              year: expenseDate.getFullYear(),
              month: expenseDate.getMonth() + 1
            };
            
            const dialogData: AssignInvoiceDialogData = {
              invoice: invoice,
              currentExpenseId: currentExpenseId,
              targetMonth: targetMonth
            };
            
            this.openDialog(dialogData);
          },
          error: (error) => {
            console.error('Error loading current expense:', error);
            // Fallback to dialog without target month
            const dialogData: AssignInvoiceDialogData = {
              invoice: invoice,
              currentExpenseId: currentExpenseId
            };
            
            this.openDialog(dialogData);
          }
        });
      } else {
        // No current expense, open dialog without target month
        const dialogData: AssignInvoiceDialogData = {
          invoice: invoice,
          currentExpenseId: currentExpenseId
        };
        
        this.openDialog(dialogData);
      }
      
      console.log('openExpenseDialog completed successfully');
    } catch (error) {
      console.error('Error in openExpenseDialog:', error);
    }
  }

  private openDialog(dialogData: AssignInvoiceDialogData): void {
    console.log('Dialog data prepared:', dialogData);

    console.log('Opening dialog...');
    const dialogRef = this.dialog.open(AssignInvoiceDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: dialogData,
      panelClass: ['custom-dialog-panel', 'expense-dialog'],
      disableClose: false,
      autoFocus: false
    });

    console.log('Dialog opened, setting up afterClosed subscription...');
    dialogRef.afterClosed().subscribe(result => {
      console.log('Dialog closed with result:', result);
      if (result?.success) {
        console.log('Invoice assignment result:', result);

        this.snackBar.open(
          result.action === 'created'
            ? 'Wydatek został utworzony i faktura została przypisana'
            : 'Faktura została przypisana do wydatku',
          'Zamknij',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );

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
