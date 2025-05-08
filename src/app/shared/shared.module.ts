import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';

import { NotesButtonComponent } from './notes-button/notes-button.component';
import { NotesDialogComponent } from './notes-dialog/notes-dialog.component';

@NgModule({
  declarations: [
    NotesButtonComponent,
    NotesDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule
  ],
  exports: [
    NotesButtonComponent
  ]
})
export class SharedModule { }
