import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RaportService, FinancialReportResponse, OfferProfitabilityResponse } from '../../../utility/service/raport.service';

interface CostItem {
  name: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-accounting-dashboard',
  templateUrl: './accounting-dashboard.component.html',
  styleUrl: './accounting-dashboard.component.css'
})
export class AccountingDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Loading state
  isLoading = false;

  // Selected month for report
  selectedMonth: Date = new Date();

  // Report data
  reportData: FinancialReportResponse | null = null;

  // Computed values
  profitMargin = 0;
  costBreakdown: CostItem[] = [];

  // Export functionality
  isExporting = false;

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

  // Format date for backend (YYYY-MM format)
  private formatMonthForBackend(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Calculate additional metrics
  private calculateMetrics(): void {
    if (!this.reportData) return;

    this.profitMargin = this.reportData.revenue > 0
      ? (this.reportData.profit / this.reportData.revenue) * 100
      : 0;
  }

  // Prepare cost breakdown for charts
  private prepareCostBreakdown(): void {
    if (!this.reportData) return;

    this.costBreakdown = [
      {
        name: 'Materiały',
        value: this.reportData.materialCost,
        color: '#3b82f6'
      },
      {
        name: 'Praca',
        value: this.reportData.laborCost,
        color: '#10b981'
      },
      {
        name: 'Energia',
        value: this.reportData.powerCost,
        color: '#f59e0b'
      },
      {
        name: 'Opakowania',
        value: this.reportData.packagingCost,
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

  // Export functionality
  exportReport(): void {
    if (!this.reportData) {
      this.snackBar.open('Brak danych do eksportu', 'Zamknij', {
        duration: 3000,
        panelClass: ['warning-snackbar']
      });
      return;
    }

    this.isExporting = true;

    try {
      const csvContent = this.generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `raport-finansowy-${this.formatMonthForBackend(this.selectedMonth)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      this.snackBar.open('Raport został wyeksportowany', 'Zamknij', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    } catch (error) {
      this.snackBar.open('Błąd podczas eksportu raportu', 'Zamknij', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isExporting = false;
    }
  }

  // Generate CSV content
  private generateCSV(): string {
    if (!this.reportData) return '';

    const headers = [
      'ID Oferty',
      'Nazwa oferty',
      'Produkty',
      'Sprzedano (szt.)',
      'Przychód (zł)',
      'Koszty materiałów (zł)',
      'Koszty pracy (zł)',
      'Koszty energii (zł)',
      'Koszty opakowań (zł)',
      'Koszty produkcji (zł)',
      'Zysk (zł)',
      'Marża (%)'
    ];

    const rows = this.reportData.offers.map(offer => [
      offer.offerId,
      offer.offerName,
      offer.productNames.join('; '),
      offer.quantitySold.toString(),
      offer.revenue.toFixed(2),
      offer.materialCost.toFixed(2),
      offer.laborCost.toFixed(2),
      offer.powerCost.toFixed(2),
      offer.packagingCost.toFixed(2),
      offer.productionCost.toFixed(2),
      offer.profit.toFixed(2),
      offer.revenue > 0 ? ((offer.profit / offer.revenue) * 100).toFixed(1) : '0'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
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
    return offer.revenue > 0 ? (offer.profit / offer.revenue) * 100 : 0;
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
  trackByOfferId(index: number, offer: OfferProfitabilityResponse): string {
    return offer.offerId;
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
