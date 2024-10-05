import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ListItemsComponent} from "./list-items.component";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {ListProductsModule} from "./list-products/list-products.module";
import {ListMaterialsComponent} from "./list-materials/list-materials.component";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";



@NgModule({
  declarations: [
    ListItemsComponent
  ],
  imports: [
    CommonModule,
    MatTabGroup,
    ListProductsModule,
    MatTab,
    ListMaterialsComponent,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    FormsModule
  ]
})
export class ListItemsModule { }
