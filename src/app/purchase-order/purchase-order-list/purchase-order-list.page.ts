import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { PurchaseOrder } from '../model/purchase-order';
import { PurchaseOrderService } from '../purchase-order.service';
import { CommonService } from '../../shared/common.service';
import { AuthService } from '../../auth/auth.service';
import { PurchaseOrderDetailPage } from '../purchase-order-detail/purchase-order-detail.page';

@Component({
    templateUrl: 'purchase-order-list.page.html',
})
export class PurchaseOrderListPage implements OnInit {
    public purchaseOrderList: Array<PurchaseOrder>;
    public purchaseOrderListWOFilter: Array<PurchaseOrder>;
    public searchText: string;
    public recordCount: number = 0;

    constructor(
        public commonData: CommonService,
        private _purchaseOrderService: PurchaseOrderService,
        private _modalCtrl: ModalController) {
    }

    ngOnInit(): void {
        this.searchText = '';
        this.fetchData();
    }

    async fetchData(): Promise<void> {
        this._purchaseOrderService.getPurchaseOrderList(this.commonData.dealer?.dealerID || "").valueChanges()
            .forEach(orders => {
                // reset list
                this.purchaseOrderListWOFilter = new Array<PurchaseOrder>();

                for (const oneOrder of orders) {
                    const purchaseOrder = new PurchaseOrder();

                    purchaseOrder.orderID = oneOrder.orderID;
                    purchaseOrder.dealerID = oneOrder.dealerID;
                    purchaseOrder.orderNo = oneOrder.orderNo;
                    purchaseOrder.orderDate = new Date(oneOrder.orderDate);
                    purchaseOrder.stockDate = oneOrder.stockDate ? new Date(oneOrder.stockDate?.seconds * 1000) : null;
                    purchaseOrder.totalAmt = oneOrder.totalAmt;
                    purchaseOrder.totalQty = oneOrder.totalQty;

                    this.purchaseOrderListWOFilter.push(purchaseOrder);
                }

                this.recordCount = this.purchaseOrderListWOFilter.length;
                this.applyFilterOfSearchText();
            });

        Promise.resolve();
    }

    async doRefresh(event) {
        await this.fetchData();

        setTimeout(() => {
            event.target.complete();
        }, 50);
    }

    async dealerChanged() {
        await this.fetchData();
    }

    filterDataOnSearchText(ev: any) {
        // Search will be done against lower case to achieve case insensitive search.
        this.searchText = ev.target.value.trim().toLowerCase();

        // Call fetch method to filter serach text
        this.applyFilterOfSearchText();
    }

    /**Apply Search Text filter on the purchase order list.*/
    applyFilterOfSearchText(): void {
        if (this.searchText === '') {
            // No search text, hence copy WithOutFilter Purchase order
            this.purchaseOrderList = this.purchaseOrderListWOFilter;
        } else {
            // Clear the purchase order list
            this.purchaseOrderList = new Array<PurchaseOrder>();

            this.purchaseOrderListWOFilter.forEach(purchaseOrder => {
                // search text in orderNo and orderDate
                if (purchaseOrder.orderNo.toLowerCase().match(this.searchText) ||
                    purchaseOrder.orderDate.toDateString().toLowerCase().match(this.searchText)
                ) {
                    // Add matching purchase order
                    this.purchaseOrderList.push(purchaseOrder);
                }
            });
        }
        this.recordCount = this.purchaseOrderList.length;
    }

    async showPurchaseOrderDetail(purchaseOrder: PurchaseOrder) {
        // show the items to user for selection
        const modal = await this._modalCtrl.create({
            component: PurchaseOrderDetailPage,
            keyboardClose: true,
            componentProps: { purchaseOrder: purchaseOrder }
        });
        await modal.present();
    }
}
