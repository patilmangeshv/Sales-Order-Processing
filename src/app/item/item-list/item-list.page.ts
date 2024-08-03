import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { Item } from '../model/item';
import { ItemsService } from '../item.service';
import { CommonService } from '../../shared/common.service';
import { ItemDetailEditPage } from '../item-detail-edit/item-detail-edit.page';
import { ItemPackageDetailEditPage } from '../item-package-detail-edit/item-package-detail-edit.page';

@Component({
    selector: 'app-item-list',
    templateUrl: 'item-list.page.html',
})
export class ItemListPage implements OnInit {
    public itemList: Array<Item>;
    public itemListWOFilter: Array<Item>;
    public searchText: string;
    public recordCount: number = 0;

    constructor(
        public commonData: CommonService,
        private _itemService: ItemsService,
        private _modalCtrl: ModalController,
    ) { }

    ngOnInit(): void {
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
            this.itemList = new Array<Item>();

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
        this._itemService.getItemList(this.commonData.dealer.dealerID).valueChanges()
            .forEach(items => {
                // reset list
                this.itemListWOFilter = new Array<Item>();

                for (const oneItem of items) {
                    const item = new Item();

                    item.itemID = oneItem.itemID;
                    item.itemName = oneItem.itemName;
                    item.itemDescription = oneItem.itemDescription;
                    item.category = oneItem.category;
                    item.manufacturer = oneItem.manufacturer;
                    item.itemImageThumURL = oneItem.itemImageThumURL;
                    item.itemImageURLs = oneItem.itemImageURLs;
                    item.canUploadFile = oneItem.canUploadFile;
                    item.stockMaintained = oneItem.stockMaintained;
                    item.isActive = oneItem.isActive;
                    item.itemPackages = oneItem.itemPackages;

                    this.itemListWOFilter.push(item);
                }

                this.recordCount = this.itemListWOFilter.length;
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

    async dealerChanged() {
        await this.fetchData();
    }

    async showItemDetail(itemID: string) {
        // show the item details
        const modal = await this._modalCtrl.create({
            component: ItemDetailEditPage,
            keyboardClose: true,
            componentProps: { itemID: itemID }
        });
        await modal.present();
    }

    async showItemPackageDetail(item: Item, itemPackageID: string) {
        // show the item package details
        const modal = await this._modalCtrl.create({
            component: ItemPackageDetailEditPage,
            keyboardClose: true,
            componentProps: { item: item, itemPackageID: itemPackageID }
        });
        await modal.present();
    }
}