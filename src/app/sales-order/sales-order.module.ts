import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../components/components.module';
import { SalesOrderRoutingModule } from './sales-order-routing.module';
import { SalesOrderListPage } from './sales-order-list/sales-order-list.page';
import { SalesOrderDetailPage } from './sales-order-detail/sales-order-detail.page';
import { SalesOrderListPageCopy } from './sales-order-list/sales-order-list.page copy';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SalesOrderRoutingModule,
    ComponentsModule,
  ],
  declarations: [SalesOrderListPage, SalesOrderDetailPage, SalesOrderListPageCopy]
})
export class SalesOrderModule { }
