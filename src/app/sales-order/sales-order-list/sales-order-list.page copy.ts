import { Component, OnInit, OnDestroy } from '@angular/core';
import { Validators, FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';

import { Utilities, LocalDataStorage } from '../../utils/utilities';
import { SalesOrder } from '../model/sales-order';
import { SalesOrderService } from '../sales-order.service';
import { CommonService } from '../../shared/common.service';

import { Subscription, Subject } from "rxjs";
import { take, takeWhile, takeUntil } from 'rxjs/operators';

interface IOrderStatusInfo {
    orderStatus: string,
    text: string,
    color: string,
    showOrders: boolean,
    orderStatusCount: number,
}

@Component({
    selector: 'app-sales-order-list',
    templateUrl: 'sales-order-list.page copy.html',
})
export class SalesOrderListPageCopy implements OnInit, OnDestroy {
    public salesOrderListForm: FormGroup;

    public salesOrderList: Array<SalesOrder>;
    public salesOrderListWOFilter: Array<SalesOrder>;
    public searchText: string;
    public recordCount: number = 0;
    public showPendingOrders: boolean = false;

    public unsubscribeComponent$ = new Subject<void>();
    public unsubscribe$ = this.unsubscribeComponent$.asObservable();

    public orderStatusInfo: IOrderStatusInfo[] = [
        { orderStatus: "pending", text: "Pending orders", color: "pending", showOrders: false, orderStatusCount: 0 },
        { orderStatus: "dispatched", text: "Dispatched orders", color: "pending", showOrders: false, orderStatusCount: 0 },
        { orderStatus: "delivered", text: "Delivered orders", color: "pending", showOrders: false, orderStatusCount: 0 },
        { orderStatus: "paymentreceived", text: "Payment received orders", color: "pending", showOrders: false, orderStatusCount: 0 },
        { orderStatus: "cancelled", text: "Cancelled orders", color: "pending", showOrders: false, orderStatusCount: 0 },
    ];

    customPopoverStatusOptions: any = {
        header: 'Set the status of the order',
        // subHeader: '',
        // message: ''
    };
    validations = {
        'orderStatus': [
            { type: 'required', message: 'Order status is required.' },
        ]
    }

    constructor(
        public commonData: CommonService,
        private _fb: FormBuilder,
        private _salesOrderService: SalesOrderService) {
    }

    ngOnInit(): void {
        console.log("ngOnInit");
        this.searchText = '';
        // create a form group with nested form group array to store order status of multiple sales order.
        this.salesOrderListForm = this._fb.group({
            salesOrderForm: this._fb.array([])
        });

        this.fetchData();
    }
    ngOnDestroy() {
        console.log("ngOnDestroy");
        this.unsubscribeComponent$.next();
    }

    /**Add a sales order record on the list with the existing order status.*/
    public createSalesOrder(salesOrder: SalesOrder): FormGroup {
        return this._fb.group({
            salesOrderID: new FormControl(salesOrder.salesOrderID), // to keep the key mapping of the record
            // read only (used as interpolation)
            customerName: new FormControl(salesOrder.customerDetails.customerName),
            mobileNo: new FormControl(salesOrder.customerDetails.mobileNo),
            pincode: new FormControl(salesOrder.customerDetails.pincode),
            orderDate: new FormControl(salesOrder.orderDate),
            totalAmt: new FormControl(salesOrder.totalAmt),
            totalQty: new FormControl(salesOrder.totalQty),
            // to allow user to set new order status
            orderStatus: new FormControl(salesOrder.orderStatus, Validators.required),
            // Dummu field to show the control on the form or not. The visibility of this record will be maintained
            // by the value of this field based on the user filtered result.
            isMatchesFilter: new FormControl(true),
        });
    }

    public showHideOrders(orderStatusInfo: IOrderStatusInfo) {
        //Find order status and reverse the showOrders flag
        let foundOrderStatus = this.orderStatusInfo.find(i => i.orderStatus == orderStatusInfo.orderStatus);
        if (foundOrderStatus) {
            foundOrderStatus.showOrders = !foundOrderStatus.showOrders;

            // set order status of the order
            this.salesOrderControlArray.value.forEach(orderControl => {
                if (orderControl.orderStatus == orderStatusInfo.orderStatus) {
                    orderControl.showOrders = foundOrderStatus.showOrders;
                }
            });
        }
    }

    /**Gets array reference of salesOrderForm.*/
    public get salesOrderControlArray() {
        return this.salesOrderListForm.get('salesOrderForm') as FormArray;
    }

    async fetchData(): Promise<void> {
        console.log("fetchData");
        this._salesOrderService.getSalesOrderList(this.commonData.dealer?.dealerID || "").valueChanges()
            // pipe with takeUntil, is used for forcefully stop valueChanges() by unsubscribing in ngDestroy.
            // refer https://itnext.io/3-common-mistakes-when-using-angular-ngrx-firebase-9de4e241d866
            .pipe(takeUntil(this.unsubscribe$))
            .forEach(orders => {
                console.log("forEach");

                // reset list
                this.salesOrderListWOFilter = new Array<SalesOrder>();
                // clear sales order form group
                this.salesOrderControlArray.clear();

                for (const oneOrder of orders) {
                    const salesOrder = new SalesOrder();

                    salesOrder.salesOrderID = oneOrder.salesOrderID;
                    salesOrder.salesOrderNo = oneOrder.salesOrderNo;
                    salesOrder.orderDate = new Date(oneOrder.orderDate.seconds * 1000);
                    salesOrder.totalAmt = oneOrder.totalAmt;
                    salesOrder.totalQty = oneOrder.totalQty;
                    salesOrder.orderStatus = oneOrder.orderStatus;
                    salesOrder.orderStatusChangedDate = oneOrder.orderStatusChangedDate;
                    salesOrder.customerDetails = oneOrder.customerDetails;

                    this.salesOrderListWOFilter.push(salesOrder);
                    // create sales order form group
                    this.salesOrderControlArray.push(this.createSalesOrder(salesOrder));
                }

                this.recordCount = this.salesOrderListWOFilter.length;
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

    filterDataOnSearchText(ev: any) {
        // Search will be done against lower case to achieve case insensitive search.
        this.searchText = ev.target.value.trim().toLowerCase();

        // Call fetch method to filter serach text
        this.applyFilterOfSearchText();
    }

    /**Apply Search Text filter on the sales order list for the Customer mobile number.*/
    applyFilterOfSearchText(): void {
        if (this.searchText === '') {
            // No search text, hence copy WithOutFilter Sales order
            this.salesOrderList = this.salesOrderListWOFilter;
            // Show all controls
            this.salesOrderControlArray.value.forEach(orderControl => {
                orderControl.isMatchesFilter = true;
            });
        } else {
            // Clear the sales order list
            this.salesOrderList = new Array<SalesOrder>();

            this.salesOrderListWOFilter.forEach(salesOrder => {
                // search text in customer mobile number
                const foundControl = this.salesOrderControlArray.value.find(orderControl =>
                    orderControl.salesOrderID == salesOrder.salesOrderID);
                if (foundControl) {
                    if (salesOrder.customerDetails.customerName.toLowerCase().match(this.searchText) ||
                        salesOrder.customerDetails.mobileNo.toLowerCase().match(this.searchText)
                    ) {
                        // Add matching sales order
                        this.salesOrderList.push(salesOrder);
                        foundControl.isMatchesFilter = true;
                    } else {
                        foundControl.isMatchesFilter = false;
                    }
                }
            });
        }
        this.recordCount = this.salesOrderList.length;
    }

    async saveClicked() {
        try {
            if (this.salesOrderListForm.valid) {
                await Utilities.showLoadingCtrl('Saving. Please wait...');

                this.salesOrderControlArray.controls

                // convert form array to array of SalesOrder
                let salesOrder = new Array<SalesOrder>();
                this.salesOrderControlArray.value.forEach((order: any) => {
                    salesOrder.push(Object.assign({}, order));
                });
                // update data to database
                await this._salesOrderService.updateSalesOrderStatus(salesOrder[0]);

                await Utilities.showAlert("Changes saved successfully.", "Success");
                await Utilities.hideLoadingCtrl();
            }
        } catch (error) {
            console.log(error);
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert("Some exceptions has occured while saving the sales order!", "Error");
        }
    }
}