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
import {MatButton, MatIconButton} from "@angular/material/button";
import {NgSelectModule} from "@ng-select/ng-select";
import {MatIcon} from "@angular/material/icon";



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
    MatButton,
    NgSelectModule,
    MatIcon,
    MatIconButton
  ]
})
export class OfferEditDialogModule { }
