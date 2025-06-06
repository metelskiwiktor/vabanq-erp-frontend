// src/app/menu/orders/dialogs/orders-dialogs.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InvoiceGenerationDialogComponent } from './invoice-generation-dialog/invoice-generation-dialog.component';
import { AllegroAttachmentDialogComponent } from './allegro-attachment-dialog/allegro-attachment-dialog.component';

@NgModule({
  declarations: [
    InvoiceGenerationDialogComponent,
    AllegroAttachmentDialogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  exports: [
    InvoiceGenerationDialogComponent,
    AllegroAttachmentDialogComponent
  ]
})
export class OrdersDialogsModule { }
