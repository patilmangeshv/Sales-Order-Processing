import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AlertController, ModalController, NavParams } from '@ionic/angular';

import { ItemStockPrice, OrderItem } from '../model/item';
import { ItemsService } from '../item.service';
import { DealerService } from '../../dealer/dealer.service';
import { CommonService } from '../../shared/common.service';

@Component({
    selector: 'item-stock-price-list.page',
    templateUrl: 'item-stock-price-list.page.html',
    // styleUrls: ['item-stock-price-list.page.scss'],
})
export class ItemStockPriceListPage implements OnInit, OnDestroy {
    public itemList: Array<ItemStockPrice>;
    public itemListWOFilter: Array<ItemStockPrice>;
    public itemListSelected: Array<OrderItem>;
    public searchText: string;
    public recordCount: number = 0;
    public recordCountSelected: number = 0;
    public totalQtySelected: number = 0;

    constructor(
        private commonData: CommonService,
        private _itemService: ItemsService,
        private _dealerService: DealerService,
        private _modalCtrl: ModalController,
        // private _navParams: NavParams,
    ) {
        // this.itemListSelected = this._navParams.get('orderItems');
        // if (!this.itemListSelected) {
        //     this.itemListSelected = new Array<OrderItem>();
        // }
    }

    ngOnInit() {
        // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
        const modalState = {
            modal: true,
            desc: 'fake state for our modal'
        };
        history.pushState(modalState, null);

        this.searchText = '';
        this.fetchData();
    }

    ngOnDestroy() {
        // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
        // ngDestroy() method
        if (window.history.state.modal) {
            history.back();
        }
    }

    filterDataOnSearchText(ev: any) {
        // Search will be done against lower case to achieve case insensitive search.
        this.searchText = ev.target.value.trim().toLowerCase();

        // Call fetch method to filter serach text
        this.applyFilterOfSearchText();
    }

    /**Apply Search Text filter on the item list for the Item Name.*/
    applyFilterOfSearchText(): void {
        if (this.searchText === '') {
            // No search text, hence copy WithOutFilter Items
            this.itemList = this.itemListWOFilter;
        } else {
            // Clear the list
            this.itemList = new Array<ItemStockPrice>();

            this.itemListWOFilter.forEach(item => {
                // search text in itemName, itemDescription, category and manufacturer
                if (item.tags.toLowerCase().match(this.searchText)) {
                    // Add matching items
                    this.itemList.push(item);
                }
            });
        }
        this.recordCount = this.itemList.length;
    }

    async fetchData(): Promise<void> {
        this._itemService.getItemStockPriceList(this.commonData.dealer.dealerID).valueChanges()
            .forEach(items => {
                // reset list
                this.itemListWOFilter = new Array<ItemStockPrice>();

                for (const oneItem of items) {
                    const item = new ItemStockPrice();

                    item.itemStockPriceID = oneItem.itemStockPriceID;
                    item.itemName = oneItem.itemName;
                    item.itemDescription = oneItem.itemDescription;
                    item.mrp = oneItem.mrp;
                    item.sellingPrice = oneItem.sellingPrice;
                    item.balanceQty = oneItem.balanceQty;
                    item.category = oneItem.category;
                    item.manufacturer = oneItem.manufacturer;
                    item.itemImageThumURL = oneItem.itemImageThumURL;
                    item.itemImageURLs = oneItem.itemImageURLs;
                    item.packageSize = oneItem.packageSize;
                    item.packageUnit = oneItem.packageUnit;
                    item.canUploadFile = oneItem.canUploadFile;

                    this.itemListWOFilter.push(item);
                }
                // if order details exists then fill the qty to the item.
                this.itemListSelected.forEach(itemSelected => {
                    const foundItem = this.itemListWOFilter.find(i => i.itemStockPriceID == itemSelected.item.itemStockPriceID);
                    if (foundItem) {
                        // set the selection
                        foundItem.isItemSelected = true;
                    }
                });

                this.recordCount = this.itemListWOFilter.length;
                this.recordCountSelected = this.itemListSelected.length;
                // Refresh the list based on the Search Text
                this.applyFilterOfSearchText();
            });
    }

    async doRefresh(event) {
        // await this.createData();
        await this.fetchData();

        setTimeout(() => {
            event.target.complete();
        }, 50);
    }

    itemSelected(item: ItemStockPrice) {
        item.isItemSelected = !item.isItemSelected;
        // Find item if is in the selected list and then update current status.
        const itemIndex = this.itemListSelected.findIndex(i => i.item.itemStockPriceID == item.itemStockPriceID)
        if (item.isItemSelected) {
            if (itemIndex == -1) {
                // 1. Item selected but not present in the selected list so add it.
                const newOrderItem = new OrderItem();
                // update all the properties of newOrderItem
                newOrderItem.item = item;
                newOrderItem.quantity = 1;
                newOrderItem.orderItemFile = null;

                this.itemListSelected.push(newOrderItem);
            }
        } else {
            if (itemIndex != -1) {
                // 2. Item deselected but present in the selected list so delete it.
                this.itemListSelected.splice(itemIndex, 1);
            }
        }
        // update selected item count   
        this.recordCountSelected = this.itemListSelected.length;
    }

    // Dismiss the Pop-up when the back button is pressed
    @HostListener('window:popstate', ['$event'])
    dismiss(): void {
        this._modalCtrl.dismiss();
    }

    async saveClicked() {
        // await this.createData();
        this._modalCtrl.dismiss(this.itemListSelected);
    }
}