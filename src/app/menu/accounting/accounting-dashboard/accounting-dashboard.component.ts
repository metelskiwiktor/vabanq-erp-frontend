// src/app/menu/accounting/accounting-dashboard/accounting-dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RaportService, FinancialReportResponse, OfferProfitabilityResponse } from '../../../utility/service/raport.service';
import {VisualizationSpec} from "vega-embed";

interface CostItem {
  name: string;
  value: number;
  color: string;
}

interface AllegroCostItem {
  name: string;
  value: number;
  color: string;
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

  // Computed values
  profitMargin = 0;
  costBreakdown: CostItem[] = [];
  allegroCostBreakdown: AllegroCostItem[] = [];
  expenseBreakdown: ExpenseItem[] = [];
  totalAllegroCosts = 0;
  totalExpenses = 0;

  // Pagination for offers table
  offersPageSize = 50;
  offersPageIndex = 0;
  totalOffers = 0;
  paginatedOffers: OfferProfitabilityResponse[] = [];

  // Filtering and sorting
  offerSearchQuery = '';
  filteredOffers: OfferProfitabilityResponse[] = [];
  minQuantity = '';
  maxQuantity = '';
  minProfit = '';
  productFilter = '';
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Chart specifications and data
  // @ts-ignore
  chartSpec: VisualizationSpec = {};
  // @ts-ignore
  roiChartSpec: VisualizationSpec = {}; // New ROI chart spec
  chartData: any[] = [];

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

  // Generate report
  generateReport(): void {
    this.loadFinancialReport();
    this.initializeChartSpecs(); // Updated method name
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

  // Get total of all costs (production + allegro + expenses)
  getTotalAllCosts(): number {
    if (!this.reportData) return 0;
    return this.reportData.productionCost + this.totalAllegroCosts + this.totalExpenses;
  }

  // Initialize both chart specifications - Updated method
  private initializeChartSpecs(): void {
    // Original Revenue vs Profit chart with smaller width
    this.chartSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 400, // Reduced from 800
      height: 400, // Reduced from 500
      transform: [
        {
          calculate: 'datum.profit / datum.revenue',
          as: 'margin'
        },
        {
          calculate: 'datum.productionCost > 0 ? datum.profit / datum.productionCost : 0',
          as: 'roi'
        }
      ],
      mark: {
        type: 'circle',
        opacity: 0.8,
        stroke: 'white',
        strokeWidth: 2
      },
      encoding: {
        x: {
          field: 'revenue',
          type: 'quantitative',
          title: 'Przychód (PLN)',
          axis: {
            format: ',.0f',
            grid: true,
            tickCount: 6 // Reduced from 8
          }
        },
        y: {
          field: 'profit',
          type: 'quantitative',
          title: 'Zysk (PLN)',
          axis: {
            format: ',.0f',
            grid: true,
            tickCount: 5 // Reduced from 6
          }
        },
        size: {
          field: 'quantitySold',
          type: 'quantitative',
          title: 'Sprzedane ilości',
          scale: {
            range: [50, 500], // Reduced from [100, 1000]
          },
          legend: {
            orient: 'right',
            title: 'Ilość sprzedana',
            values: [10, 50, 100, 200]
          }
        },
        color: {
          field: 'margin',
          type: 'quantitative',
          title: 'Marża (%)',
          scale: {
            scheme: 'blues',
            domain: [0, 1]
          },
          legend: {
            orient: 'right',
            title: 'Marża',
            format: '.1%',
            tickCount: 4 // Reduced from 5
          }
        },
        tooltip: [
          {
            field: 'offerName',
            type: 'nominal',
            title: 'Oferta'
          },
          {
            field: 'revenue',
            type: 'quantitative',
            title: 'Przychód',
            format: ',.0f'
          },
          {
            field: 'profit',
            type: 'quantitative',
            title: 'Zysk',
            format: ',.0f'
          },
          {
            field: 'productionCost',
            type: 'quantitative',
            title: 'Koszt produkcji',
            format: ',.0f'
          },
          {
            field: 'quantitySold',
            type: 'quantitative',
            title: 'Sprzedane ilości'
          },
          {
            field: 'margin',
            type: 'quantitative',
            title: 'Marża',
            format: '.1%'
          },
          {
            field: 'roi',
            type: 'quantitative',
            title: 'ROI',
            format: '.2f'
          }
        ]
      },
      config: {
        axis: {
          labelFontSize: 10, // Reduced from 12
          titleFontSize: 12, // Reduced from 14
          titlePadding: 10 // Reduced from 15
        },
        legend: {
          labelFontSize: 9, // Reduced from 11
          titleFontSize: 10, // Reduced from 12
          padding: 8 // Reduced from 10
        },
        title: {
          fontSize: 14, // Reduced from 16
          anchor: 'start',
          fontWeight: 600
        }
      }
    };

    // New ROI vs Profit chart
    this.roiChartSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 400,
      height: 400,
      transform: [
        {
          // defensywnie: unikamy dzielenia przez zero
          calculate: "datum.productionCost > 0 ? datum.profit / datum.productionCost : 0",
          as: 'roi'
        }
      ],
      mark: {
        type: 'circle',
        opacity: 0.8,
        stroke: 'white',
        strokeWidth: 2
      },
      encoding: {
        x: {
          field: 'roi',
          type: 'quantitative',
          title: 'Zysk / Koszt (ROI)',
          axis: {
            format: '.2f',
            grid: true,
            tickCount: 5 // Reduced from 6
          }
        },
        y: {
          field: 'profit',
          type: 'quantitative',
          title: 'Zysk (PLN)',
          axis: {
            format: ',.0f',
            grid: true,
            tickCount: 6 // Reduced from 8
          }
        },
        size: {
          field: 'quantitySold',
          type: 'quantitative',
          title: 'Ilość sprzedana',
          scale: {
            range: [50, 500] // Reduced from [50, 1000]
          },
          legend: {
            orient: 'right',
            title: 'Ilość sprzedana',
            values: [10, 50, 100, 200]
          }
        },
        color: {
          field: 'roi',
          type: 'quantitative',
          title: 'ROI',
          scale: {
            scheme: 'greens' // Different color scheme to distinguish from first chart
          },
          legend: {
            orient: 'right',
            title: 'ROI',
            format: '.2f',
            tickCount: 4 // Reduced from 5
          }
        },
        tooltip: [
          {
            field: 'offerName',
            type: 'nominal',
            title: 'Oferta'
          },
          {
            field: 'profit',
            type: 'quantitative',
            title: 'Zysk',
            format: ',.0f'
          },
          {
            field: 'productionCost',
            type: 'quantitative',
            title: 'Koszt produkcji',
            format: ',.0f'
          },
          {
            field: 'quantitySold',
            type: 'quantitative',
            title: 'Sprzedane ilości'
          },
          {
            field: 'roi',
            type: 'quantitative',
            title: 'Zysk / Koszt (ROI)',
            format: '.2f'
          },
          {
            field: 'margin',
            type: 'quantitative',
            title: 'Marża',
            format: '.1%'
          },
        ]
      },
      config: {
        axis: {
          labelFontSize: 10,
          titleFontSize: 12,
          titlePadding: 10
        },
        legend: {
          labelFontSize: 9,
          titleFontSize: 10,
          padding: 8
        },
        title: {
          fontSize: 14,
          anchor: 'start',
          fontWeight: 600
        }
      }
    };
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

    Object.entries(this.reportData.expensesByCategory).forEach(([category, value]) => {
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

      // Quantity range filter
      const matchesMinQuantity = this.minQuantity === '' || offer.quantitySold >= parseFloat(this.minQuantity);
      const matchesMaxQuantity = this.maxQuantity === '' || offer.quantitySold <= parseFloat(this.maxQuantity);

      // Profit filter
      const matchesMinProfit = this.minProfit === '' || offer.profit >= parseFloat(this.minProfit);

      // Product filter
      let matchesProductFilter = true;
      if (this.productFilter === 'hasProducts') {
        matchesProductFilter = offer.productNames.length > 0;
      } else if (this.productFilter === 'noProducts') {
        matchesProductFilter = offer.productNames.length === 0;
      }

      return matchesSearch && matchesMinQuantity && matchesMaxQuantity && matchesMinProfit && matchesProductFilter;
    });

    // Apply sorting
    if (this.sortField) {
      this.filteredOffers.sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        switch (this.sortField) {
          case 'offerId':
            aValue = parseInt(a.offerId) || 0;
            bValue = parseInt(b.offerId) || 0;
            break;
          case 'offerName':
            return this.sortDirection === 'asc'
              ? a.offerName.localeCompare(b.offerName)
              : b.offerName.localeCompare(a.offerName);
          case 'productCount':
            aValue = a.productNames.length;
            bValue = b.productNames.length;
            break;
          case 'quantitySold':
            aValue = a.quantitySold;
            bValue = b.quantitySold;
            break;
          case 'pricePerQuantity':
            aValue = a.pricePerQuantity;
            bValue = b.pricePerQuantity;
            break;
          case 'revenue':
            aValue = a.revenue;
            bValue = b.revenue;
            break;
          case 'productionCost':
            aValue = a.productionCost;
            bValue = b.productionCost;
            break;
          case 'vatCost':
            aValue = a.vatCost;
            bValue = b.vatCost;
            break;
          case 'allegroCostTotal':
            aValue = this.getAllegroCostTotal(a.allegroCosts || {});
            bValue = this.getAllegroCostTotal(b.allegroCosts || {});
            break;
          case 'margin':
            aValue = this.getOfferMargin(a);
            bValue = this.getOfferMargin(b);
            break;
          case 'profit':
            aValue = a.profit;
            bValue = b.profit;
            break;
          default:
            return 0;
        }

        return this.sortDirection === 'asc' ?
          (aValue as number) - (bValue as number) :
          (bValue as number) - (aValue as number);
      });
    }

    this.totalOffers = this.filteredOffers.length;
    this.offersPageIndex = 0;
    this.updatePaginatedOffers();
    this.prepareChartData();
  }

  // Update paginated offers based on current page
  private updatePaginatedOffers(): void {
    const startIndex = this.offersPageIndex * this.offersPageSize;
    const endIndex = startIndex + this.offersPageSize;
    this.paginatedOffers = this.filteredOffers.slice(startIndex, endIndex);
  }

  // Handle offers search and filtering
  onOfferSearch(): void {
    this.prepareOffersData();
  }

  // Clear all filters
  clearFilters(): void {
    this.offerSearchQuery = '';
    this.minQuantity = '';
    this.maxQuantity = '';
    this.minProfit = '';
    this.productFilter = '';
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

    const revenue = this.reportData.revenue;
    const profit = this.reportData.profit;

    this.profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;
  }

  // Prepare cost breakdown for pie chart
  private prepareCostBreakdown(): void {
    if (!this.reportData) return;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    this.costBreakdown = [
      {
        name: 'Materiały',
        value: this.reportData.materialCost,
        color: colors[0]
      },
      {
        name: 'Praca',
        value: this.reportData.laborCost,
        color: colors[1]
      },
      {
        name: 'Energia',
        value: this.reportData.powerCost,
        color: colors[2]
      },
      {
        name: 'Opakowania',
        value: this.reportData.packagingCost,
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

    // Add monthly Allegro costs from main report
    Object.entries(this.reportData.allegroCosts).forEach(([name, value]) => {
      if (value > 0) {
        this.allegroCostBreakdown.push({
          name: this.formatAllegroCostName(name),
          value,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      }
    });

    // Calculate total costs from individual offers (per-order costs)
    const offerAllegroCosts = new Map<string, number>();

    if (this.reportData.offers) {
      this.reportData.offers.forEach(offer => {
        if (offer.allegroCosts) {
          Object.entries(offer.allegroCosts).forEach(([name, value]) => {
            const current = offerAllegroCosts.get(name) || 0;
            offerAllegroCosts.set(name, current + value);
          });
        }
      });
    }

    // Add aggregated per-order costs to breakdown
    offerAllegroCosts.forEach((value, name) => {
      if (value > 0) {
        this.allegroCostBreakdown.push({
          name: this.formatAllegroCostName(name),
          value,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      }
    });

    // Calculate total
    this.totalAllegroCosts = this.allegroCostBreakdown.reduce((sum, item) => sum + item.value, 0);

    // Sort by value descending
    this.allegroCostBreakdown.sort((a, b) => b.value - a.value);
  }

  // Get monthly Allegro costs (from main report)
  getMonthlyCosts(): AllegroCostItem[] {
    if (!this.reportData || !this.reportData.allegroCosts) return [];

    const colors = [
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
      '#6366f1', '#14b8a6', '#facc15', '#f43f5e', '#8b5cf6'
    ];

    const monthlyCosts: AllegroCostItem[] = [];
    let colorIndex = 0;

    Object.entries(this.reportData.allegroCosts).forEach(([name, value]) => {
      if (value > 0) {
        monthlyCosts.push({
          name: this.formatAllegroCostName(name),
          value,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      }
    });

    return monthlyCosts.sort((a, b) => b.value - a.value);
  }

  // Get per-order Allegro costs (aggregated from offers)
  getPerOrderCosts(): AllegroCostItem[] {
    if (!this.reportData || !this.reportData.offers) return [];

    const colors = [
      '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#ec4899',
      '#6366f1', '#14b8a6', '#facc15', '#f43f5e', '#8b5cf6'
    ];

    // Aggregate costs from all offers
    const offerAllegroCosts = new Map<string, number>();

    this.reportData.offers.forEach(offer => {
      if (offer.allegroCosts) {
        Object.entries(offer.allegroCosts).forEach(([name, value]) => {
          const current = offerAllegroCosts.get(name) || 0;
          offerAllegroCosts.set(name, current + value);
        });
      }
    });

    const perOrderCosts: AllegroCostItem[] = [];
    let colorIndex = 0;

    offerAllegroCosts.forEach((value, name) => {
      if (value > 0) {
        perOrderCosts.push({
          name: this.formatAllegroCostName(name),
          value,
          color: colors[colorIndex % colors.length]
        });
        colorIndex++;
      }
    });

    return perOrderCosts.sort((a, b) => b.value - a.value);
  }

  getMonthlyCostsTotal(): number {
    return this.getMonthlyCosts().reduce((sum, cost) => sum + cost.value, 0);
  }

  getPerOrderCostsTotal(): number {
    return this.getPerOrderCosts().reduce((sum, cost) => sum + cost.value, 0);
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
    const productionCost = offer.productionCost;
    const allegroCosts = this.getAllegroCostTotal(offer.allegroCosts || {});
    return productionCost + allegroCosts;
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
    const revenue = offer.revenue;
    const profit = offer.profit;
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

  // Helper method for Allegro costs total
  getAllegroCostTotal(allegroCosts: { [key: string]: number }): number {
    return Object.values(allegroCosts).reduce((sum, value) => sum + value, 0);
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

  // Generate SVG path for pie chart slice - separate methods for different charts
  generateCostPieSlice(value: number, total: number, index: number): string {
    return this.generatePieSliceHelper(value, total, index, this.costBreakdown);
  }

  generateExpensePieSlice(value: number, total: number, index: number): string {
    return this.generatePieSliceHelper(value, total, index, this.expenseBreakdown);
  }

  private generatePieSliceHelper(value: number, total: number, index: number, items: any[]): string {
    if (total === 0 || value === 0) return '';

    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;

    // Calculate starting angle (sum of all previous slices)
    let startAngle = 0;
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

  // TrackBy function for offers table performance
  trackByOfferId(index: number, offer: OfferProfitabilityResponse): string {
    return offer.offerId;
  }

  // Prepare data for the Vega-Lite charts
  private prepareChartData(): void {
    if (!this.reportData || !this.reportData.offers) {
      this.chartData = [];
      return;
    }

    this.chartData = this.reportData.offers
      .filter(offer => offer.quantitySold > 0 && offer.revenue > 0) // Filter out invalid data
      .map(offer => ({
        offerName: offer.offerName,
        offerId: offer.offerId,
        revenue: offer.revenue,
        profit: offer.profit,
        productionCost: offer.productionCost,
        quantitySold: offer.quantitySold,
        margin: offer.revenue > 0 ? offer.profit / offer.revenue : 0,
        roi: offer.productionCost > 0 ? 1 + (offer.profit / offer.productionCost) : 0,
        // Additional fields for enhanced tooltips
        vatCost: offer.vatCost,
        allegroCosts: this.getAllegroCostTotal(offer.allegroCosts || {}),
        materialCost: offer.materialCost,
        powerCost: offer.powerCost,
        packagingCost: offer.packagingCost,
        laborCost: offer.laborCost
      }));
  }

  // Get chart title based on current data
  getChartTitle(): string {
    return `Przychód vs Zysk`;
  }

  // Get ROI chart title
  getRoiChartTitle(): string {
    return `ROI vs Zysk`;
  }

  // Check if charts should be displayed
  shouldShowChart(): boolean {
    return this.chartData.length > 0 && this.reportGenerated && !this.isLoading;
  }

  protected readonly Math = Math;
  protected readonly Object = Object;
}
