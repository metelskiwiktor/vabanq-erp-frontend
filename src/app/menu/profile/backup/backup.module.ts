import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackupComponent } from './backup.component';
import { BackupService } from "../../../utility/service/backup.service";

@NgModule({
  declarations: [
    BackupComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    BackupService
  ],
  exports: [
    BackupComponent
  ]
})
export class BackupModule { }
