import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PurchaseOrderDetailPage } from './purchase-order-detail/purchase-order-detail.page';
import { PurchaseOrderListPage } from './purchase-order-list/purchase-order-list.page';

const routes: Routes = [
  { path: '', redirectTo: 'list', pathMatch: 'full' 
  },
  {
    path: 'list',
    component: PurchaseOrderListPage
  },
  {
    path: 'detail/:purchaseOrderID',
    component: PurchaseOrderDetailPage
  },
  {
    path: 'detail',
    component: PurchaseOrderDetailPage
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseOrderRoutingModule { }
