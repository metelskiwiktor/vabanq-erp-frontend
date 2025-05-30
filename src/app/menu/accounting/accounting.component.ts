import { Component } from '@angular/core';
import {AccountingDashboardComponent} from "./accounting-dashboard/accounting-dashboard.component";
import {AccountingInvoicesComponent} from "./accounting-invoices/accounting-invoices.component";
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  styleUrl: './accounting.component.css'
})
export class AccountingComponent {
  activeTab: string = 'dashboard';

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}
