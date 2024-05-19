import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AllegroSynchronizedComponent} from "./allegro-synchronized.component";
import {MatNestedTreeNode, MatTree, MatTreeModule} from "@angular/material/tree";
import {MatIcon} from "@angular/material/icon";
import {MatIconButton} from "@angular/material/button";



@NgModule({
  declarations: [
    AllegroSynchronizedComponent,
  ],
  imports: [
    CommonModule,
    MatTreeModule,
    MatIcon,
    MatIconButton
  ]
})
export class AllegroSynchronizedModule { }
