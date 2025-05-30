import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {APP_INITIALIZER, LOCALE_ID, NgModule} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {AppRoutingModule} from "./app-routing.module";
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MatIconModule} from "@angular/material/icon";
import {MatListModule} from "@angular/material/list";
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatButtonModule} from "@angular/material/button";
import {MatMenuModule} from "@angular/material/menu";
import {MenuModule} from "./menu/menu.module";
import {BrowserModule} from "@angular/platform-browser";
import {LoginModule} from "./login/login.module";
import {KeycloakService} from "keycloak-angular";
import {environment} from "../environments/environment";
import {NgbToast} from "@ng-bootstrap/ng-bootstrap";
import {MatTabsModule} from "@angular/material/tabs";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {FormsModule} from "@angular/forms";
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { SharedModule } from './shared/shared.module';
import {AccountingComponent} from "./menu/accounting/accounting.component";
import {AccountingModule} from "./menu/accounting/accounting.module";
import {registerLocaleData} from "@angular/common";
import localePl from '@angular/common/locales/pl';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        realm: 'dev-erp-vabanq',
        url: environment.keycloakUrl,
        clientId: 'dev-erp-vabanq-angular'
      },
      initOptions: {
        onLoad: 'login-required',
        flow: 'standard'
      }
    });
}

registerLocaleData(localePl)

@NgModule({
  declarations: [AppComponent],
  imports: [
    MenuModule,
    LoginModule,
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    NgbToast,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    SharedModule,
    AccountingModule
  ],
  bootstrap: [AppComponent],
  providers: [
    {provide: LOCALE_ID, useValue: 'pl'},
    provideAnimationsAsync(),
    provideNgxMask()
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: initializeKeycloak,
    //   multi: true,
    //   deps: [KeycloakService]
    // }
  ],
  exports: []
})
export class AppModule {
}
