// src/app/menu/accounting/accounting-invoices/expense/assign-invoice-dialog/assign-invoice-dialog.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

// Angular Material
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Component
import { AssignInvoiceDialogComponent } from './assign-invoice-dialog.component';

// Services
import { ExpenseService } from '../../../../../utility/service/expense.service';
import { ExpenseCategoryMapperService } from '../../../../../utility/service/expense-category-mapper.service';

@NgModule({
  declarations: [
    AssignInvoiceDialogComponent
  ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatRadioModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        FormsModule
    ],
  providers: [
    ExpenseService,
    ExpenseCategoryMapperService
  ],
  exports: [
    AssignInvoiceDialogComponent
  ]
})
export class AssignInvoiceDialogModule { }
