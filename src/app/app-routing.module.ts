import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {MenuComponent} from "./menu/menu.component";
import {AddProductComponent} from "./menu/add-product/add-product.component";
import {ListProductsComponent} from "./menu/list-products/list-products.component";


export const routes: Routes = [
  { path: '', component: MenuComponent },
  { path: 'add-product', component: AddProductComponent },
  { path: 'products', component: ListProductsComponent },
  { path: 'allegro', component: MenuComponent },
  { path: '**', redirectTo: '' },
]

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
