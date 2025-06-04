import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from "./settings.component";
import { AllegroTokenService } from "../../utility/service/allegro-token.service";

@NgModule({
  declarations: [
    SettingsComponent,
  ],
  imports: [
    CommonModule
  ],
  providers: [
    AllegroTokenService
  ]
})
export class SettingsModule { }
