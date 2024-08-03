import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../auth/auth.guard';
import { ItemListPage } from './item-list/item-list.page';
import { ItemDetailEditPage } from './item-detail-edit/item-detail-edit.page';
import { ItemOrderListPage } from './item-order-list/item-order-list.page';
import { ItemStockPriceListPage } from './item-stock-price-list/item-stock-price-list.page';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' },
  {
    path: 'list',
    component: ItemListPage,
    canActivate: [AuthGuard],
  },
  {
    path: 'item-order-list',
    component: ItemOrderListPage,
  },
  {
    path: 'detail',
    component: ItemDetailEditPage,
    canActivate: [AuthGuard],
  },
  {
    path: 'detail/:itemID',
    component: ItemDetailEditPage,
    canActivate: [AuthGuard],
  },
  {
    path: 'item-stock-price-list',
    component: ItemStockPriceListPage,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemRoutingModule { }
