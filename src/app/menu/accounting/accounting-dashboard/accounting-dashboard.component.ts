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

  // Loading state
  isLoading = false;

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
  offersPageSize = 10;
  offersPageIndex = 0;
  totalOffers = 0;
  paginatedOffers: OfferProfitabilityResponse[] = [];

  // Filtering
  offerSearchQuery = '';
  filteredOffers: OfferProfitabilityResponse[] = [];

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
    this.loadFinancialReport();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Custom predicate for expanded detail rows
  isExpandedRow = (index: number, item: any) => {
    return item.hasOwnProperty('detailRow');
  };

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
    const monthParam = this.formatMonthForBackend(this.selectedMonth);

    this.raportService.getFinancialReport(monthParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: FinancialReportResponse) => {
          this.reportData = data;
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
        }
      });
  }

  // Prepare offers data with filtering and pagination
  private prepareOffersData(): void {
    if (!this.reportData) return;

    this.filteredOffers = this.reportData.offers.filter(offer =>
      this.offerSearchQuery === '' ||
      offer.offerName.toLowerCase().includes(this.offerSearchQuery.toLowerCase()) ||
      offer.offerId.toLowerCase().includes(this.offerSearchQuery.toLowerCase()) ||
      offer.productNames.some(name => name.toLowerCase().includes(this.offerSearchQuery.toLowerCase()))
    );

    this.totalOffers = this.filteredOffers.length;
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

  // Handle offers search
  onOfferSearch(): void {
    this.offersPageIndex = 0; // Reset to first page
    this.prepareOffersData();
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
    this.loadFinancialReport();
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.loadFinancialReport();
  }

  currentMonth(): void {
    this.selectedMonth = new Date();
    this.loadFinancialReport();
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

  // Clear search filter
  clearOfferSearch(): void {
    this.offerSearchQuery = '';
    this.onOfferSearch();
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
