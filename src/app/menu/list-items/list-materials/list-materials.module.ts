import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListMaterialsComponent } from './list-materials.component';
import { SharedMaterialModule } from "../../../shared-material/shared-material.module";

@NgModule({
  declarations: [
    ListMaterialsComponent,
  ],
  exports: [
    ListMaterialsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedMaterialModule
  ]
})
export class ListMaterialsModule { }
