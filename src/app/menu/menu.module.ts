import { NgModule } from '@angular/core';
import {MenuComponent} from "./menu.component";
import {MatSidenavModule} from "@angular/material/sidenav";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from "../app-routing.module";
import {AddProductModule} from "./add-item/add-product/add-product.module";
import {AllegroSynchronizationModule} from "./allegro-synchronization/allegro-synchronization.module";
import {WmsModule} from "./wms/wms.module";
import {EditWmsModule} from "./wms/edit-wms/edit-wms.module";
import {SettingsModule} from "./settings/settings.module";
import {AllegroSynchronizedModule} from "./allegro-synchronized/allegro-synchronized.module";
import {AddItemModule} from "./add-item/add-item.module";
import {ListItemsModule} from "./list-items/list-items.module";
import {MatTabsModule} from "@angular/material/tabs";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {GenerateEansModule} from "./items/generate-eans/generate-eans.module";
import {TestModule} from "./test/test.module";
@NgModule({
  imports: [
    AllegroSynchronizationModule,
    AllegroSynchronizedModule,
    WmsModule,
    EditWmsModule,
    SettingsModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatSidenavModule,
    AddItemModule,
    GenerateEansModule,
    TestModule,
    MatTabsModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    FormsModule
  ],
  declarations: [
    MenuComponent
  ],
  exports: [
    MenuComponent
  ]
})
export class MenuModule { }
