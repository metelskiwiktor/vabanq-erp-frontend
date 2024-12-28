import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {OfferEditDialogComponent} from "./offer-edit-dialog.component";
import {MatDialogActions, MatDialogContent, MatDialogTitle} from "@angular/material/dialog";
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatRow, MatRowDef,
  MatTable
} from "@angular/material/table";
import {FormsModule} from "@angular/forms";
import {MatButton} from "@angular/material/button";



@NgModule({
  declarations: [
    OfferEditDialogComponent,
  ],
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    FormsModule,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatDialogActions,
    MatButton
  ]
})
export class OfferEditDialogModule { }
