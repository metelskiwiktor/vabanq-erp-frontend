import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AddMaterialComponent} from "./add-material/add-material.component";
import {AddProductComponent} from "./add-product/add-product.component";
import {AddItemComponent} from "./add-item.component";
import {MatTab, MatTabGroup} from "@angular/material/tabs";
import {AddMaterialModule} from "./add-material/add-material.module";
import {AddProductModule} from "./add-product/add-product.module";

@NgModule({
  declarations: [
    AddItemComponent,
  ],
  imports: [
    CommonModule,
    MatTab,
    MatTabGroup,
    AddMaterialModule,
    AddProductModule,
  ]
})
export class AddItemModule { }
