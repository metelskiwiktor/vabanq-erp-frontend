import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MenuComponent} from "./menu.component";
import {MatSidenavModule} from "@angular/material/sidenav";
import {BrowserModule} from "@angular/platform-browser";
import {HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from "../app-routing.module";
import {SettingsModule} from "./settings/settings.module";
import {IntegrationsModule} from "./integrations/integrations.module";
import {AllegroSynchronizedModule} from "./allegro-synchronized/allegro-synchronized.module";
import {AddItemModule} from "./add-item/add-item.module";
import {MatTabsModule} from "@angular/material/tabs";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {GenerateEansModule} from "./items/generate-eans/generate-eans.module";
import {TestModule} from "./test/test.module";
import {ProductMaterialsWmsTableModule} from "./product-materials-wms-table/product-materials-wms-table.module";
import {SummaryDialogModule} from "./summary-dialog/summary-dialog.module";
import {DashboardModule} from "./dashboard/dashboard.module";
import {OrdersModule} from "./orders/orders.module";
import {AllegroTokenService} from "../utility/service/allegro-token.service";
import {BackupModule} from "./profile/backup/backup.module";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AllegroSynchronizedModule,
    ProductMaterialsWmsTableModule,
    SummaryDialogModule,
    DashboardModule,
    SettingsModule,
    IntegrationsModule,
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
    OrdersModule,
    BackupModule
  ],
  declarations: [
    MenuComponent
  ],
  exports: [
    MenuComponent
  ],
  providers: [
    AllegroTokenService
  ]
})
export class MenuModule {
}
