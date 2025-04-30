import { NgModule } from '@angular/core';
import {MenuComponent} from "./menu.component";
import {MatSidenavModule} from "@angular/material/sidenav";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from "../app-routing.module";
import {AddProductModule} from "./add-item/add-product/add-product.module";
import {AllegroSynchronizationModule} from "./allegro-synchronization/allegro-synchronization.module";
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
import {ProductMaterialsWmsTableModule} from "./product-materials-wms-table/product-materials-wms-table.module";
import {SummaryDialogModule} from "./summary-dialog/summary-dialog.module";
import {DashboardModule} from "./dashboard/dashboard.module";
import {OrdersModule} from "./orders/orders.module";
@NgModule({
  imports: [
    AllegroSynchronizationModule,
    AllegroSynchronizedModule,
    ProductMaterialsWmsTableModule,
    SummaryDialogModule,
    DashboardModule,
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
    FormsModule,
    OrdersModule
  ],
  declarations: [
    MenuComponent
  ],
  exports: [
    MenuComponent
  ]
})
export class MenuModule { }
