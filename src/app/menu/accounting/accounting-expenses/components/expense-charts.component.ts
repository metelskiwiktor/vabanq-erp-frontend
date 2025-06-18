// src/app/menu/accounting/accounting-expenses/components/expense-charts.component.ts
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import {ExpenseSummaryResponse, FixedExpenseResponse} from "../../../../utility/service/fixed-expense.service";
import {VariableExpenseResponse} from "../../../../utility/service/variable-expense.service";

interface ChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface CategoryData {
  category: string;
  fixedAmount: number;
  variableAmount: number;
  totalAmount: number;
  color: string;
}

@Component({
  selector: 'app-expense-charts',
  template: `
    <div class="charts-section">
      <div class="charts-header">
        <h2>Analiza kosztów</h2>
        <p>Wizualizacja trendów i podziału wydatków za {{ currentPeriod }}</p>
      </div>

      <div class="charts-grid">
        <!-- Fixed vs Variable Pie Chart -->
        <mat-card class="chart-card">
          <mat-card-header>
            <div mat-card-avatar class="chart-avatar pie-avatar">
              <mat-icon>pie_chart</mat-icon>
            </div>
            <mat-card-title>Podział kosztów</mat-card-title>
            <mat-card-subtitle>Stałe vs zmienne ({{ showGross ? 'brutto' : 'netto' }})</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="pie-chart-container">
              <div class="pie-chart" [style]="getPieChartStyle()">
                <div class="pie-center">
                  <div class="total-amount">{{ formatCurrency(totalExpenses) }}</div>
                  <div class="total-label">Suma</div>
                </div>
              </div>
              <div class="pie-legend">
                <div class="legend-item" *ngFor="let item of pieChartData">
                  <div class="legend-color" [style.background-color]="item.color"></div>
                  <div class="legend-content">
                    <div class="legend-name">{{ item.name }}</div>
                    <div class="legend-value">
                      {{ formatCurrency(item.value) }} ({{ item.percentage.toFixed(1) }}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Category Bar Chart -->
        <mat-card class="chart-card">
          <mat-card-header>
            <div mat-card-avatar class="chart-avatar bar-avatar">
              <mat-icon>bar_chart</mat-icon>
            </div>
            <mat-card-title>Wydatki według kategorii</mat-card-title>
            <mat-card-subtitle>Porównanie stałych i zmiennych</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="bar-chart-container">
              <div class="bar-chart">
                <div *ngFor="let category of categoryChartData" class="bar-group">
                  <div class="bar-label">{{ category.category }}</div>
                  <div class="bars-container">
                    <!-- Fixed expenses bar -->
                    <div class="bar-wrapper">
                      <div class="bar fixed-bar"
                           [style.height.%]="getBarHeight(category.fixedAmount)"
                           [style.background]="'linear-gradient(180deg, #4caf50, #66bb6a)'"
                           [matTooltip]="'Stałe: ' + formatCurrency(category.fixedAmount)">
                      </div>
                    </div>
                    <!-- Variable expenses bar -->
                    <div class="bar-wrapper">
                      <div class="bar variable-bar"
                           [style.height.%]="getBarHeight(category.variableAmount)"
                           [style.background]="'linear-gradient(180deg, #ff9800, #ffb74d)'"
                           [matTooltip]="'Zmienne: ' + formatCurrency(category.variableAmount)">
                      </div>
                    </div>
                  </div>
                  <div class="bar-total">{{ formatCurrency(category.totalAmount) }}</div>
                </div>
              </div>
              <div class="bar-legend">
                <div class="legend-item">
                  <div class="legend-color" style="background: linear-gradient(90deg, #4caf50, #66bb6a);"></div>
                  <span>Koszty stałe</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="background: linear-gradient(90deg, #ff9800, #ffb74d);"></div>
                  <span>Koszty zmienne</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Monthly Trend Chart (if available) -->
        <mat-card class="chart-card trend-card" *ngIf="showTrendChart">
          <mat-card-header>
            <div mat-card-avatar class="chart-avatar trend-avatar">
              <mat-icon>trending_up</mat-icon>
            </div>
            <mat-card-title>Trend wydatków</mat-card-title>
            <mat-card-subtitle>Porównanie z poprzednimi miesiącami</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="trend-chart-placeholder">
              <div class="trend-info">
                <mat-icon>info</mat-icon>
                <div>
                  <h4>Wykres trendu</h4>
                  <p>Dostępny po implementacji historycznych danych wydatków</p>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Expense Distribution -->
        <mat-card class="chart-card stats-card">
          <mat-card-header>
            <div mat-card-avatar class="chart-avatar stats-avatar">
              <mat-icon>analytics</mat-icon>
            </div>
            <mat-card-title>Statystyki wydatków</mat-card-title>
            <mat-card-subtitle>Kluczowe wskaźniki</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-icon fixed-stat">
                  <mat-icon>account_balance</mat-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ fixedExpenses.length }}</div>
                  <div class="stat-label">Wydatków stałych</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon variable-stat">
                  <mat-icon>trending_up</mat-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ variableExpenses.length }}</div>
                  <div class="stat-label">Wydatków zmiennych</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon avg-stat">
                  <mat-icon>functions</mat-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ formatCurrency(getAverageExpense()) }}</div>
                  <div class="stat-label">Średni wydatek</div>
                </div>
              </div>

              <div class="stat-item">
                <div class="stat-icon percent-stat">
                  <mat-icon>percent</mat-icon>
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ getExpensePercentageOfRevenue().toFixed(1) }}%</div>
                  <div class="stat-label">% przychodów</div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .charts-section {
      margin-top: 2rem;
    }

    .charts-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .charts-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #2d3748;
      background: linear-gradient(45deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .charts-header p {
      margin: 0;
      color: #718096;
      font-size: 1.1rem;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
    }

    .chart-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .chart-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
    }

    .trend-card {
      grid-column: span 2;
    }

    .chart-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      color: white;
    }

    .pie-avatar {
      background: linear-gradient(45deg, #667eea, #764ba2);
    }

    .bar-avatar {
      background: linear-gradient(45deg, #4caf50, #66bb6a);
    }

    .trend-avatar {
      background: linear-gradient(45deg, #ff9800, #ffb74d);
    }

    .stats-avatar {
      background: linear-gradient(45deg, #9c27b0, #ba68c8);
    }

    /* Pie Chart */
    .pie-chart-container {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1rem;
    }

    .pie-chart {
      position: relative;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pie-center {
      position: absolute;
      background: white;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .total-amount {
      font-size: 1.2rem;
      font-weight: 700;
      color: #2d3748;
    }

    .total-label {
      font-size: 0.85rem;
      color: #718096;
    }

    .pie-legend {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .legend-content {
      flex: 1;
    }

    .legend-name {
      font-weight: 500;
      color: #2d3748;
    }

    .legend-value {
      font-size: 0.9rem;
      color: #718096;
    }

    /* Bar Chart */
    .bar-chart-container {
      padding: 1rem;
    }

    .bar-chart {
      display: flex;
      align-items: end;
      gap: 1rem;
      height: 200px;
      margin-bottom: 1rem;
    }

    .bar-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
    }

    .bar-label {
      font-size: 0.8rem;
      font-weight: 500;
      color: #4a5568;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .bars-container {
      display: flex;
      gap: 4px;
      flex: 1;
      align-items: end;
      width: 100%;
      justify-content: center;
    }

    .bar-wrapper {
      flex: 1;
      max-width: 20px;
      height: 100%;
      display: flex;
      align-items: end;
    }

    .bar {
      width: 100%;
      min-height: 2px;
      border-radius: 4px 4px 0 0;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .bar:hover {
      transform: scaleY(1.05);
    }

    .bar-total {
      font-size: 0.8rem;
      font-weight: 600;
      color: #2d3748;
      margin-top: 0.5rem;
    }

    .bar-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    /* Trend Chart Placeholder */
    .trend-chart-placeholder {
      padding: 3rem;
      text-align: center;
      background: #f8fafc;
      border-radius: 8px;
      border: 2px dashed #e2e8f0;
    }

    .trend-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      color: #718096;
    }

    .trend-info mat-icon {
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }

    .trend-info h4 {
      margin: 0 0 0.25rem 0;
      color: #4a5568;
    }

    .trend-info p {
      margin: 0;
      font-size: 0.9rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      padding: 1rem;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .stat-item:hover {
      background: #e8f4f8;
      transform: translateY(-1px);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .fixed-stat {
      background: linear-gradient(45deg, #4caf50, #66bb6a);
    }

    .variable-stat {
      background: linear-gradient(45deg, #ff9800, #ffb74d);
    }

    .avg-stat {
      background: linear-gradient(45deg, #2196f3, #42a5f5);
    }

    .percent-stat {
      background: linear-gradient(45deg, #9c27b0, #ba68c8);
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #718096;
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }

      .trend-card {
        grid-column: span 1;
      }
    }

    @media (max-width: 768px) {
      .pie-chart-container {
        flex-direction: column;
        gap: 1rem;
      }

      .pie-chart {
        width: 150px;
        height: 150px;
      }

      .pie-center {
        width: 90px;
        height: 90px;
      }

      .total-amount {
        font-size: 1rem;
      }

      .bar-chart {
        gap: 0.5rem;
        height: 150px;
      }

      .stats-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class ExpenseChartsComponent implements OnChanges {
  @Input() fixedExpenses: FixedExpenseResponse[] = [];
  @Input() variableExpenses: VariableExpenseResponse[] = [];
  @Input() expenseSummary: ExpenseSummaryResponse | null = null;
  @Input() showGross: boolean = false;
  @Input() currentPeriod: string = '';
  @Input() totalRevenue: number = 0;

  pieChartData: ChartData[] = [];
  categoryChartData: CategoryData[] = [];
  totalExpenses = 0;
  showTrendChart = false; // Set to true when historical data is available

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fixedExpenses'] || changes['variableExpenses'] || changes['showGross']) {
      this.updateChartData();
    }
  }

  private updateChartData(): void {
    this.calculateTotals();
    this.updatePieChartData();
    this.updateCategoryChartData();
  }

  private calculateTotals(): void {
    const fixedTotal = this.fixedExpenses.reduce((sum, expense) => {
      return sum + (this.showGross ? expense.grossAmount : expense.netAmount);
    }, 0);

    const variableTotal = this.variableExpenses.reduce((sum, expense) => {
      return sum + (this.showGross ? expense.grossAmount : expense.netAmount);
    }, 0);

    this.totalExpenses = fixedTotal + variableTotal;
  }

  private updatePieChartData(): void {
    const fixedTotal = this.fixedExpenses.reduce((sum, expense) => {
      return sum + (this.showGross ? expense.grossAmount : expense.netAmount);
    }, 0);

    const variableTotal = this.variableExpenses.reduce((sum, expense) => {
      return sum + (this.showGross ? expense.grossAmount : expense.netAmount);
    }, 0);

    const total = fixedTotal + variableTotal;

    this.pieChartData = [
      {
        name: 'Koszty stałe',
        value: fixedTotal,
        color: '#4caf50',
        percentage: total > 0 ? (fixedTotal / total) * 100 : 0
      },
      {
        name: 'Koszty zmienne',
        value: variableTotal,
        color: '#ff9800',
        percentage: total > 0 ? (variableTotal / total) * 100 : 0
      }
    ];
  }

  private updateCategoryChartData(): void {
    const categoryMap = new Map<string, { fixed: number, variable: number }>();

    // Process fixed expenses
    this.fixedExpenses.forEach(expense => {
      const amount = this.showGross ? expense.grossAmount : expense.netAmount;
      const existing = categoryMap.get(expense.category) || { fixed: 0, variable: 0 };
      categoryMap.set(expense.category, { ...existing, fixed: existing.fixed + amount });
    });

    // Process variable expenses
    this.variableExpenses.forEach(expense => {
      const amount = this.showGross ? expense.grossAmount : expense.netAmount;
      const existing = categoryMap.get(expense.category) || { fixed: 0, variable: 0 };
      categoryMap.set(expense.category, { ...existing, variable: existing.variable + amount });
    });

    const colors = [
      '#667eea', '#4caf50', '#ff9800', '#2196f3',
      '#9c27b0', '#f44336', '#ffeb3b', '#607d8b'
    ];

    this.categoryChartData = Array.from(categoryMap.entries())
      .map(([category, amounts], index) => ({
        category,
        fixedAmount: amounts.fixed,
        variableAmount: amounts.variable,
        totalAmount: amounts.fixed + amounts.variable,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  getPieChartStyle(): string {
    const fixedPercentage = this.pieChartData[0]?.percentage || 0;
    const variablePercentage = this.pieChartData[1]?.percentage || 0;

    const fixedDegrees = (fixedPercentage / 100) * 360;
    const variableDegrees = (variablePercentage / 100) * 360;

    return `background: conic-gradient(
      #4caf50 0deg ${fixedDegrees}deg,
      #ff9800 ${fixedDegrees}deg ${fixedDegrees + variableDegrees}deg
    );`;
  }

  getBarHeight(amount: number): number {
    if (this.categoryChartData.length === 0) return 0;
    const maxAmount = Math.max(...this.categoryChartData.map(c => Math.max(c.fixedAmount, c.variableAmount)));
    return maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
  }

  getAverageExpense(): number {
    const totalCount = this.fixedExpenses.length + this.variableExpenses.length;
    return totalCount > 0 ? this.totalExpenses / totalCount : 0;
  }

  getExpensePercentageOfRevenue(): number {
    return this.totalRevenue > 0 ? (this.totalExpenses / this.totalRevenue) * 100 : 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount || 0);
  }
}
