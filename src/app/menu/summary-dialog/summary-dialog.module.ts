import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {SummaryDialogComponent} from "./summary-dialog.component";
import {MatButton} from "@angular/material/button";
import {MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle} from "@angular/material/dialog";
import {MatList, MatListItem} from "@angular/material/list";

@NgModule({
  declarations: [
    SummaryDialogComponent,
  ],
  imports: [
    CommonModule,
    MatButton,
    MatDialogContent,
    MatList,
    MatListItem,
    MatDialogTitle,
    MatDialogActions,
    MatDialogClose
  ]
})
export class SummaryDialogModule { }
