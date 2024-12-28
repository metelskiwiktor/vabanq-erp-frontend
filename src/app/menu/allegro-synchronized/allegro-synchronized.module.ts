import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AllegroSynchronizedComponent} from "./allegro-synchronized.component";
import {MatNestedTreeNode, MatTree, MatTreeModule} from "@angular/material/tree";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatIconButton} from "@angular/material/button";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";
import {OfferEditDialogModule} from "./offer-edit-dialog/offer-edit-dialog.module";


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
    MatRowDef,
    MatButton,
    OfferEditDialogModule,
  ]
})
export class AllegroSynchronizedModule {
}
