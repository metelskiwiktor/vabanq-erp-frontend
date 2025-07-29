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

interface AllegroCostItem {
  name: string;
  value: number;
  color: string;
  type: 'monthly' | 'per-order';
}

interface ExpenseItem {
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
  reportGenerated = false;

  // Selected month for report
  selectedMonth: Date = new Date();

  // Report data
  reportData: FinancialReportResponse | null = null;

  // Price display mode
  showNetPrices = true;

  // Computed values
  profitMargin = 0;
  costBreakdown: CostItem[] = [];
  allegroCostBreakdown: AllegroCostItem[] = [];
  expenseBreakdown: ExpenseItem[] = [];
  totalAllegroCosts = 0;
  totalExpenses = 0;

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

  // Table columns
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

  // Generate report
  generateReport(): void {
    this.loadFinancialReport();
  }

  // Toggle between net and gross prices
  togglePriceMode(): void {
    this.showNetPrices = !this.showNetPrices;
    this.calculateMetrics();
    this.prepareCostBreakdown();
    this.prepareAllegroCostBreakdown();
    this.prepareExpenseBreakdown();
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
          this.prepareAllegroCostBreakdown();
          this.prepareExpenseBreakdown();
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

  // Prepare expense breakdown for pie chart
  private prepareExpenseBreakdown(): void {
    if (!this.reportData || !this.reportData.expensesByCategory) return;

    const colors = [
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
      '#6366f1', '#14b8a6', '#facc15', '#f43f5e', '#10b981'
    ];

    this.expenseBreakdown = [];
    let colorIndex = 0;

    Object.entries(this.reportData.expensesByCategory).forEach(([category, pricePair]) => {
      const value = this.getPrice(pricePair);
      if (value > 0) {
        this.expenseBreakdown.push({
          name: this.formatExpenseCategoryName(category),
          value,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      }
    });

    // Calculate total expenses
    this.totalExpenses = this.expenseBreakdown.reduce((sum, item) => sum + item.value, 0);

    // Sort by value descending
    this.expenseBreakdown.sort((a, b) => b.value - a.value);
  }

  // Format expense category names for better display
  private formatExpenseCategoryName(category: string): string {
    const translations: { [key: string]: string } = {
      'SERVICES': 'Usługi',
      'ELECTRICITY': 'Prąd',
      'MATERIALS': 'Materiały',
      'EQUIPMENT': 'Sprzęt',
      'PACKAGING': 'Opakowania',
      'SOFTWARE': 'Oprogramowanie',
      'ALLEGRO': 'Allegro',
      'OTHER': 'Inne'
    };

    return translations[category] || category;
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
    this.offersPageIndex = 0;
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

  // Prepare cost breakdown for pie chart
  private prepareCostBreakdown(): void {
    if (!this.reportData) return;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    this.costBreakdown = [
      {
        name: 'Materiały',
        value: this.getPrice(this.reportData.materialCost),
        color: colors[0]
      },
      {
        name: 'Praca',
        value: this.getPrice(this.reportData.laborCost),
        color: colors[1]
      },
      {
        name: 'Energia',
        value: this.getPrice(this.reportData.powerCost),
        color: colors[2]
      },
      {
        name: 'Opakowania',
        value: this.getPrice(this.reportData.packagingCost),
        color: colors[3]
      }
    ].filter(item => item.value > 0);
  }

  // Prepare Allegro cost breakdown
  private prepareAllegroCostBreakdown(): void {
    if (!this.reportData || !this.reportData.allegroCosts) return;

    const colors = [
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
      '#6366f1', '#14b8a6', '#facc15', '#f43f5e', '#8b5cf6'
    ];

    this.allegroCostBreakdown = [];
    let colorIndex = 0;

    // Add monthly Allegro costs
    Object.entries(this.reportData.allegroCosts).forEach(([name, pricePair]) => {
      const value = this.getPrice(pricePair);
      if (value > 0) {
        this.allegroCostBreakdown.push({
          name: this.formatAllegroCostName(name),
          value,
          color: colors[colorIndex % colors.length],
          type: 'monthly'
        });
        colorIndex++;
      }
    });

    // Calculate total costs from individual offers
    const offerAllegroCosts = new Map<string, number>();

    if (this.reportData.offers) {
      this.reportData.offers.forEach(offer => {
        if (offer.allegroCosts) {
          Object.entries(offer.allegroCosts).forEach(([name, pricePair]) => {
            const value = this.getPrice(pricePair);
            const current = offerAllegroCosts.get(name) || 0;
            offerAllegroCosts.set(name, current + value);
          });
        }
      });
    }

    // Add aggregated per-order costs
    offerAllegroCosts.forEach((value, name) => {
      if (value > 0) {
        this.allegroCostBreakdown.push({
          name: this.formatAllegroCostName(name),
          value,
          color: colors[colorIndex % colors.length],
          type: 'per-order'
        });
        colorIndex++;
      }
    });

    // Calculate total
    this.totalAllegroCosts = this.allegroCostBreakdown.reduce((sum, item) => sum + item.value, 0);

    // Sort by value descending
    this.allegroCostBreakdown.sort((a, b) => b.value - a.value);
  }

  // Format Allegro cost names for better display
  private formatAllegroCostName(name: string): string {
    const translations: { [key: string]: string } = {
      'Opłata za kampanię Ads': 'Reklamy Ads',
      'Opłata za wyróżnienie': 'Wyróżnienie',
      'DPD Operator - opłaty podstawowe': 'DPD opłaty podstawowe',
      'DHL Operator - opłaty podstawowe': 'DHL opłaty podstawowe',
      'Prowizja od sprzedaży oferty wyróżnionej': 'Prowizja oferty wyróżnionej',
      'Abonament profesjonalny': 'Abonament profesjonalny',
      'UPS Operator - opłaty podstawowe': 'UPS opłaty podstawowe',
      'Allegro Paczkomaty InPost': 'Allegro Paczkomaty InPost',
      'Przesyłka DPD': 'Przesyłka DPD',
      'Opłata za promowanie na stronie działu': 'Promowanie na stronie działu',
      'InPost - opłaty dodatkowe': 'InPost opłaty dodatkowe',
      'Orlen Operator - opłaty podstawowe': 'Orlen opłaty podstawowe',
      'Opłata za Pakiet Promo': 'Pakiet Promo',
      'DPD - Kurier opłaty dodatkowe': 'DPD opłaty dodatkowe',
      'Prowizja od sprzedaży': 'Prowizja od sprzedaży'
    };

    return translations[name] || name;
  }

  // Month navigation
  previousMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.reportGenerated = false;
  }

  nextMonth(): void {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    this.reportGenerated = false;
  }

  currentMonth(): void {
    this.selectedMonth = new Date();
    this.reportGenerated = false;
  }

  // Get display name for selected month
  getMonthDisplayName(): string {
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: 'long'
    }).format(this.selectedMonth);
  }

  // Get total cost for offer (including Allegro costs)
  getTotalCost(offer: OfferProfitabilityResponse): number {
    const productionCost = this.getPrice(offer.materialCost) +
      this.getPrice(offer.laborCost) +
      this.getPrice(offer.powerCost) +
      this.getPrice(offer.packagingCost);

    const allegroCosts = offer.allegroCosts ?
      Object.values(offer.allegroCosts).reduce((sum, pricePair) => sum + this.getPrice(pricePair), 0) : 0;

    return productionCost + allegroCosts;
  }

  // Toggle expanded state for offer
  toggleExpanded(offerId: string): void {
    if (this.expandedOffers.has(offerId)) {
      this.expandedOffers.delete(offerId);
    } else {
      this.expandedOffers.add(offerId);
    }
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

  // Get max value for Allegro cost chart scaling
  getMaxAllegroCostValue(): number {
    if (this.allegroCostBreakdown.length === 0) return 100;
    return Math.max(...this.allegroCostBreakdown.map(item => item.value));
  }

  // Calculate cost percentage for chart bars
  getCostPercentage(value: number): number {
    const max = this.getMaxCostValue();
    return max > 0 ? (value / max) * 100 : 0;
  }

  // Calculate Allegro cost percentage for chart bars
  getAllegroCostPercentage(value: number): number {
    const max = this.getMaxAllegroCostValue();
    return max > 0 ? (value / max) * 100 : 0;
  }

  // Helper methods for Allegro costs in templates
  getAllegroCostEntries(allegroCosts: { [key: string]: PricePair }): { name: string, pricePair: PricePair }[] {
    return Object.entries(allegroCosts).map(([name, pricePair]) => ({ name, pricePair }));
  }

  getAllegroCostTotal(allegroCosts: { [key: string]: PricePair }): number {
    return Object.values(allegroCosts).reduce((sum, pricePair) => sum + this.getPrice(pricePair), 0);
  }

  getMonthlyCostsTotal(): number {
    return this.allegroCostBreakdown
      ? this.allegroCostBreakdown.filter(c => c.type === 'monthly').reduce((sum, c) => sum + c.value, 0)
      : 0;
  }

  getPerOrderCostsTotal(): number {
    return this.allegroCostBreakdown
      ? this.allegroCostBreakdown.filter(c => c.type === 'per-order').reduce((sum, c) => sum + c.value, 0)
      : 0;
  }

  // TrackBy function for offers table performance
  trackByOfferId(index: number, offer: any): string {
    return offer.detailRow ? `${offer.offerId}_detail` : offer.offerId;
  }

  getMonthlyCosts(): AllegroCostItem[] {
    return this.allegroCostBreakdown.filter(cost => cost.type === 'monthly');
  }

  // Get per-order Allegro costs
  getPerOrderCosts(): AllegroCostItem[] {
    return this.allegroCostBreakdown.filter(cost => cost.type === 'per-order');
  }

  // Get percentage for pie chart slices
  getCostSlicePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  getExpenseSlicePercentage(value: number): number {
    return this.totalExpenses > 0 ? (value / this.totalExpenses) * 100 : 0;
  }

  // Calculate total production costs for pie chart
  getTotalProductionCosts(): number {
    return this.costBreakdown.reduce((sum, item) => sum + item.value, 0);
  }

  // Generate SVG path for pie chart slice
  generatePieSlice(value: number, total: number, index: number, totalSlices: number): string {
    if (total === 0 || value === 0) return '';

    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;

    // Calculate starting angle (sum of all previous slices)
    let startAngle = 0;
    const items = this.costBreakdown.length > 0 ? this.costBreakdown : this.expenseBreakdown;
    for (let i = 0; i < index; i++) {
      if (items[i]) {
        const prevPercentage = (items[i].value / total) * 100;
        startAngle += (prevPercentage / 100) * 360;
      }
    }

    const endAngle = startAngle + angle;

    // Convert to radians
    const startAngleRad = (startAngle - 90) * (Math.PI / 180);
    const endAngleRad = (endAngle - 90) * (Math.PI / 180);

    const radius = 80;

    // Calculate start and end points
    const x1 = radius * Math.cos(startAngleRad);
    const y1 = radius * Math.sin(startAngleRad);
    const x2 = radius * Math.cos(endAngleRad);
    const y2 = radius * Math.sin(endAngleRad);

    // Determine if arc should be large (greater than 180 degrees)
    const largeArc = angle > 180 ? 1 : 0;

    // Create SVG path
    return `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  protected readonly Object = Object;
}
