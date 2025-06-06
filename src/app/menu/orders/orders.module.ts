import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersComponent } from "./orders.component";
import { HttpClientModule } from '@angular/common/http';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from "@angular/material/table";
import { MatButton } from "@angular/material/button";
import { InfaktService } from "../../utility/service/infakt.service";
import { MatDialogModule } from '@angular/material/dialog';
import { OrdersDialogsModule } from './dialogs/orders-dialogs.module';

@NgModule({
  declarations: [
    OrdersComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatRow,
    MatHeaderRow,
    MatRowDef,
    MatHeaderRowDef,
    MatHeaderCellDef,
    MatButton,
    MatDialogModule,
    OrdersDialogsModule
  ],
  providers: [
    InfaktService
  ]
})
export class OrdersModule { }
