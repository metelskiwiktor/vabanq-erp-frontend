import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListProductsComponent } from './list-products.component';
import { NgSelectModule } from "@ng-select/ng-select";
import { SharedMaterialModule } from "../../../shared-material/shared-material.module";

@NgModule({
  declarations: [
    ListProductsComponent,
  ],
    imports: [
        CommonModule,
        FormsModule,
        NgSelectModule,
        SharedMaterialModule
    ],
  exports: [
    ListProductsComponent
  ]
})
export class ListProductsModule { }
