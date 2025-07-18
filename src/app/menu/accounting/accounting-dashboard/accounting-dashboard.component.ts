// src/app/menu/accounting/accounting-dashboard/accounting-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RaportService, FinancialReportResponse, OfferProfitabilityResponse, PricePair } from '../../../utility/service/raport.service';

interface CostItem {
  name: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-accounting-dashboard',
  templateUrl: './accounting-dashboard.component.html',
  styleUrl: './accounting-dashboard.component.css',
  animations: [
    trigger('slideInOut', [
      state('in', style({
        opacity: 1,
        transform: 'translateY(0)',
        height: '*'
      })),
      state('out', style({
        opacity: 0,
        transform: 'translateY(-10px)',
        height: '0px'
      })),
      transition('in => out', animate('200ms ease-out')),
      transition('out => in', animate('300ms ease-in'))
    ])
  ]
})
export class AccountingDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State management
  isLoading = false;
  reportGenerated = false; // Nowy flag do sprawdzania czy raport został wygenerowany

  // Selected month for report
  selectedMonth: Date = new Date();

  // Report data
  reportData: FinancialReportResponse | null = null;

  // Price display mode
  showNetPrices = true; // Default to net prices

  // Computed values
  profitMargin = 0;
  costBreakdown: CostItem[] = [];

  // Pagination for offers table
  offersPageSize = 100;
  offersPageIndex = 0;
  totalOffers = 0;
  paginatedOffers: OfferProfitabilityResponse[] = [];

  // Filtering and sorting
  offerSearchQuery = '';
  filteredOffers: OfferProfitabilityResponse[] = [];
  minRevenue = '';
  maxRevenue = '';
  showProfitableOnly = false;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Table columns - simplified
  displayedColumns: string[] = [
    'expand',
    'offerId',
    'offerName',
    'quantitySold',
    'pricePerQuantity',
    'revenue',
    'totalCost',
    'profit',
    'margin'
  ];

  // Expanded rows tracking
  expandedOffers = new Set<string>();

  constructor(
    private raportService: RaportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Nie ładuj raportu automatycznie - poczekaj na żądanie użytkownika
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Custom predicate for expanded detail rows
  isExpandedRow = (index: number, item: any) => {
    return item.hasOwnProperty('detailRow');
  };

  // Nowa metoda do generowania raportu
  generateReport(): void {
    this.loadFinancialReport();
  }

  // Odświeżenie raportu
  refreshReport(): void {
    if (this.reportGenerated) {
      this.loadFinancialReport();
    }
  }

  // Toggle between net and gross prices
  togglePriceMode(): void {
    this.showNetPrices = !this.showNetPrices;
    this.calculateMetrics();
    this.prepareCostBreakdown();
  }

  // Get price value based on current mode
  getPrice(pricePair: PricePair): number {
    return this.showNetPrices ? pricePair.net : pricePair.gross;
  }

  // Get price mode label
  getPriceModeLabel(): string {
    return this.showNetPrices ? 'netto' : 'brutto';
  }

  // Load financial report from backend
  loadFinancialReport(): void {
    this.isLoading = true;
    this.reportGenerated = false;
    const monthParam = this.formatMonthForBackend(this.selectedMonth);

    this.raportService.getFinancialReport(monthParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: FinancialReportResponse) => {
          this.reportData = data;
          this.reportGenerated = true;
          this.calculateMetrics();
          this.prepareCostBreakdown();
          this.prepareOffersData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading financial report:', error);
          this.snackBar.open('Błąd podczas ładowania raportu finansowego', 'Zamknij', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
          this.reportGenerated = false;
        }
      });
  }

  // Prepare offers data with filtering and pagination
  private prepareOffersData(): void {
    if (!this.reportData) return;

    // Apply all filters
    this.filteredOffers = this.reportData.offers.filter(offer => {
      // Text search
      const matchesSearch = this.offerSearchQuery === '' ||
        offer.offerName.toLowerCase().includes(this.offerSearchQuery.toLowerCase()) ||
        offer.offerId.toLowerCase().includes(this.offerSearchQuery.toLowerCase()) ||
        offer.productNames.some(name => name.toLowerCase().includes(this.offerSearchQuery.toLowerCase()));

      // Revenue range filter
      const revenue = this.getPrice(offer.revenue);
      const matchesMinRevenue = this.minRevenue === '' || revenue >= parseFloat(this.minRevenue);
      const matchesMaxRevenue = this.maxRevenue === '' || revenue <= parseFloat(this.maxRevenue);

      // Profitability filter
      const matchesProfitability = !this.showProfitableOnly || this.getPrice(offer.profit) > 0;

      return matchesSearch && matchesMinRevenue && matchesMaxRevenue && matchesProfitability;
    });

    // Apply sorting
    if (this.sortField) {
      this.filteredOffers.sort((a, b) => {
        let aValue: number;
        let bValue: number;

        switch (this.sortField) {
          case 'offerId':
            aValue = parseInt(a.offerId) || 0;
            bValue = parseInt(b.offerId) || 0;
            break;
          case 'offerName':
            return this.sortDirection === 'asc'
              ? a.offerName.localeCompare(b.offerName)
              : b.offerName.localeCompare(a.offerName);
          case 'quantitySold':
            aValue = a.quantitySold;
            bValue = b.quantitySold;
            break;
          case 'pricePerQuantity':
            aValue = this.getPrice(a.pricePerQuantity);
            bValue = this.getPrice(b.pricePerQuantity);
            break;
          case 'revenue':
            aValue = this.getPrice(a.revenue);
            bValue = this.getPrice(b.revenue);
            break;
          case 'totalCost':
            aValue = this.getTotalCost(a);
            bValue = this.getTotalCost(b);
            break;
          case 'profit':
            aValue = this.getPrice(a.profit);
            bValue = this.getPrice(b.profit);
            break;
          case 'margin':
            aValue = this.getOfferMargin(a);
            bValue = this.getOfferMargin(b);
            break;
          default:
            return 0;
        }

        return this.sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    this.totalOffers = this.filteredOffers.length;
    this.offersPageIndex = 0; // Reset to first page when filtering
    this.updatePaginatedOffers();
  }

  // Update paginated offers based on current page
  private updatePaginatedOffers(): void {
    const startIndex = this.offersPageIndex * this.offersPageSize;
    const endIndex = startIndex + this.offersPageSize;

    // Create flattened data source with detail rows
    this.paginatedOffers = [];
    const pageOffers = this.filteredOffers.slice(startIndex, endIndex);

    pageOffers.forEach(offer => {
      this.paginatedOffers.push(offer);
      if (this.expandedOffers.has(offer.offerId)) {
        // Add detail row
        this.paginatedOffers.push({
          ...offer,
          detailRow: true
        } as any);
      }
    });
  }

  // Handle offers search and filtering
  onOfferSearch(): void {
    this.prepareOffersData();
  }

  // Clear all filters
  clearFilters(): void {
    this.offerSearchQuery = '';
    this.minRevenue = '';
    this.maxRevenue = '';
    this.showProfitableOnly = false;
    this.sortField = '';
    this.sortDirection = 'asc';
    this.prepareOffersData();
  }

  // Handle column sorting
  onSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.prepareOffersData();
  }

  // Get sort icon for column
  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'unfold_more';
    return this.sortDirection === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  // Handle offers pagination
  onOffersPageChange(event: PageEvent): void {
    this.offersPageIndex = event.pageIndex;
    this.offersPageSize = event.pageSize;
    this.updatePaginatedOffers();
  }

  // Format date for backend (YYYY-MM format)
  private formatMonthForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Calculate additional metrics
  private calculateMetrics(): void {
    if (!this.reportData) return;

    const revenue = this.getPrice(this.reportData.revenue);
    const profit = this.getPrice(this.reportData.profit);

    this.profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  }

  // Prepare cost breakdown for charts
  private prepareCostBreakdown(): void {
    if (!this.reportData) return;

    this.costBreakdown = [
      {
        name: 'Materiały',
        value: this.getPrice(this.reportData.materialCost),
        color: '#3b82f6'
      },
      {
        name: 'Praca',
        value: this.getPrice(this.reportData.laborCost),
        color: '#10b981'
      },
      {
        name: 'Energia',
        value: this.getPrice(this.reportData.powerCost),
        color: '#f59e0b'
      },
      {
        name: 'Opakowania',
        value: this.getPrice(this.reportData.packagingCost),
        color: '#ef4444'
      }
    ].filter(item => item.value > 0); // Only show non-zero costs
  }

  // Month navigation
  previousMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.reportGenerated = false; // Reset report state
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.reportGenerated = false; // Reset report state
  }

  currentMonth(): void {
    this.selectedMonth = new Date();
    this.reportGenerated = false; // Reset report state
  }

  // Get display name for selected month
  getMonthDisplayName(): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long'
    }).format(this.selectedMonth);
  }

  // Get total cost for offer
  getTotalCost(offer: OfferProfitabilityResponse): number {
    return this.getPrice(offer.materialCost) +
      this.getPrice(offer.laborCost) +
      this.getPrice(offer.powerCost) +
      this.getPrice(offer.packagingCost);
  }

  // Toggle expanded state for offer
  toggleExpanded(offerId: string): void {
    if (this.expandedOffers.has(offerId)) {
      this.expandedOffers.delete(offerId);
    } else {
      this.expandedOffers.add(offerId);
    }
    // Rebuild paginated data to include/exclude detail rows
    this.updatePaginatedOffers();
  }

  // Check if offer is expanded
  isExpanded(offerId: string): boolean {
    return this.expandedOffers.has(offerId);
  }

  // Calculate single unit production cost
  getUnitProductionCost(offer: OfferProfitabilityResponse): number {
    if (offer.quantitySold === 0) return 0;
    return this.getTotalCost(offer) / offer.quantitySold;
  }

  // Calculate single unit profit
  getUnitProfit(offer: OfferProfitabilityResponse): number {
    return this.getPrice(offer.pricePerQuantity) - this.getUnitProductionCost(offer);
  }

  // Calculate unit margin
  getUnitMargin(offer: OfferProfitabilityResponse): number {
    const pricePerUnit = this.getPrice(offer.pricePerQuantity);
    if (pricePerUnit === 0) return 0;
    return (this.getUnitProfit(offer) / pricePerUnit) * 100;
  }

  // Helper methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  // Get profit margin for specific offer
  getOfferMargin(offer: OfferProfitabilityResponse): number {
    const revenue = this.getPrice(offer.revenue);
    const profit = this.getPrice(offer.profit);
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  }

  // Get status class for profit values
  getProfitStatusClass(profit: number): string {
    if (profit > 0) return 'profit-positive';
    if (profit < 0) return 'profit-negative';
    return 'profit-neutral';
  }

  // Get max value for cost chart scaling
  getMaxCostValue(): number {
    if (this.costBreakdown.length === 0) return 100;
    return Math.max(...this.costBreakdown.map(item => item.value));
  }

  // Calculate cost percentage for chart bars
  getCostPercentage(value: number): number {
    const max = this.getMaxCostValue();
    return max > 0 ? (value / max) * 100 : 0;
  }

  // TrackBy function for offers table performance
  trackByOfferId(index: number, offer: any): string {
    return offer.detailRow ? `${offer.offerId}_detail` : offer.offerId;
  }

  // Navigation methods
  navigateToInvoices(): void {
    // This would typically use Router to navigate
    console.log('Navigate to invoices');
  }

  navigateToExpenses(): void {
    // This would typically use Router to navigate
    console.log('Navigate to expenses');
  }
}
