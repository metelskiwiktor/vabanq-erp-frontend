// src/app/menu/integrations/integrations.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationsComponent } from './integrations.component';
import { AllegroTokenService } from "../../utility/service/allegro-token.service";

@NgModule({
  declarations: [
    IntegrationsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  providers: [
    AllegroTokenService
  ],
  exports: [
    IntegrationsComponent
  ]
})
export class IntegrationsModule { }
