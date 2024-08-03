import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../components/components.module';
import { ItemListPage } from './item-list/item-list.page';
import { ItemDetailEditPage } from './item-detail-edit/item-detail-edit.page'
import { ItemPackageDetailEditPage } from './item-package-detail-edit/item-package-detail-edit.page'
import { ItemDetailEditOLDPage } from './item-detail-editOLD/item-detail-edit.page';

import { ItemOrderListPage } from './item-order-list/item-order-list.page';
import { ItemStockPriceListPage } from './item-stock-price-list/item-stock-price-list.page';
import { ItemStockPriceEditPage } from './item-stock-price-edit/item-stock-price-edit.page';
import { ItemPurchaseListPage } from './item-purchase-list/item-purchase-list.page';
import { ItemRoutingModule } from './item-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ItemRoutingModule,
    ComponentsModule,
  ],
  exports: [
    ItemListPage,
    ItemDetailEditPage,
    ItemPackageDetailEditPage,
    ItemOrderListPage,
    ItemPurchaseListPage,
    ItemStockPriceListPage,
    ItemStockPriceEditPage,
  ],
  declarations: [ItemListPage,
    ItemDetailEditPage,
    ItemPackageDetailEditPage,
    ItemDetailEditOLDPage, //to be deleted
    ItemOrderListPage,
    ItemPurchaseListPage,
    ItemStockPriceListPage,
    ItemStockPriceEditPage,
  ]
})
export class ItemModule { }
export { ItemOrderListPage } from './item-order-list/item-order-list.page';
