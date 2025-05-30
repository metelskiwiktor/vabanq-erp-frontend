// src/app/menu/accounting/accounting.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Material imports
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

// Components
import { AccountingComponent } from './accounting.component';
import { AccountingDashboardComponent } from './accounting-dashboard/accounting-dashboard.component';
import { AccountingInvoicesComponent } from './accounting-invoices/accounting-invoices.component';
import {
  AccountingExpensesComponent,
  DeleteConfirmationDialogComponent,
  ExpenseDialogComponent
} from './accounting-expenses/accounting-expenses.component';

@NgModule({
  declarations: [
    AccountingComponent,
    AccountingDashboardComponent,
    AccountingInvoicesComponent,
    AccountingExpensesComponent,
    ExpenseDialogComponent,
    DeleteConfirmationDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule
  ],
  exports: [
    AccountingComponent
  ]
})
export class AccountingModule { }
