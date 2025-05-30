import {Component, OnInit} from '@angular/core';
import {DatePipe, NgClass, NgForOf} from "@angular/common";
import {MatIcon} from "@angular/material/icon";

// Mock data interfaces
interface RevenueData {
  date: string;
  revenue: number;
  prevRevenue: number;
  profit: number;
  prevProfit: number;
  orders: number;
}

interface CostItem {
  name: string;
  value: number;
  color: string;
}

interface MockInvoice {
  id: string;
  customer: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  source: 'own' | 'own-shop' | 'allegro-pl' | 'allegro-cz' | 'allegro-de';
}

@Component({
  selector: 'app-accounting-dashboard',
  templateUrl: './accounting-dashboard.component.html',
  styleUrl: './accounting-dashboard.component.css'
})
export class AccountingDashboardComponent implements OnInit {
  activePeriod: string = '30d';
  showFixedCosts: boolean = true;

  // Mock revenue data
  revenueData: RevenueData[] = [];

  // Mock cost data
  costBreakdown: CostItem[] = [
    { name: 'Materiały', value: 12500, color: '#8884d8' },
    { name: 'Praca', value: 8000, color: '#82ca9d' },
    { name: 'Media', value: 2000, color: '#ffc658' },
    { name: 'Marketing', value: 3500, color: '#ff8042' },
    { name: 'Wysyłka', value: 4000, color: '#0088fe' }
  ];

  fixedCosts: CostItem[] = [
    { name: 'Czynsz', value: 5000, color: '#8884d8' },
    { name: 'Pensje', value: 15000, color: '#82ca9d' },
    { name: 'Ubezpieczenie', value: 2000, color: '#ffc658' },
    { name: 'Oprogramowanie', value: 1000, color: '#ff8042' },
    { name: 'Media', value: 1500, color: '#0088fe' }
  ];

  // Mock recent invoices for preview
  recentInvoices: MockInvoice[] = [
    {
      id: 'INV-2023-0125',
      customer: 'Acme Corp',
      amount: 4500,
      date: '2023-05-01',
      status: 'Paid',
      source: 'own'
    },
    {
      id: 'INV-2023-0126',
      customer: 'TechStart Inc',
      amount: 3200,
      date: '2023-05-03',
      status: 'Paid',
      source: 'own'
    },
    {
      id: 'INV-2023-0127',
      customer: 'Global Services',
      amount: 7800,
      date: '2023-05-05',
      status: 'Pending',
      source: 'own-shop'
    },
    {
      id: 'INV-2023-0128',
      customer: 'Local Shop',
      amount: 950,
      date: '2023-05-08',
      status: 'Paid',
      source: 'allegro-pl'
    },
    {
      id: 'INV-2023-0129',
      customer: 'WebDesign Pro',
      amount: 3600,
      date: '2023-05-10',
      status: 'Overdue',
      source: 'allegro-cz'
    }
  ];

  // Calculated totals
  totalRevenue: number = 0;
  totalPreviousRevenue: number = 0;
  totalProfit: number = 0;
  totalOrders: number = 0;
  totalCosts: number = 0;
  totalFixedCosts: number = 0;

  ngOnInit(): void {
    this.generateMockRevenueData();
    this.calculateTotals();
  }

  generateMockRevenueData(): void {
    const data: RevenueData[] = [];

    for (let i = 0; i < 30; i++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - 29 + i);
      const day = currentDate.getDate();
      const month = currentDate.getMonth();

      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const baseValue = isWeekend ? 1500 : 3000;
      const variance = isWeekend ? 500 : 1000;

      const currentRevenue = Math.round(baseValue + Math.random() * variance);
      const currentProfit = Math.round(currentRevenue * (0.3 + Math.random() * 0.1));
      const prevRevenue = Math.round((baseValue + Math.random() * variance) * 0.85);
      const prevProfit = Math.round(prevRevenue * (0.25 + Math.random() * 0.1));

      const formattedDate = `${day}/${month + 1}`;

      data.push({
        date: formattedDate,
        revenue: currentRevenue,
        prevRevenue: prevRevenue,
        profit: currentProfit,
        prevProfit: prevProfit,
        orders: Math.round(currentRevenue / 150)
      });
    }

    this.revenueData = data;
  }

  calculateTotals(): void {
    this.totalRevenue = this.revenueData.reduce((sum, day) => sum + day.revenue, 0);
    this.totalPreviousRevenue = this.revenueData.reduce((sum, day) => sum + day.prevRevenue, 0);
    this.totalProfit = this.revenueData.reduce((sum, day) => sum + day.profit, 0);
    this.totalOrders = this.revenueData.reduce((sum, day) => sum + day.orders, 0);
    this.totalCosts = this.costBreakdown.reduce((sum, item) => sum + item.value, 0);
    this.totalFixedCosts = this.fixedCosts.reduce((sum, item) => sum + item.value, 0);
  }

  setActivePeriod(period: string): void {
    this.activePeriod = period;
    // Here you would typically reload data for the new period
  }

  toggleFixedCosts(): void {
    this.showFixedCosts = !this.showFixedCosts;
  }

  // Helper methods
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(value);
  }

  getStatusTranslation(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Paid': 'Zapłacona',
      'Pending': 'Oczekująca',
      'Overdue': 'Zaległa'
    };
    return statusMap[status] || status;
  }

  getStatusBadgeColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'Paid': 'status-paid',
      'Pending': 'status-pending',
      'Overdue': 'status-overdue'
    };
    return colorMap[status] || 'status-unknown';
  }

  getCombinedCostData(): CostItem[] {
    return this.showFixedCosts
      ? [...this.costBreakdown, ...this.fixedCosts]
      : this.costBreakdown;
  }

  // Navigation method to switch to invoices tab
  navigateToInvoices(): void {
    // This would typically emit an event to parent component
    // For now, we'll just log
    console.log('Navigate to invoices tab');
  }
}
