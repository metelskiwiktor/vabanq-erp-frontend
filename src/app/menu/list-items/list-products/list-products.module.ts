import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListProductsComponent } from './list-products.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import {NgSelectModule} from "@ng-select/ng-select"; // Potrzebne do dwukierunkowego bindowania [(ngModel)]

@NgModule({
  declarations: [
    ListProductsComponent,
  ],
    imports: [
        CommonModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatButtonModule,
        FormsModule,
        NgSelectModule
    ],
  exports: [
    ListProductsComponent
  ]
})
export class ListProductsModule { }
