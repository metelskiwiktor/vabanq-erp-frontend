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
  MatTable, MatTableModule
} from "@angular/material/table";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule, MatIconButton} from "@angular/material/button";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {NgSelectModule} from "@ng-select/ng-select";
import {MatSort, MatSortHeader} from "@angular/material/sort";
import {MatIcon} from "@angular/material/icon";



@NgModule({
  declarations: [
    ProductMaterialsWmsTableComponent,
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    FormsModule,
    MatIcon,
    MatIconButton,
    MatSort,
    MatSortHeader,
    NgSelectModule,
    MatSlideToggle,
    ReactiveFormsModule,
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
    NgSelectModule,
    MatSort,
  ]
})
export class ProductMaterialsWmsTableModule { }
