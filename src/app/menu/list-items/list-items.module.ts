import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ListItemsComponent} from "./list-items.component";
import {MatTab, MatTabGroup, MatTabsModule} from "@angular/material/tabs";
import {ListProductsModule} from "./list-products/list-products.module";
import {ListMaterialsComponent} from "./list-materials/list-materials.component";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormField, MatFormFieldModule, MatLabel} from "@angular/material/form-field";
import {MatInput, MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableModule
} from "@angular/material/table";
import {NgxDropzoneModule} from "ngx-dropzone";
import {MatIconModule} from "@angular/material/icon";
import {MatChipsModule} from "@angular/material/chips";
import {NgMultiSelectDropDownModule} from "ng-multiselect-dropdown";
import {NgSelectModule} from "@ng-select/ng-select";
import {NgxMaskDirective} from "ngx-mask";
import {ColorSketchModule} from "ngx-color/sketch";
import {ListMaterialsModule} from "./list-materials/list-materials.module";


@NgModule({
  declarations: [
    ListItemsComponent,
  ],
  imports: [
    CommonModule,
    MatTabGroup,
    ListProductsModule,
    MatTab,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    ListMaterialsModule
  ]
})
export class ListItemsModule { }
