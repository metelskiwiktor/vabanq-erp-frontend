import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ListProductsComponent} from "./list-products.component";
import {MatButtonModule} from "@angular/material/button";
import {MatTableModule} from "@angular/material/table";


@NgModule({
  declarations: [
    ListProductsComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule
  ]
})
export class ListProductsModule {
}
