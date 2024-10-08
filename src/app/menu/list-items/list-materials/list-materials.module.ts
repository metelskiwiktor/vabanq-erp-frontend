import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListMaterialsComponent } from './list-materials.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";  // Dla ngModel

@NgModule({
  declarations: [
    ListMaterialsComponent,
  ],
  exports: [
    ListMaterialsComponent
  ],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    FormsModule,
    MatIcon,
    MatIconButton,
  ]
})
export class ListMaterialsModule { }
