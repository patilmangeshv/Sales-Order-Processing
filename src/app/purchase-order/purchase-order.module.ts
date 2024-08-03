import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../components/components.module';
import { PurchaseOrderRoutingModule } from './purchase-order-routing.module';
import { PurchaseOrderListPage } from './purchase-order-list/purchase-order-list.page';
import { PurchaseOrderDetailPage } from './purchase-order-detail/purchase-order-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    PurchaseOrderRoutingModule,
    ComponentsModule,
  ],
  declarations: [PurchaseOrderListPage, PurchaseOrderDetailPage]
})
export class PurchaseOrderModule { }
