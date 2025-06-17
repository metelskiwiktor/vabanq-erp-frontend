import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../../environments/environment';
import {CostInvoice, CostInvoiceService, CostInvoiceCategory, CostInvoicePage} from "../../../utility/service/cost-invoice.service";

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
  selectedMonth: Date = new Date();

  // Available categories from enum
  availableCategories: { key: CostInvoiceCategory; displayName: string }[] = [];

  // Search timeout for debouncing
  private searchTimeout: any;

  constructor(
    private dialog: MatDialog,
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

  // Load invoices from backend with pagination
  loadInvoices(): void {
    this.isLoading = true;

    // Calculate date range from selected month
    const startOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0, 23, 59, 59);

    this.costInvoiceService.getCostInvoices(
      this.currentPage,
      this.pageSize,
      this.filterText || undefined,
      undefined, // currency filter
      this.filterCategory || undefined,
      startOfMonth,
      endOfMonth
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

      // Check first page to see if total count changed
      const startOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
      const endOfMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0, 23, 59, 59);

      this.costInvoiceService.getCostInvoices(
        0, // first page
        this.pageSize,
        this.filterText || undefined,
        undefined,
        this.filterCategory || undefined,
        startOfMonth,
        endOfMonth
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
    this.loadInvoices();
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.currentPage = 0;
    this.loadInvoices();
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

  clearFilters(): void {
    this.filterText = '';
    this.filterCategory = '';
    this.selectedMonth = new Date();
    this.currentPage = 0;
    this.loadInvoices();
  }

  // Actions
  openExpenseDialog(invoice: CostInvoice): void {
    // TODO: Open expense dialog with pre-filled data
    console.log('Opening expense dialog for invoice:', invoice);
    alert(`Dodaj wydatek dla faktury ${invoice.number} - funkcja w przygotowaniu`);
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

  getCategoryDisplayName(category: CostInvoiceCategory | string | undefined): string {
    return this.costInvoiceService.getCategoryDisplayName(category as CostInvoiceCategory);
  }

  getTotalNetAmount(): number {
    return this.invoices.reduce((sum, invoice) => sum + invoice.netPrice, 0);
  }

  getTotalGrossAmount(): number {
    return this.invoices.reduce((sum, invoice) => sum + invoice.grossPrice, 0);
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
