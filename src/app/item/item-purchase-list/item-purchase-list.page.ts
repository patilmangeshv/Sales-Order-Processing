import { Component, OnInit, HostListener } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

import { ItemStockPrice, ItemPackage } from '../model/item';
import { ItemsService } from '../item.service';
import { CommonService } from '../../shared/common.service';
import { ItemPackageDetailEditPage } from '../item-package-detail-edit/item-package-detail-edit.page';

@Component({
    selector: 'app-item-purchase-list',
    templateUrl: 'item-purchase-list.page.html',
})
export class ItemPurchaseListPage implements OnInit {
    public itemList: Array<ItemPackage>;
    public itemListWOFilter: Array<ItemPackage>;
    public itemListSelected: Array<ItemStockPrice>;
    public searchText: string;
    public recordCount: number = 0;
    public recordCountSelected: number = 0;
    public totalQtySelected: number = 0;

    constructor(
        private commonData: CommonService,
        private _itemService: ItemsService,
        private _modalCtrl: ModalController,
        private _navParams: NavParams,
    ) {
        this.itemListSelected = this._navParams.get('orderItems');
        if (!this.itemListSelected) {
            this.itemListSelected = new Array<ItemStockPrice>();
        }
    }

    ngOnInit(): void {
        // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
        const modalState = {
            modal: true,
            desc: 'fake state for our modal'
        };
        history.pushState(modalState, null);

        this.searchText = '';
        this.fetchData();
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
            this.itemList = new Array<ItemPackage>();

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
        this._itemService.getActiveItemPackageList(this.commonData.dealer.dealerID).valueChanges()
            .forEach(items => {
                // reset list
                this.itemListWOFilter = new Array<ItemPackage>();

                for (const oneItem of items) {
                    const item = new ItemPackage();

                    item.itemPackageID = oneItem.itemPackageID;
                    item.itemID = oneItem.itemID;
                    item.dealerID = oneItem.dealerID;
                    item.itemPackageName = oneItem.itemPackageName;
                    item.itemDescription = oneItem.itemDescription;
                    item.category = oneItem.category;
                    item.manufacturer = oneItem.manufacturer;
                    item.itemImageThumURL = oneItem.itemImageThumURL;
                    item.itemImageURLs = oneItem.itemImageURLs;
                    item.packageSize = oneItem.packageSize;
                    item.packageUnit = oneItem.packageUnit;
                    item.stockMaintained = oneItem.stockMaintained;
                    item.canUploadFile = oneItem.canUploadFile;
                    item.isItemSelected = false;

                    this.itemListWOFilter.push(item);
                }
                // // if order details exists then fill the qty to the item.
                this.itemListSelected.forEach(itemSelected => {
                    const foundItem = this.itemListWOFilter.find(i => i.itemPackageID == itemSelected.itemPackageID);
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

    itemSelected(item: ItemPackage) {
        item.isItemSelected = !item.isItemSelected;
        // Find item if is in the selected list and then update current status.
        const itemIndex = this.itemListSelected.findIndex(i => i.itemPackageID == item.itemPackageID)
        if (item.isItemSelected) {
            if (itemIndex == -1) {
                // 1. Item selected but not present in the selected list so add it.
                const newItemStockPrice = new ItemStockPrice();
                // update all the properties of newItemStockPrice
                newItemStockPrice.itemPackageID = item.itemPackageID;
                newItemStockPrice.itemID = item.itemID;
                newItemStockPrice.dealerID = item.dealerID;
                newItemStockPrice.itemName = item.itemPackageName;
                newItemStockPrice.itemDescription = item.itemDescription;
                newItemStockPrice.category = item.category;
                newItemStockPrice.manufacturer = item.manufacturer;
                newItemStockPrice.itemImageThumURL = item.itemImageThumURL;
                newItemStockPrice.itemImageURLs = item.itemImageURLs;
                newItemStockPrice.packageSize = item.packageSize;
                newItemStockPrice.packageUnit = item.packageUnit;
                newItemStockPrice.stockMaintained = item.stockMaintained;
                newItemStockPrice.canUploadFile = item.canUploadFile;
                newItemStockPrice.stockQty = null;
                newItemStockPrice.mrp = null;
                newItemStockPrice.sellingPrice = null;
                newItemStockPrice.isItemSelected = true;

                this.itemListSelected.push(newItemStockPrice);
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