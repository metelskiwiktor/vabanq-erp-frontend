import {NgModule} from '@angular/core';
import {AddProductComponent} from "./add-product.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {CommonModule, CurrencyPipe} from "@angular/common";
import {MatTabsModule} from '@angular/material/tabs';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {NgxDropzoneModule} from 'ngx-dropzone';
import {MatChipsModule} from '@angular/material/chips';
import {NgMultiSelectDropDownModule} from "ng-multiselect-dropdown";
import {NgSelectModule} from "@ng-select/ng-select";
import {NgxMaskDirective} from "ngx-mask";
import {CurrencyInputDirective} from "../../../utility/directive/currency-input.directive";
import {MatTableModule} from "@angular/material/table";
import {ColorSketchModule} from 'ngx-color/sketch';
import {TimeMaskDirective} from "../../../utility/directive/time-mask.directive";
import {DegreeMaskDirective} from "../../../utility/directive/degree-mask.directive";
import {PackageDimensionsDirective} from "../../../utility/directive/package-dimensions.directive";
import {UiMaskDirective} from "../../../utility/directive/ui-mask.directive";
import {MatInput} from "@angular/material/input";
import {ToastsContainer} from "../../../utility/service/toasts-container.component";

@NgModule({
  imports: [
    ToastsContainer,
    ReactiveFormsModule,
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatFormFieldModule,
    NgxDropzoneModule,
    MatIconModule,
    MatChipsModule,
    NgMultiSelectDropDownModule,
    NgSelectModule,
    NgxMaskDirective,
    MatTableModule,
    ColorSketchModule,
    MatInput,
  ],
  declarations: [
    AddProductComponent,
    CurrencyInputDirective,
    TimeMaskDirective,
    DegreeMaskDirective,
    PackageDimensionsDirective,
    UiMaskDirective
  ],
  exports: [
    TimeMaskDirective,
    AddProductComponent
  ],
  providers: [CurrencyPipe]
})
export class AddProductModule {
}
