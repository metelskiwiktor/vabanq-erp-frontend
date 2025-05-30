import {Component, OnInit} from '@angular/core';
import {
  MatCell, MatCellDef, MatColumnDef, MatFooterCell, MatFooterRow,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef, MatTable
} from "@angular/material/table";
import {NgClass, NgIf} from "@angular/common";
import {MatCheckbox} from "@angular/material/checkbox";
import {FormsModule} from "@angular/forms";
import {MatFormField, MatLabel} from "@angular/material/form-field";
import {MatIcon} from "@angular/material/icon";
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from "@angular/material/card";
import {MatButton, MatIconButton} from "@angular/material/button";
import {MatTooltip} from "@angular/material/tooltip";
import {MatInput} from "@angular/material/input";
import {MatSelect} from "@angular/material/select";
import {MatOption} from "@angular/material/core";

interface FixedExpense {
  id: number;
  category: string;
  name: string;
  amount: number;
  month: string;
  lastUpdated: string;
}

interface VariableExpense {
  id: number;
  category: string;
  name: string;
  amount: number;
  date: string;
  supplier: string;
}

interface Product {
  id: number;
  name: string;
  ean: string;
  materialCost: number;
  powerCost: number;
  packagingCost: number;
  laborCost: number;
  totalCost: number;
  retailPrice: number;
  margin: number;
}

interface Offer {
  id: number;
  name: string;
  productsIncluded: string;
  totalCost: number;
  offerPrice: number;
  margin: number;
}

interface MonthYear {
  month: number;
  year: number;
  displayName: string;
}

@Component({
  selector: 'app-accounting-expenses',
  templateUrl: './accounting-expenses.component.html',
  styleUrl: './accounting-expenses.component.css'
})
export class AccountingExpensesComponent implements OnInit {
  activeTab: string = 'company';
  activeSubTab: string = 'fixed';
  productSubTab: string = 'products';
  searchQuery: string = '';
  showGross: boolean = true;

  // Date selection properties
  selectedMonth: number = 6; // June
  selectedYear: number = 2023;
  currentMonth: string = '';

  // Available months and years
  months: Array<{value: number, name: string}> = [
    { value: 1, name: 'Styczeń' },
    { value: 2, name: 'Luty' },
    { value: 3, name: 'Marzec' },
    { value: 4, name: 'Kwiecień' },
    { value: 5, name: 'Maj' },
    { value: 6, name: 'Czerwiec' },
    { value: 7, name: 'Lipiec' },
    { value: 8, name: 'Sierpień' },
    { value: 9, name: 'Wrzesień' },
    { value: 10, name: 'Październik' },
    { value: 11, name: 'Listopad' },
    { value: 12, name: 'Grudzień' }
  ];

  years: number[] = [];

  fixedExpenses: FixedExpense[] = [
    { id: 1, category: 'Biuro', name: 'Czynsz', amount: 2500, month: 'Czerwiec 2023', lastUpdated: '2023-06-01' },
    { id: 2, category: 'Biuro', name: 'Internet', amount: 150, month: 'Czerwiec 2023', lastUpdated: '2023-06-01' },
    { id: 3, category: 'Opłaty', name: 'Księgowość', amount: 350, month: 'Czerwiec 2023', lastUpdated: '2023-06-01' },
    { id: 4, category: 'Biuro', name: 'Prąd', amount: 420, month: 'Czerwiec 2023', lastUpdated: '2023-06-01' },
    { id: 5, category: 'Biuro', name: 'Ogrzewanie', amount: 300, month: 'Czerwiec 2023', lastUpdated: '2023-06-01' }
  ];

  variableExpenses: VariableExpense[] = [
    { id: 6, category: 'Materiały', name: 'Filament PLA czarny', amount: 150, date: '2023-06-05', supplier: 'FilamentWorld' },
    { id: 7, category: 'Materiały', name: 'Filament PETG transparent', amount: 180, date: '2023-06-05', supplier: 'FilamentWorld' },
    { id: 8, category: 'Materiały', name: 'Kartony 20x20x10', amount: 120, date: '2023-06-03', supplier: 'PackagingPro' },
    { id: 9, category: 'Materiały', name: 'Elementy złączne M4', amount: 45, date: '2023-06-02', supplier: 'HardwareShop' },
    { id: 10, category: 'Biuro', name: 'Artykuły biurowe', amount: 80, date: '2023-06-02', supplier: 'OfficeSupplies' }
  ];

  products: Product[] = [
    {
      id: 1,
      name: 'Znacznik magnetyczny',
      ean: '5901234123457',
      materialCost: 6.65,
      powerCost: 0.40,
      packagingCost: 1.20,
      laborCost: 6.25,
      totalCost: 14.50,
      retailPrice: 29.99,
      margin: 51.65
    },
    {
      id: 2,
      name: 'Organizer na biurko',
      ean: '5901234123458',
      materialCost: 22.35,
      powerCost: 0.96,
      packagingCost: 2.50,
      laborCost: 12.50,
      totalCost: 38.31,
      retailPrice: 59.99,
      margin: 36.14
    },
    {
      id: 3,
      name: 'Uchwyt na słuchawki',
      ean: '5901234123459',
      materialCost: 17.80,
      powerCost: 0.64,
      packagingCost: 1.80,
      laborCost: 8.75,
      totalCost: 28.99,
      retailPrice: 49.99,
      margin: 42.01
    }
  ];

  offers: Offer[] = [
    {
      id: 1,
      name: 'Zestaw biurkowy Premium',
      productsIncluded: 'Organizer na biurko, Uchwyt na słuchawki, Stojak na telefon',
      totalCost: 84.53,
      offerPrice: 129.99,
      margin: 34.97
    },
    {
      id: 2,
      name: 'Zestaw magnetycznych organizerów',
      productsIncluded: 'Znacznik magnetyczny (5 szt.)',
      totalCost: 72.50,
      offerPrice: 129.99,
      margin: 44.23
    }
  ];

  constructor() { }

  ngOnInit(): void {
    this.initializeYears();
    this.updateCurrentMonth();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
    // Generate years from 2020 to current year + 2
    for (let year = 2020; year <= currentYear + 2; year++) {
      this.years.push(year);
    }
  }

  private updateCurrentMonth(): void {
    const monthName = this.months.find(m => m.value === this.selectedMonth)?.name || '';
    this.currentMonth = `${monthName} ${this.selectedYear}`;
  }

  onMonthYearChange(): void {
    this.updateCurrentMonth();
    // Here you would typically reload data for the selected month/year
    console.log(`Loading data for ${this.currentMonth}`);
    // TODO: Call API to load expenses for selected month/year
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  setActiveSubTab(subTab: string): void {
    this.activeSubTab = subTab;
  }

  setProductSubTab(subTab: string): void {
    this.productSubTab = subTab;
  }

  toggleGross(): void {
    this.showGross = !this.showGross;
  }

  formatCurrency(value: number): string {
    const adjustedValue = this.showGross ? value : value / 1.23;
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(adjustedValue);
  }

  getFixedExpensesTotal(): number {
    const total = this.fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return this.showGross ? total : total / 1.23;
  }

  getVariableExpensesTotal(): number {
    const total = this.variableExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    return this.showGross ? total : total / 1.23;
  }

  getTotalExpenses(): number {
    return this.getFixedExpensesTotal() + this.getVariableExpensesTotal();
  }

  getMarginClass(margin: number): string {
    if (margin > 45) return 'margin-high';
    if (margin > 30) return 'margin-medium';
    return 'margin-low';
  }

  addExpense(): void {
    // Implementacja dodawania wydatku
    console.log('Dodaj wydatek');
  }

  editExpense(id: number): void {
    console.log('Edytuj wydatek:', id);
  }

  deleteExpense(id: number): void {
    console.log('Usuń wydatek:', id);
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;
  }

  // Navigation methods for quick month/year changes
  goToPreviousMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.onMonthYearChange();
  }

  goToNextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.onMonthYearChange();
  }

  goToCurrentMonth(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.onMonthYearChange();
  }
}
