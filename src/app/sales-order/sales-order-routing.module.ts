import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SalesOrderListPage } from './sales-order-list/sales-order-list.page';

const routes: Routes = [
  {
    path: '',
    component: SalesOrderListPage
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SalesOrderRoutingModule { }
