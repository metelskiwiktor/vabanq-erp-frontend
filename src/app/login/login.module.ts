import {APP_INITIALIZER, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LoginComponent} from "./login.component";
import {KeycloakAngularModule, KeycloakService} from "keycloak-angular";


@NgModule({
  declarations: [
    LoginComponent,
  ],
  imports: [
    CommonModule,
    KeycloakAngularModule
  ],
  providers: [

  ],
})
export class LoginModule {
}
