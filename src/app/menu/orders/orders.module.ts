import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdersComponent } from "./orders.component";
import { OrderItemComponent } from "./order-item/order-item.component";
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

@NgModule({
  declarations: [
    OrdersComponent,
    OrderItemComponent
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
    MatButton
  ],
  providers: [
    InfaktService
  ]
})
export class OrdersModule { }
