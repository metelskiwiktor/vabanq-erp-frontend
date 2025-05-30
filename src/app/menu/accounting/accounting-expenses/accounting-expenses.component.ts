// src/app/menu/accounting/accounting-expenses/accounting-expenses.component.ts
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-accounting-expenses',
  templateUrl: './accounting-expenses.component.html',
  styleUrl: './accounting-expenses.component.css'
})
export class AccountingExpensesComponent implements OnInit {
  activeTab: string = 'company';
  isLoading: boolean = false;

  // Date selection properties
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
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

  constructor() { }

  ngOnInit(): void {
    this.initializeYears();
    this.updateCurrentMonth();
  }

  private initializeYears(): void {
    const currentYear = new Date().getFullYear();
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
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
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
