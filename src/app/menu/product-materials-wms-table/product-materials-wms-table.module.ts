import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ProductMaterialsWmsTableComponent} from "./product-materials-wms-table.component";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatSlideToggle} from "@angular/material/slide-toggle";



@NgModule({
  declarations: [
    ProductMaterialsWmsTableComponent,
  ],
  imports: [
    CommonModule,
    MatTable,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    MatSlideToggle,
    ReactiveFormsModule,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderRow,
    MatRow,
    MatRowDef,
    MatHeaderRowDef,
  ]
})
export class ProductMaterialsWmsTableModule { }
