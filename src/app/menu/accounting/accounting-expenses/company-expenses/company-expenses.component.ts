// src/app/menu/accounting/accounting-expenses/company-expenses/company-expenses.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-company-expenses',
  templateUrl: './company-expenses.component.html',
  styleUrls: [
    './company-expenses.component.css',
    '../shared/expenses-shared.styles.css']
})
export class CompanyExpensesComponent implements OnInit, OnChanges {
  @Input() selectedMonth!: number;
  @Input() selectedYear!: number;
  @Input() currentMonth!: string;

  activeSubTab: string = 'fixed';
  searchQuery: string = '';
  showGross: boolean = true;

  constructor() { }

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] || changes['selectedYear']) {
      // Reload data when month/year changes
      this.loadData();
    }
  }

  private loadData(): void {
    // Load data based on selected month/year
    console.log(`Loading company expenses for ${this.selectedMonth}/${this.selectedYear}`);
  }

  setActiveSubTab(subTab: string): void {
    this.activeSubTab = subTab;
  }

  toggleGross(): void {
    this.showGross = !this.showGross;
  }

  onSearchChange(event: any): void {
    this.searchQuery = event.target.value;
  }
}
