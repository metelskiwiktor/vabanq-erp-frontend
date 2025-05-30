// src/app/menu/accounting/accounting-expenses/product-costs-table/product-costs-table.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { Subject, takeUntil, finalize } from 'rxjs';
import { ProductCostService, ProductCostResponse, ProductCostSummaryResponse } from '../../../../utility/service/product-cost.service';

@Component({
  selector: 'app-product-costs-table',
  templateUrl: './product-costs-table.component.html',
  styleUrls: [
    './product-costs-table.component.css',
    '../shared/expenses-shared.styles.css'
  ]
})
export class ProductCostsTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() searchQuery!: string;
  @Input() showGross!: boolean;

  products: ProductCostResponse[] = [];
  isLoading: boolean = false;
  summary: ProductCostSummaryResponse | null = null;

  private destroy$ = new Subject<void>();

  constructor(private productCostService: ProductCostService) {}

  ngOnInit(): void {
    this.loadProductCosts();
    this.loadSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['searchQuery']) {
      this.loadProductCosts();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProductCosts(): void {
    this.isLoading = true;

    this.productCostService.getProductCosts(this.searchQuery)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (products) => {
          this.products = products;
          console.log(`Loaded ${products.length} product costs`);
        },
        error: (error) => {
          console.error('Error loading product costs:', error);
          this.products = [];
        }
      });
  }

  private loadSummary(): void {
    this.productCostService.getProductCostsSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary) => {
          this.summary = summary;
        },
        error: (error) => {
          console.error('Error loading product costs summary:', error);
          this.summary = null;
        }
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  getMarginClass(margin: number): string {
    if (margin > 45) return 'margin-high';
    if (margin > 30) return 'margin-medium';
    return 'margin-low';
  }

  getMaterialCost(product: ProductCostResponse): number {
    return this.showGross ? product.grossMaterialCost : product.materialCost;
  }

  getPowerCost(product: ProductCostResponse): number {
    return this.showGross ? product.grossPowerCost : product.powerCost;
  }

  getPackagingCost(product: ProductCostResponse): number {
    return this.showGross ? product.grossPackagingCost : product.packagingCost;
  }

  getLaborCost(product: ProductCostResponse): number {
    return this.showGross ? product.grossLaborCost : product.laborCost;
  }

  getTotalCost(product: ProductCostResponse): number {
    return this.showGross ? product.grossTotalCost : product.totalCost;
  }

  getRetailPrice(product: ProductCostResponse): number {
    return this.showGross ? product.grossRetailPrice : product.retailPrice;
  }

  getSummaryTotalCost(): number {
    if (!this.summary) return 0;
    return this.showGross ? this.summary.grossTotalCost : this.summary.totalCost;
  }

  getSummaryRetailValue(): number {
    if (!this.summary) return 0;
    return this.showGross ? this.summary.grossTotalRetailValue : this.summary.totalRetailValue;
  }
}
