// src/app/menu/accounting/accounting.module.ts
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

// Material imports
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {MatTableModule} from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';

// Main components
import {AccountingComponent} from './accounting.component';
import {AccountingDashboardComponent} from './accounting-dashboard/accounting-dashboard.component';
import {AccountingInvoicesComponent} from './accounting-invoices/accounting-invoices.component';

// Expenses components
import {AccountingExpensesComponent} from './accounting-expenses/accounting-expenses.component';
import {CompanyExpensesComponent} from './accounting-expenses/company-expenses/company-expenses.component';
import {FixedExpensesComponent} from './accounting-expenses/fixed-expenses/fixed-expenses.component';
import {VariableExpensesComponent} from './accounting-expenses/variable-expenses/variable-expenses.component';
import {ProductExpensesComponent} from './accounting-expenses/product-expenses/product-expenses.component';
import {ProductCostsTableComponent} from './accounting-expenses/product-costs-table/product-costs-table.component';
import {OfferCostsTableComponent} from './accounting-expenses/offer-costs-table/offer-costs-table.component';

// Power expense components
import {PowerExpenseComponent} from './accounting-expenses/power-expense/power-expense.component';

// Shared dialogs
import {
  ExpenseDialogComponent,
  DeleteConfirmationDialogComponent
} from './accounting-expenses/shared/expense-dialogs.component';
import {PowerExpenseDialogComponent} from './accounting-expenses/shared/power-expense-dialog.component';
import {AddExpenseDialogComponent} from "./accounting-expenses/shared/add-expense-dialog.component";
import {ExpenseChartsComponent} from "./accounting-expenses/components/expense-charts.component";
import {MatChip, MatChipSet} from "@angular/material/chips";
import {MatProgressSpinner} from "@angular/material/progress-spinner";

@NgModule({
  declarations: [
    // Main accounting components
    AccountingComponent,
    AccountingDashboardComponent,
    AccountingInvoicesComponent,

    // Expenses components
    AccountingExpensesComponent,
    CompanyExpensesComponent,
    FixedExpensesComponent,
    VariableExpensesComponent,
    ProductExpensesComponent,
    ProductCostsTableComponent,
    OfferCostsTableComponent,

    // Power expense components
    PowerExpenseComponent,

    // Shared dialogs
    AddExpenseDialogComponent,
    ExpenseDialogComponent,
    DeleteConfirmationDialogComponent,
    PowerExpenseDialogComponent,
    ExpenseChartsComponent
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
    MatTooltipModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipSet,
    MatChip,
    MatProgressSpinner
  ],
  exports: [
    AccountingComponent
  ]
})
export class AccountingModule {
}
