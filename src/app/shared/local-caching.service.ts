import { Injectable } from '@angular/core';

import { CommonService } from './common.service';
import { CustomerService } from '../customer/customer.service';
import { CustomerDetails } from '../customer/model/customerDetails';
import { ItemStockPrice } from '../item/model/item';
import { ItemsService } from '../item/item.service';

import { TrackStaticDataCache } from '../dealer/model/dealer';

@Injectable({
    providedIn: 'root'
})
export class LocalCachingService {
    constructor(
        private commonData: CommonService,
        private _customerService: CustomerService,
        private _itemService: ItemsService,
    ) { }

    private _customerList: Array<CustomerDetails>;
    private _itemStockPriceList: Array<ItemStockPrice>;

    public async customerList(): Promise<Array<CustomerDetails>> {
        return new Promise((resolve, reject) => {
            const updateCache4Customer = TrackStaticDataCache.updateCache4Customer;

            // get fresh data if _customerList does not have data or data needs to be refreshed (updateCache4Customer)
            if (!this._customerList || updateCache4Customer) {
                this._customerService.getCustomersList(this.commonData.dealer.dealerID)
                    .then((customers) => {
                        // reset list
                        this._customerList = new Array<CustomerDetails>();

                        for (const oneCustomer of customers) {
                            const customer = new CustomerDetails();

                            customer.customerID = oneCustomer.customerID;
                            customer.userProfileUID = oneCustomer.userProfileUID;
                            customer.dealerID = oneCustomer.dealerID;
                            customer.customerName = oneCustomer.customerName;
                            customer.externalCode = oneCustomer.externalCode;
                            customer.externalCode1 = oneCustomer.externalCode1;
                            customer.externalCode2 = oneCustomer.externalCode2;
                            customer.isRetailer = oneCustomer.isRetailer;
                            customer.mobileNo = oneCustomer.mobileNo;
                            customer.deliveryAddress = oneCustomer.deliveryAddress;
                            customer.pincode = oneCustomer.pincode;
                            customer.areaCode = oneCustomer.areaCode;
                            customer.email = oneCustomer.email;
                            customer.gstNo = oneCustomer.gstNo;
                            customer.gstate_cd = oneCustomer.gstate_cd;
                            customer.gst_regstr = oneCustomer.gst_regstr;
                            customer.foodLicenseNo = oneCustomer.foodLicenseNo;
                            customer.isActive = oneCustomer.isActive;

                            this._customerList.push(customer);
                        }

                        return resolve(this._customerList);
                    });
            } else {
                return resolve(this._customerList);
            }
        });
    }

    public async itemStockPriceList(): Promise<Array<ItemStockPrice>> {
        return new Promise((resolve, reject) => {
            const updateCache4ItemStockPrice = TrackStaticDataCache.updateCache4ItemStockPrice;

            // get fresh data if _itemStockPriceList does not have data or data needs to be refreshed (updateCache4ItemStockPrice)
            if (!this._itemStockPriceList || updateCache4ItemStockPrice) {
                this._itemService.getActiveItemStockPriceList(this.commonData.dealer.dealerID)
                    .then((stockPriceListData) => {
                        // reset list
                        this._itemStockPriceList = new Array<ItemStockPrice>();

                        for (const oneItem of stockPriceListData) {
                            const item = new ItemStockPrice();

                            item.itemStockPriceID = oneItem.itemStockPriceID;
                            item.itemName = oneItem.itemName;
                            item.externalCode = oneItem.externalCode;
                            item.externalCode1 = oneItem.externalCode1;
                            item.externalCode2 = oneItem.externalCode2;
                            item.itemDescription = oneItem.itemDescription;
                            item.mrp = oneItem.mrp;
                            item.sellingPrice = oneItem.sellingPrice;
                            item.wholesalePrice = oneItem.wholesalePrice;
                            item.wholesalePriceWithGST = oneItem.wholesalePriceWithGST;
                            item.gst_pc = oneItem.gst_pc;
                            item.gcess_pc = oneItem.gcess_pc;
                            item.free_qty = oneItem.free_qty;
                            item.off_onmrp = oneItem.off_onmrp;
                            item.hsn_cd = oneItem.hsn_cd;
                            item.stk_marg = oneItem.stk_marg;
                            item.stockQty = oneItem.stockQty;
                            item.balanceQty = oneItem.balanceQty;
                            item.stockMinimumQty = oneItem.stockMinimumQty;
                            item.category = oneItem.category;
                            item.manufacturer = oneItem.manufacturer;
                            item.itemImageThumURL = oneItem.itemImageThumURL;
                            item.itemImageURLs = oneItem.itemImageURLs;
                            item.stockMaintained = oneItem.stockMaintained;
                            item.packageSize = oneItem.packageSize;
                            item.packageUnit = oneItem.packageUnit;
                            item.canUploadFile = oneItem.canUploadFile;
                            item.quantity = 0;

                            this._itemStockPriceList.push(item);
                        }

                        return resolve(this._itemStockPriceList);
                    });
            } else {
                // always clear quantity to avoid older values while creating a new sales order
                if (this._itemStockPriceList) {
                    this._itemStockPriceList.forEach(item => {
                        item.quantity = 0;
                    });
                }
                return resolve(this._itemStockPriceList);
            }
        });
    }
}