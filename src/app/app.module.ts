import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {APP_INITIALIZER, LOCALE_ID, NgModule} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
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
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";
import {environment} from "../environments/environment";
import {NgbToast} from "@ng-bootstrap/ng-bootstrap";
import {MatTabsModule} from "@angular/material/tabs";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {FormsModule} from "@angular/forms";
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import {AccountingComponent} from "./menu/accounting/accounting.component";
import {AccountingModule} from "./menu/accounting/accounting.module";
import {registerLocaleData} from "@angular/common";
import localePl from '@angular/common/locales/pl';
import {AuthInterceptor} from "./login/auth.interceptor";
import {AddItemModule} from "./menu/add-item/add-item.module";
import {SharedMaterialModule} from "./shared-material/shared-material.module";
import {AllegroSynchronizedModule} from "./menu/allegro-synchronized/allegro-synchronized.module";
import {DashboardModule} from "./menu/dashboard/dashboard.module";
import {ListItemsModule} from "./menu/list-items/list-items.module";

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        realm: 'vabanq-platform',
        url: environment.keycloakUrl,
        clientId: 'vabanq-platform-frontend'
      },
      initOptions: {
        onLoad: 'login-required',
        flow: 'standard',
        /**
         * ← Wyłączamy check-login iframe (żeby Keycloak-JS
         *     nie odpytywał w tle o stan sesji).
         */
        checkLoginIframe: false,
        /**
         *  (opcjonalnie) wyłączamy też automatyczne odnawianie tokena co tzw. silent-check-sso,
         *  bo jeśli i to ma problemy z ciasteczkami, możemy to pominąć.
         */
      },
      /**
       * Jeśli używasz Keycloak-Angular 9+ i chcesz automatycznie
       * doklejać Bearer token do requestów do /api,
       * możesz zostawić poniżej pustą tablicę lub dowolne wartości:
       */
      bearerExcludedUrls: [
        // przykład: '/assets', '/public'
      ]
    });
}
registerLocaleData(localePl)

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,

    // Keycloak
    KeycloakAngularModule,

    // Material Design
    SharedMaterialModule,

    // App Modules
    MenuModule,

    // Bootstrap
    NgbToast
  ],
  bootstrap: [AppComponent],
  providers: [
    {provide: LOCALE_ID, useValue: 'pl'},
    provideAnimationsAsync(),
    provideNgxMask(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  exports: []
})
export class AppModule {
}
