import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {APP_INITIALIZER, NgModule} from '@angular/core';
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
  ],
  bootstrap: [AppComponent],
  providers: [
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    }
  ],
  exports: []
})
export class AppModule {
}
