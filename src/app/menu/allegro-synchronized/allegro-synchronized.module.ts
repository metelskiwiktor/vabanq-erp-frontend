import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AllegroSynchronizedComponent} from "./allegro-synchronized.component";
import {MatNestedTreeNode, MatTree, MatTreeModule} from "@angular/material/tree";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";



@NgModule({
  declarations: [
    AllegroSynchronizedComponent,
  ],
  imports: [
    CommonModule,
    MatTreeModule,
    MatIcon,
    MatIconButton,
    MatTable,
    MatHeaderCell,
    MatColumnDef,
    MatCellDef,
    MatHeaderCellDef,
    MatCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRow,
    MatRowDef
  ]
})
export class AllegroSynchronizedModule { }
