import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AddMaterialComponent} from "./add-material.component";
import {ColorSketchModule} from "ngx-color/sketch";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatTab, MatTabContent} from "@angular/material/tabs";
import {NgSelectModule} from "@ng-select/ng-select";
import {ToastsContainer} from "../../../utility/service/toasts-container.component";
import {NgxMaskDirective} from "ngx-mask";



@NgModule({
  declarations: [
    AddMaterialComponent,
  ],
  exports: [
    AddMaterialComponent
  ],
    imports: [
        CommonModule,
        ColorSketchModule,
        FormsModule,
        MatTab,
        MatTabContent,
        NgSelectModule,
        ReactiveFormsModule,
        ToastsContainer,
        NgxMaskDirective
    ]
})
export class AddMaterialModule { }
