import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {WmsComponent} from "./wms.component";
import {MatTableModule} from "@angular/material/table";
import {MatButton, MatButtonModule} from "@angular/material/button";
import {MatIcon} from "@angular/material/icon";
import {MatSort} from "@angular/material/sort";



@NgModule({
  declarations: [
    WmsComponent
  ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatTableModule,
        MatButton,
        MatIcon,
        MatSort
    ]
})
export class WmsModule { }
