import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import {CostInvoice, CostInvoiceService, CostInvoiceCategory, CostInvoicePage} from "../../../utility/service/cost-invoice.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {
  AssignInvoiceDialogComponent,
  AssignInvoiceDialogData
} from "./expense/assign-invoice-dialog/assign-invoice-dialog.component";

interface CurrencyTotal {
  currency: string;
  netTotal: number;
  grossTotal: number;
}

@Component({
  selector: 'app-accounting-invoices',
  templateUrl: './accounting-invoices.component.html',
  styleUrls: ['./accounting-invoices.component.css']
})
export class AccountingInvoicesComponent implements OnInit, OnDestroy {
  invoices: CostInvoice[] = [];

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

  // Available options
  availableCategories: { key: CostInvoiceCategory; displayName: string }[] = [];
  availableCurrencies: string[] = ['PLN', 'EUR', 'CZK', 'HUF'];

  // Search timeout for debouncing
  private searchTimeout: any;

  constructor(
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private costInvoiceService: CostInvoiceService
  ) {}

  ngOnInit(): void {
    this.availableCategories = this.costInvoiceService.getAvailableCategories();
    this.loadInvoices();
  }

  ngOnDestroy(): void {
    if (this.synchronizeInterval) {
      clearInterval(this.synchronizeInterval);
    }
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // Get effective date range for filtering
  private getEffectiveDateRange(): { startDate: Date; endDate: Date } {
    if (this.useCustomDateRange && this.dateFrom && this.dateTo) {
      return {
        startDate: new Date(this.dateFrom),
        endDate: new Date(this.dateTo.getTime() + 24 * 60 * 60 * 1000 - 1) // End of day
      };
    } else {
      // Use selected month
      const startOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0, 23, 59, 59);
      return { startDate: startOfMonth, endDate: endOfMonth };
    }
  }

  // Load invoices from backend with pagination
  loadInvoices(): void {
    this.isLoading = true;

    const { startDate, endDate } = this.getEffectiveDateRange();

    this.costInvoiceService.getCostInvoices(
      this.currentPage,
      this.pageSize,
      this.filterText || undefined,
      this.filterCurrency || undefined,
      this.filterCategory || undefined,
      startDate,
      endDate
    ).subscribe({
      next: (page: CostInvoicePage) => {
        this.invoices = page.content.map(invoice => ({
          ...invoice,
          netPrice: Number(invoice.netPrice),
          grossPrice: Number(invoice.grossPrice)
        }));

        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.currentPage = page.number;
        this.isLoading = false;

        console.log(`Loaded ${this.invoices.length} invoices from page ${this.currentPage + 1}/${this.totalPages}`);
      },
      error: (error) => {
        console.error('Error loading invoices:', error);
        this.isLoading = false;
        this.invoices = [];
        this.totalElements = 0;
        this.totalPages = 0;
      }
    });
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

  // Synchronize invoices with Infakt
  synchronizeInvoices(): void {
    const infaktApiKey = this.getInfaktApiKey();
    if (!infaktApiKey) {
      alert('Brak klucza API Infakt. Skonfiguruj integrację w ustawieniach.');
      return;
    }

    this.isSynchronizing = true;
    this.synchronizeAttempts = 0;
    this.lastKnownTotalElements = this.totalElements;

    this.costInvoiceService.synchronizeCosts(infaktApiKey).subscribe({
      next: () => {
        console.log('Synchronization started');
        this.startSynchronizePolling();
      },
      error: (error) => {
        console.error('Error starting synchronization:', error);
        this.isSynchronizing = false;
        alert('Błąd podczas uruchamiania synchronizacji');
      }
    });
  }

  // Poll for synchronization completion
  startSynchronizePolling(): void {
    this.synchronizeInterval = setInterval(() => {
      this.synchronizeAttempts++;

      if (this.synchronizeAttempts >= this.maxSynchronizeAttempts) {
        this.stopSynchronizePolling();
        return;
      }

      const { startDate, endDate } = this.getEffectiveDateRange();

      this.costInvoiceService.getCostInvoices(
        0, // first page
        this.pageSize,
        this.filterText || undefined,
        this.filterCurrency || undefined,
        this.filterCategory || undefined,
        startDate,
        endDate
      ).subscribe({
        next: (page: CostInvoicePage) => {
          if (page.totalElements !== this.lastKnownTotalElements) {
            // Content changed, reload current view and stop polling
            this.loadInvoices();
            this.stopSynchronizePolling();
            console.log('Synchronization completed, new invoices detected');
          }
        },
        error: (error) => {
          console.error('Error during polling:', error);
        }
      });
    }, 2000); // Check every 2 seconds
  }

  stopSynchronizePolling(): void {
    if (this.synchronizeInterval) {
      clearInterval(this.synchronizeInterval);
      this.synchronizeInterval = null;
    }
    this.isSynchronizing = false;
    this.synchronizeAttempts = 0;
  }

  // Filter and pagination - now handled by backend
  applyFilters(): void {
    // Reset to first page when filters change
    this.currentPage = 0;
    this.loadInvoices();
  }

  // Month navigation
  previousMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.currentPage = 0;
    if (!this.useCustomDateRange) {
      this.loadInvoices();
    }
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.currentPage = 0;
    if (!this.useCustomDateRange) {
      this.loadInvoices();
    }
  }

  // Toggle between month selector and custom date range
  toggleDateRangeMode(): void {
    this.useCustomDateRange = !this.useCustomDateRange;
    if (!this.useCustomDateRange) {
      this.dateFrom = null;
      this.dateTo = null;
    }
    this.applyFilters();
  }

  // Date range change handlers
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

  // Actions
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
          {
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );

        // Optionally reload data if needed
        // this.loadInvoices();
      }
    });
  }

  private assignInvoiceToExpense(invoice: CostInvoice, expenseId: string): void {
    // Tutaj wywołaj swój service do przypisania faktury do wydatku
    // Przykład:
    /*
    this.expenseInvoiceService.assignInvoiceToExpense({
      invoiceId: invoice.id,
      expenseId: expenseId,
      expenseType: 'fixed' // lub 'variable' w zależności od typu wydatku
    }).subscribe({
      next: (response) => {
        this.showSuccessMessage('Faktura została pomyślnie przypisana do wydatku');
        // Opcjonalnie odśwież listę faktur
        this.loadInvoices();
      },
      error: (error) => {
        this.showErrorMessage('Błąd podczas przypisywania faktury do wydatku');
        console.error('Error assigning invoice to expense:', error);
      }
    });
    */

    // Tymczasowa implementacja z mock
    setTimeout(() => {
      this.showSuccessMessage('Faktura została pomyślnie przypisana do wydatku');
    }, 1000);
  }

  private createExpenseAndAssign(invoice: CostInvoice, expenseData: any): void {
    // Tutaj wywołaj swój service do utworzenia wydatku i przypisania faktury
    // Przykład:
    /*
    this.expenseService.createExpense(expenseData).subscribe({
      next: (createdExpense) => {
        // Po utworzeniu wydatku, przypisz do niego fakturę
        this.assignInvoiceToExpense(invoice, createdExpense.id);
      },
      error: (error) => {
        this.showErrorMessage('Błąd podczas tworzenia wydatku');
        console.error('Error creating expense:', error);
      }
    });
    */

    // Tymczasowa implementacja z mock
    setTimeout(() => {
      this.showSuccessMessage('Wydatek został utworzony i faktura została przypisana');
    }, 1500);
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 5000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Zamknij', {
      duration: 7000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

openInfaktView(invoice: CostInvoice): void {
  const infaktUrl = `${environment.infaktUrl || 'https://app.infakt.pl'}/app/koszty/${invoice.id}`;
  window.open(infaktUrl, '_blank');
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

getDateRangeDisplayName(): string {
  if (this.useCustomDateRange && this.dateFrom && this.dateTo) {
    return `${this.formatDate(this.dateFrom.toISOString())} - ${this.formatDate(this.dateTo.toISOString())}`;
  }
  return this.getMonthDisplayName();
}

getCategoryDisplayName(category: CostInvoiceCategory | string | undefined): string {
  return this.costInvoiceService.getCategoryDisplayName(category as CostInvoiceCategory);
}

// Calculate totals by currency
getCurrencyTotals(): CurrencyTotal[] {
  const totalsMap = new Map<string, CurrencyTotal>();

  this.invoices.forEach(invoice => {
    const currency = invoice.currency || 'PLN';

    if (!totalsMap.has(currency)) {
      totalsMap.set(currency, {
        currency: currency,
        netTotal: 0,
        grossTotal: 0
      });
    }

    const total = totalsMap.get(currency)!;
    total.netTotal += invoice.netPrice;
    total.grossTotal += invoice.grossPrice;
  });

  return Array.from(totalsMap.values()).sort((a, b) => a.currency.localeCompare(b.currency));
}

getPageNumbers(): number[] {
  const pages: number[] = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(0, this.currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(this.totalPages - 1, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(0, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
}

protected readonly Math = Math;
}
