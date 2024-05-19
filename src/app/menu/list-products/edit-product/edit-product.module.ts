import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {EditProductComponent} from "./edit-product.component";
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from "@angular/material/dialog";
import {MatFormField, MatFormFieldModule} from "@angular/material/form-field";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";
import {MatInput} from "@angular/material/input";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow, MatRowDef, MatTable, MatTableModule
} from "@angular/material/table";
import {MatTabContent, MatTabsModule} from "@angular/material/tabs";
import {NgSelectModule} from "@ng-select/ng-select";
import {NgxDropzoneModule} from "ngx-dropzone";
import {AddProductModule} from "../../add-product/add-product.module";
import {MatIconModule} from "@angular/material/icon";
import {MatChipsModule} from "@angular/material/chips";
import {NgMultiSelectDropDownModule} from "ng-multiselect-dropdown";
import {NgxMaskDirective} from "ngx-mask";
import {ColorSketchModule} from "ngx-color/sketch";



@NgModule({
  declarations: [EditProductComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    NgxDropzoneModule,
    MatIconModule,
    MatChipsModule,
    NgMultiSelectDropDownModule,
    NgSelectModule,
    NgxMaskDirective,
    MatTableModule,
    ColorSketchModule,
    MatInput,
    NgSelectModule,
    NgxDropzoneModule,
    AddProductModule
  ]
})
export class EditProductModule { }
