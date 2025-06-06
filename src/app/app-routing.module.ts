import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {MenuComponent} from "./menu/menu.component";
import {SettingsComponent} from "./menu/settings/settings.component";
import {AllegroSynchronizedComponent} from "./menu/allegro-synchronized/allegro-synchronized.component";
import {AuthGuard} from "./utility/service/auth.guard";
import {AddItemComponent} from "./menu/add-item/add-item.component";
import {ListItemsComponent} from "./menu/list-items/list-items.component";
import {GenerateEansComponent} from "./menu/items/generate-eans/generate-eans.component";
import {TestComponent} from "./menu/test/test.component";
import {
  ProductMaterialsWmsTableComponent
} from "./menu/product-materials-wms-table/product-materials-wms-table.component";
import {DashboardComponent} from "./menu/dashboard/dashboard.component";
import {OrdersComponent} from "./menu/orders/orders.component";
import {AccountingComponent} from "./menu/accounting/accounting.component";
import {AccountingDashboardComponent} from "./menu/accounting/accounting-dashboard/accounting-dashboard.component";
import {AccountingInvoicesComponent} from "./menu/accounting/accounting-invoices/accounting-invoices.component";
import {AccountingExpensesComponent} from "./menu/accounting/accounting-expenses/accounting-expenses.component";


const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'add-item', component: AddItemComponent, canActivate: [AuthGuard] },
  { path: 'items', component: ListItemsComponent, canActivate: [AuthGuard] },
  { path: 'generate-eans', component: GenerateEansComponent, canActivate: [AuthGuard] },
  { path: 'test', component: TestComponent, canActivate: [AuthGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [AuthGuard] },
  { path: 'offers', component: AllegroSynchronizedComponent, canActivate: [AuthGuard] },
  { path: 'wms', component: ProductMaterialsWmsTableComponent, canActivate: [AuthGuard] },
  { path: 'accounting/dashboard', component: AccountingDashboardComponent, canActivate: [AuthGuard] },
  { path: 'accounting/invoices', component: AccountingInvoicesComponent, canActivate: [AuthGuard] },
  { path: 'accounting/expenses', component: AccountingExpensesComponent, canActivate: [AuthGuard] },
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
