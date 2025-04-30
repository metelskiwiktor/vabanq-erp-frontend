import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TestComponent} from "./test.component";
import {FormsModule} from "@angular/forms";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatCardModule} from "@angular/material/card";
import {MatButtonModule} from "@angular/material/button";
import {NgSelectModule} from "@ng-select/ng-select";
import {NgxGraphModule} from "@swimlane/ngx-graph";

@NgModule({
  declarations: [
    TestComponent
  ],
    imports: [
        CommonModule,
        MatToolbarModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatButtonModule,
        FormsModule,
        NgSelectModule,
        NgxGraphModule
    ]
})
export class TestModule { }
