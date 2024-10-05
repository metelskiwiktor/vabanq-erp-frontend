import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DataSharingService, EditWmsComponent} from "./edit-wms.component";
import {MatTableModule} from "@angular/material/table";
import {MatIcon} from "@angular/material/icon";
import {MatButton, MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {AddProductModule} from "../../add-item/add-product/add-product.module";


@NgModule({
  declarations: [
    EditWmsComponent,
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatTableModule,
    MatButton,
    MatIcon,
    FormsModule,
  ],
  providers: [
    DataSharingService
  ]
})
export class EditWmsModule {
}
