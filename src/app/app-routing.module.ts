import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {MenuComponent} from "./menu/menu.component";
import {AddProductComponent} from "./menu/add-product/add-product.component";
import {ListProductsComponent} from "./menu/list-products/list-products.component";
import {AllegroSynchronizationComponent} from "./menu/allegro-synchronization/allegro-synchronization.component";
import {WmsComponent} from "./menu/wms/wms.component";
import {SettingsComponent} from "./menu/settings/settings.component";
import {AllegroSynchronizedComponent} from "./menu/allegro-synchronized/allegro-synchronized.component";
import {AuthGuard} from "./utility/service/auth.guard";


const routes: Routes = [
  { path: '', component: MenuComponent, canActivate: [AuthGuard] }, // Zabezpieczamy komponent MenuComponent
  { path: 'add-product', component: AddProductComponent, canActivate: [AuthGuard] },
  { path: 'products', component: ListProductsComponent, canActivate: [AuthGuard] },
  { path: 'allegro-synchronization', component: AllegroSynchronizationComponent, canActivate: [AuthGuard] },
  { path: 'allegro-synchronized', component: AllegroSynchronizedComponent, canActivate: [AuthGuard] },
  { path: 'wms', component: WmsComponent, canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  // { path: 'login', component: LoginComponent }, // Nie wymagamy zalogowania się na stronie logowania
  { path: '**', redirectTo: '' },
];

const config: ExtraOptions = {
  useHash: true,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
