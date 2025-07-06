// src/app/menu/accounting/accounting.module.ts
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

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
import {AccountingExpensesComponent} from './accounting-expenses/accounting-expenses.component';

// Shared dialogs
import {MatChip, MatChipSet} from "@angular/material/chips";
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {
  AssignInvoiceToExpenseDialogComponent
} from "./accounting-invoices/expense/assign-invoice-to-expense-dialog/assign-invoice-to-expense-dialog.component";
import {
  CreateInvoiceExpenseDialogComponent
} from "./accounting-invoices/expense/create-invoice-expense-dialog/create-invoice-expense-dialog.component";
import {MatRadioButton} from "@angular/material/radio";
import {
  AssignInvoiceDialogModule
} from "./accounting-invoices/expense/assign-invoice-dialog/assign-invoice-dialog.module";

// Services
import { ExpenseService } from '../../utility/service/expense.service';

@NgModule({
  declarations: [
    // Main accounting components
    AccountingComponent,
    AccountingDashboardComponent,
    AccountingInvoicesComponent,
    AccountingExpensesComponent,
    AssignInvoiceToExpenseDialogComponent,
    CreateInvoiceExpenseDialogComponent,
  ],
  imports: [
    AssignInvoiceDialogModule,
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
    MatProgressSpinner,
    ReactiveFormsModule,
    MatRadioButton
  ],
  providers: [
    ExpenseService
  ],
  exports: [
    AccountingComponent
  ]
})
export class AccountingModule {
}
