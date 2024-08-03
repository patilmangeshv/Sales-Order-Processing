import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { AlertController, ModalController, NavParams } from '@ionic/angular';

import * as firebase from "firebase/app"
// Add the Performance Monitoring library
import "firebase/performance";

import { ItemStockPrice, OrderItem } from '../model/item';
import { ItemsService } from '../item.service';
import { DealerService } from '../../dealer/dealer.service';
import { CommonService } from '../../shared/common.service';
import { LocalCachingService } from '../../shared/local-caching.service';

@Component({
    selector: 'app-item-order-list',
    templateUrl: 'item-order-list.page.html',
    styleUrls: ['../styles.scss'],
})
export class ItemOrderListPage implements OnInit, OnDestroy {
    public isDataLoaded: boolean = false;
    public itemList: Array<ItemStockPrice>;
    public itemListWOFilter: Array<ItemStockPrice>;
    public itemListSelected: Array<OrderItem>;
    private _favoriteItemStockPriceReferences: [];
    public isRetailCustomer: boolean;
    public searchText: string;
    public recordCount: number = 0;
    public recordCountSelected: number = 0;
    public totalQtySelected: number = 0;
    private _traceItemStockPriceList: firebase.performance.Trace;

    constructor(
        private commonData: CommonService,
        private _localCachingService: LocalCachingService,
        private _itemService: ItemsService,
        private _dealerService: DealerService,
        private _modalCtrl: ModalController,
        private _navParams: NavParams,
    ) {
        // Initialize Performance Monitoring and get a reference to the service
        const perf = firebase.performance();
        this._traceItemStockPriceList = perf.trace("fetch_itemStockPriceList");

        this.itemListSelected = this._navParams.get('orderItems');
        if (!this.itemListSelected) {
            this.itemListSelected = new Array<OrderItem>();
        }
        this._favoriteItemStockPriceReferences = this._navParams.get('favoriteItemStockPriceReferences');
        this.isRetailCustomer = this._navParams.get('isRetailCustomer');
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
        this._traceItemStockPriceList.start();
        this.itemListWOFilter = await this._localCachingService.itemStockPriceList();
        this._traceItemStockPriceList.stop();

        // set favorite status
        if (this._favoriteItemStockPriceReferences) {
            this.itemListWOFilter.forEach(item => {
                // search if the item is from favorite, then mark it as favorite
                var foundItemRef = this._favoriteItemStockPriceReferences.find(fav => fav == item.externalCode);
                if (foundItemRef) item.isFavorite = true;
            });
        }

        // if order details exists then fill the qty to the item.
        this.itemListSelected.forEach(item => {
            const foundItem = this.itemListWOFilter.find(i => i.itemStockPriceID == item.item.itemStockPriceID);
            if (foundItem) {
                // set the selection
                // foundItem.isItemSelected = true;
                foundItem.quantity = item.quantity;
            }
        });

        //sort list by selected items and then as it was
        // 1. if quantity is > 0
        // 2. if item is favorite
        this.itemListWOFilter.sort((first, second) => {
            if (first.quantity > 0) {
                return -1;
            } else if (first.isFavorite) {
                return -1;
            } else if (second.quantity > 0) {
                return 1;
            } else
                return 0;
        });
        this.recordCount = this.itemListWOFilter.length;
        this.recordCountSelected = this.itemListSelected.length;
        // Refresh the list based on the Search Text
        this.applyFilterOfSearchText();

        // set flag that the data is loaded
        this.isDataLoaded = true;
    }

    async doRefresh(event) {
        // await this.createData();
        await this.fetchData();

        setTimeout(() => {
            event.target.complete();
        }, 50);
    }

    itemDecreaseQty(item: ItemStockPrice) {
        this.itemChangeQty(item, false);
    }

    itemIncreaseQty(item: ItemStockPrice) {
        this.itemChangeQty(item, true);
    }

    private itemChangeQty(item: ItemStockPrice, increaseQty: boolean) {
        // allow to select item only if it has balanceQty>0 and stockMaintained
        if (!item.stockMaintained || item.balanceQty > 0) {
            // update quantity, if quantity present then increase/decrease by 1 else set to 1 or 0 based on increaseQty
            item.quantity = (item.quantity) ? item.quantity + (increaseQty ? 1 : -1) : (increaseQty ? 1 : 0);

            // Find item if it is in the selected list and then update current status.
            const itemIndex = this.itemListSelected.findIndex(i => i.item.itemStockPriceID == item.itemStockPriceID);
            if (itemIndex == -1) {
                // add only if user has quantity
                if (item.quantity > 0) {
                    // 1. Item selected but not present in the selected list so add it.
                    const newOrderItem = new OrderItem();
                    // update all the properties of newOrderItem
                    newOrderItem.item = item;
                    newOrderItem.quantity = item.quantity;
                    newOrderItem.orderItemFile = null;

                    this.itemListSelected.push(newOrderItem);
                }
            } else {
                // update the quantity
                this.itemListSelected[itemIndex].quantity = item.quantity;

                // quantity removed so remove the item from selected list
                if (item.quantity < 1) {
                    // 2. Item deselected but present in the selected list so delete it.
                    this.itemListSelected.splice(itemIndex, 1);
                }
            }
            // update selected item count   
            this.recordCountSelected = this.itemListSelected.length;
        }
    }

    itemSelected(item: ItemStockPrice) {
        // allow to select item only if it has balanceQty>0 and stockMaintained
        if (!item.stockMaintained || item.balanceQty > 0) {
            item.isItemSelected = !item.isItemSelected;
            // Find item if is in the selected list and then update current status.
            const itemIndex = this.itemListSelected.findIndex(i => i.item.itemStockPriceID == item.itemStockPriceID)
            if (item.isItemSelected) {
                if (itemIndex == -1) {
                    // 1. Item selected but not present in the selected list so add it.
                    const newOrderItem = new OrderItem();
                    // update all the properties of newOrderItem
                    newOrderItem.item = item;
                    newOrderItem.quantity = item.quantity;
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
    }

    // Dismiss the Pop-up when the back button is pressed
    @HostListener('window:popstate', ['$event'])
    dismiss(): void {
        this._modalCtrl.dismiss();
    }

    async saveClicked() {
        this._modalCtrl.dismiss(this.itemListSelected);
    }
}