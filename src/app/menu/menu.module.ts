import { NgModule } from '@angular/core';
import {MenuComponent} from "./menu.component";
import {MatSidenavModule} from "@angular/material/sidenav";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from "../app-routing.module";
import {AddProductModule} from "./add-product/add-product.module";
import {ListProductsModule} from "./list-products/list-products.module";
import {AllegroSynchronizationModule} from "./allegro-synchronization/allegro-synchronization.module";
import {EditProductModule} from "./list-products/edit-product/edit-product.module";
import {WmsModule} from "./wms/wms.module";
import {EditWmsModule} from "./wms/edit-wms/edit-wms.module";
import {SettingsModule} from "./settings/settings.module";
import {AllegroSynchronizedModule} from "./allegro-synchronized/allegro-synchronized.module";
@NgModule({
  imports: [
    AllegroSynchronizationModule,
    AllegroSynchronizedModule,
    EditProductModule,
    WmsModule,
    EditWmsModule,
    SettingsModule,
    AddProductModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatSidenavModule,
    ListProductsModule
  ],
  declarations: [
    MenuComponent
  ],
  exports: [
    MenuComponent
  ]
})
export class MenuModule { }
