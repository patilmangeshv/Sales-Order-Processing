import { Component, OnInit } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';

import { Utilities } from '../../utils/utilities';
import { SalesOrder } from '../model/sales-order';
import { SalesOrderService } from '../sales-order.service';
import { CommonService } from '../../shared/common.service';
import { AuthService } from '../../auth/auth.service';
import { SalesOrderDetailPage } from '../sales-order-detail/sales-order-detail.page';
import { OrderItemData } from 'src/app/item/model/item';

interface IOrderStatusInfo {
    orderStatus: string,
    text: string,
    /**Based on the logged in user, the selection of the option is enabled.*/
    isEnabled: boolean,
    /**Export data is allowed for this status*/
    hasExportData: boolean,
    color: string,
    showOrders: boolean,
    orderStatusCount: number,
    selectedOrdersCount: number,
}

@Component({
    selector: 'app-sales-order-list',
    templateUrl: 'sales-order-list.page.html',
    styleUrls: ['sales-order-list.page.scss'],
})
export class SalesOrderListPage implements OnInit {
    public salesOrderList: Array<SalesOrder>;
    public salesOrderListWOFilter: Array<SalesOrder>;
    public searchText: string;
    public recordCount: number = 0;

    public includeExport: boolean = false;

    // for file handling
    private _dataToExport = [];
    private _selectedOrderID = new Array<string>();
    private _rowDelimeter = "\r\n";
    private _colDelimeter = ",";

    /**Order stauts information. 
     * Cancelled: Once order status is changed to Cancelled, it cannot be changed.
     * The balance quantity of the item will be increased by the order quantity.
     * Customer is allowed to cancle the order and not any other status.
     */
    public orderStatusInfo: IOrderStatusInfo[] = [
        { orderStatus: "pending", text: "Pending", isEnabled: true, hasExportData: true, color: "pendingOrderStatus", showOrders: true, orderStatusCount: 0, selectedOrdersCount: 0 },
        { orderStatus: "dispatched", text: "Dispatched", isEnabled: true, hasExportData: false, color: "dispatchedOrderStatus", showOrders: true, orderStatusCount: 0, selectedOrdersCount: 0 },
        { orderStatus: "delivered", text: "Delivered", isEnabled: true, hasExportData: false, color: "deliveredOrderStatus", showOrders: false, orderStatusCount: 0, selectedOrdersCount: 0 },
        { orderStatus: "paymentreceived", text: "Payment received", isEnabled: true, hasExportData: false, color: "paidOrderStatus", showOrders: false, orderStatusCount: 0, selectedOrdersCount: 0 },
        { orderStatus: "cancelled", text: "Cancelled", isEnabled: true, hasExportData: false, color: "cancelOrderStatus", showOrders: false, orderStatusCount: 0, selectedOrdersCount: 0 },
    ];

    customPopoverStatusOptions: any = {
        header: 'Set the status of the order',
        // subHeader: '',
        message: 'Note: Order once cancelled cannot be revoked?'
    };

    constructor(
        public commonData: CommonService,
        private _authService: AuthService,
        private _salesOrderService: SalesOrderService,
        private _modalCtrl: ModalController,
        private _alertCtrl: AlertController) {
    }

    ngOnInit(): void {
        this.searchText = '';
        // if logged in user is customer or salesperson then he can only set the status to "cancelled."
        const dealerMapInfo = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == this.commonData.dealer?.dealerID);
        if (dealerMapInfo.roles.customer || dealerMapInfo.roles.salesperson) {
            this.orderStatusInfo.forEach(info => {
                switch (info.orderStatus) {
                    case "cancelled":
                        info.isEnabled = true;
                        break;
                    default:
                        info.isEnabled = false;
                }
            });
        }

        this.fetchData();
    }

    includeExportChanged() {
        this.applyFilterOfSearchText();
    }

    public showHideOrders(orderStatusInfo: IOrderStatusInfo) {
        //Find order status and reverse the showOrders flag
        orderStatusInfo.showOrders = !orderStatusInfo.showOrders;
    }

    public orderSelected(salesOrder: SalesOrder, orderStatusInfo: IOrderStatusInfo) {
        salesOrder.isSalesOrderSelected = !salesOrder.isSalesOrderSelected;
        orderStatusInfo.selectedOrdersCount += salesOrder.isSalesOrderSelected ? 1 : -1;
    }

    // // code snap for Callback after all asynchronous forEach callbacks are completed
    // asyncFunction(item, cb) {
    //     setTimeout(() => {
    //         console.log('done with', item);
    //         cb();
    //     }, 100);
    // }

    // private finitNoOfPromises() {
    //     let requests = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item) => {
    //         return new Promise((resolve) => {
    //             this.asyncFunction(item, resolve);
    //         });
    //     })

    //     Promise.all(requests).then(() => console.log('done'));
    // }

    private async presentExportOrdersConfirm(message: string, orderStatusInfo: IOrderStatusInfo, cancelText?: string, okText?: string, header?: string, subHeader?: string) {
        const alert = await this._alertCtrl.create({
            header: header,
            subHeader: subHeader,
            message: message,
            buttons: [
                {
                    text: cancelText || 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                    }
                }, {
                    text: okText || 'Okay',
                    handler: async () => {
                        await this.exportOrders(orderStatusInfo);
                    }
                }
            ]
        });

        await alert.present();
    }

    private async presentDeleteOrdersConfirm(message: string, orderStatusInfo: IOrderStatusInfo, cancelText?: string, okText?: string, header?: string, subHeader?: string) {
        const alert = await this._alertCtrl.create({
            header: header,
            subHeader: subHeader,
            message: message,
            buttons: [
                {
                    text: cancelText || 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                    }
                }, {
                    text: okText || 'Okay',
                    handler: async () => {
                        await this.deleteOrders(orderStatusInfo);
                    }
                }
            ]
        });

        await alert.present();
    }

    public async exportOrdersConfirm(orderStatusInfo: IOrderStatusInfo) {
        const message = "Downloading {0} out of {1} sales orders data?".format(orderStatusInfo.selectedOrdersCount, orderStatusInfo.orderStatusCount);
        await this.presentExportOrdersConfirm(message, orderStatusInfo, "Cancel", "Export", "Export sales orders")
    }

    public async deleteOrdersConfirm(orderStatusInfo: IOrderStatusInfo) {
        const message = "Delete {0} out of {1} sales orders?".format(orderStatusInfo.selectedOrdersCount, orderStatusInfo.orderStatusCount);
        await this.presentDeleteOrdersConfirm(message, orderStatusInfo, "Cancel", "Delete", "Delete sales orders")
    }

    private async exportOrders(orderStatusInfo: IOrderStatusInfo) {
        try {
            // clear the list
            this._dataToExport = [];
            this._selectedOrderID = new Array<string>();

            Utilities.showLoadingCtrl("Exporting sales orders...");
            // loop through the order list for specified status
            let requests = this.salesOrderList.map((salesOrder) => {
                if (salesOrder.orderStatus == orderStatusInfo.orderStatus) {
                    // export only selected orders
                    if (salesOrder.isSalesOrderSelected) {
                        // get the header row only
                        let rowHeader = this.getHeaderRow(salesOrder);
                        this._selectedOrderID.push(salesOrder.salesOrderID);

                        // compose all promises
                        return new Promise((resolve) => {
                            // get the detail rows
                            this.getSalesOrderDetail(salesOrder.salesOrderID, rowHeader, resolve);
                        });
                    }
                }
            });

            // execute all promises at once
            Promise.all(requests).then(async () => {
                // 1. Update export order status flag to database
                await this.updateSalesOrderDataExported();

                // 2. Export file to local
                // generate random file name
                const fileName = "SO_{0}_{1}.csv".format(new Date().formatDateTime("dd-MMM-yyyy"), Utilities.getRandomNumberString(4));
                this.exportOrderData(this._dataToExport.join(this._rowDelimeter), fileName, 'text/csv');

                Utilities.hideLoadingCtrl();
                await Utilities.presentToastWithCloseButton("Exported {0} orders in file {1}.".format(this._selectedOrderID.length, fileName), "Orders exported", "bottom", "OK");
            });
        } catch (error) {
            Utilities.hideLoadingCtrl();
            await Utilities.presentToast(error, "Error in exporting Orders");
        }
    }

    private async deleteOrders(orderStatusInfo: IOrderStatusInfo) {
        try {
            // clear the list
            this._selectedOrderID = new Array<string>();

            Utilities.showLoadingCtrl("Deleting sales orders...");
            // loop through the order list for specified status
            let requests = this.salesOrderList.map((salesOrder) => {
                if (salesOrder.orderStatus == orderStatusInfo.orderStatus) {
                    // selected orders
                    if (salesOrder.isSalesOrderSelected) {
                        // get the sales order id
                        this._selectedOrderID.push(salesOrder.salesOrderID);
                        // compose all promises
                        return new Promise(async (resolve) => {
                            await this._salesOrderService.deleteSalesOrder(salesOrder.salesOrderID);
                            resolve(null);
                        });
                    }
                }
            });

            // execute all promises at once
            Promise.all(requests).then(async () => {
                Utilities.hideLoadingCtrl();
                await Utilities.presentToastWithCloseButton("Deleted {0} orders.".format(this._selectedOrderID.length), "Orders deleted", "bottom", "OK");
            });
        } catch (error) {
            Utilities.hideLoadingCtrl();
            await Utilities.presentToast(error, "Error in deleting Orders");
        }
    }

    async updateSalesOrderDataExported() {
        const dataExportedUserIDName: string = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == this.commonData.dealer.dealerID).userName;

        this._selectedOrderID.forEach(async (salesOrderID) => {
            await this._salesOrderService.updateSalesOrderDataExported(salesOrderID, dataExportedUserIDName);
        });
    }

    /**Save contents as a file on local browser*/
    private exportOrderData(content: string, fileName: string, contentType: 'text/plain' | 'text/csv') {
        var a = document.createElement('a');
        var file = new Blob([content], { type: contentType });
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }

    private async getSalesOrderDetail(salesOrderID: string, rowHeader: string, resolve) {
        await this._salesOrderService.getSalesOrderDetail(salesOrderID)
            .then((salesOrderDetail) => {
                salesOrderDetail.forEach(rowOrder => {
                    for (const index in rowOrder.orderItems) {
                        const data: OrderItemData = Object.assign({}, rowOrder.orderItems[index]);
                        const rowComplete = rowHeader + this._colDelimeter + this.getDetailRow(data);

                        this._dataToExport.push(rowComplete);
                    }
                });
            });
        // call resolve to mark the function has done its work
        resolve();
    }

    // shortCode,productCode,quantity,rate,salnet_rt,amount,mrp,gst_pc,gcess_pc,free_qty,off_onmrp,hsn_cd,stk_marg
    private getDetailRow(itemData: OrderItemData) {
        return itemData.externalCode1 + this._colDelimeter + itemData.externalCode + this._colDelimeter +
            itemData.quantity + this._colDelimeter + itemData.wholesalePrice + this._colDelimeter + itemData.wholesalePriceWithGST + this._colDelimeter +
            (itemData.quantity * itemData.wholesalePriceWithGST) * 1 + this._colDelimeter + itemData.mrp +
            this._colDelimeter + itemData.gst_pc + this._colDelimeter + itemData.gcess_pc +
            this._colDelimeter + itemData.free_qty + this._colDelimeter + itemData.off_onmrp +
            this._colDelimeter + itemData.hsn_cd + this._colDelimeter + itemData.stk_marg;
    }
    // cmpny_cd,salesOrderNo,orderDate,areaCode,customerCode,PRT_GSTIN,PRT_GSTATE,GST_REGSTR,salesmanCode,narration
    private getHeaderRow(salesOrder: SalesOrder) {
        return this.commonData.dealer?.companyCode + this._colDelimeter + salesOrder.salesOrderNo + this._colDelimeter + salesOrder.orderDate.formatDateTime("dd-MM-yyyy") + this._colDelimeter +
            salesOrder.customerDetails.areaCode + this._colDelimeter + salesOrder.customerDetails.externalCode + this._colDelimeter +
            salesOrder.customerDetails.gstNo + this._colDelimeter +
            salesOrder.customerDetails.gstate_cd + this._colDelimeter +
            salesOrder.customerDetails.gst_regstr + this._colDelimeter +
            salesOrder.userIDExternalCode + this._colDelimeter + (salesOrder.narration || "");
    }

    async fetchData(): Promise<void> {
        this._salesOrderService.getSalesOrderList(this.commonData.dealer?.dealerID || "").valueChanges()
            .forEach(orders => {
                // reset list
                this.salesOrderListWOFilter = new Array<SalesOrder>();

                for (const oneOrder of orders) {
                    const salesOrder = new SalesOrder();

                    salesOrder.salesOrderID = oneOrder.salesOrderID;
                    salesOrder.salesOrderNo = oneOrder.salesOrderNo;
                    salesOrder.narration = oneOrder.narration;
                    salesOrder.userIDName = oneOrder.userIDName;
                    salesOrder.orderDate = new Date(oneOrder.orderDate?.seconds * 1000);
                    salesOrder.orderSystemDate = new Date(oneOrder.orderSystemDate?.seconds * 1000);
                    salesOrder.totalAmt = oneOrder.totalAmt;
                    salesOrder.totalQty = oneOrder.totalQty;
                    salesOrder.userIDExternalCode = oneOrder.userIDExternalCode;
                    salesOrder.userIDName = oneOrder.userIDName;
                    if (oneOrder.dataExportedDateTime) {
                        salesOrder.dataExportedDateTime = new Date(oneOrder.dataExportedDateTime?.seconds * 1000);
                        salesOrder.dataExportedUserIDName = oneOrder.dataExportedUserIDName;
                    } else {
                        salesOrder.dataExportedDateTime = null;
                        salesOrder.dataExportedUserIDName = null;
                    }
                    salesOrder.orderStatus = oneOrder.orderStatus;
                    salesOrder.orderStatusChangedDate = new Date(oneOrder.orderStatusChangedDate?.seconds * 1000);
                    salesOrder.customerDetails = oneOrder.customerDetails;

                    this.salesOrderListWOFilter.push(salesOrder);
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

    async dealerChanged() {
        await this.fetchData();
    }

    /**Order status is disabled if,
     * 1. Customer & Salesperson can only set status as cancelled. (isEnabled)
     * 2. No one can change the order status if the order is already cancelled.
     * 3. Customer is logged in and the status is other than 'pending'.
     */
    isOrderStatusDisabled(o: IOrderStatusInfo, order: SalesOrder): boolean {
        const dealerMapInfo = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == this.commonData.dealer?.dealerID);
        return !o.isEnabled || order.orderStatus == 'cancelled' || (!(order.orderStatus == 'pending') && (dealerMapInfo.roles.customer || dealerMapInfo.roles.salesperson))
    }

    /**Show/hide export data button to the user.
     * 1. Show export data only if order status has hasExportData true.
     * 2. and hide export data button for customer and salesperson
     */
    showExportDataButton(o: IOrderStatusInfo): boolean {
        const dealerMapInfo = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == this.commonData.dealer?.dealerID);

        return o.hasExportData && !(dealerMapInfo.roles.customer || dealerMapInfo.roles.salesperson);
    }

    /**Show/hide delete order button to the user.
     * 1. hide delete orders button for customer, operator and salesperson
     */
    showDeleteButton(o: IOrderStatusInfo): boolean {
        const dealerMapInfo = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == this.commonData.dealer?.dealerID);

        return !(dealerMapInfo.roles.operator || dealerMapInfo.roles.customer || dealerMapInfo.roles.salesperson);
    }

    filterDataOnSearchText(ev: any) {
        // Search will be done against lower case to achieve case insensitive search.
        this.searchText = ev.target.value.trim().toLowerCase();

        // Call fetch method to filter serach text
        this.applyFilterOfSearchText();
    }

    /**Apply Search Text filter on the sales order list for the Customer mobile number.*/
    applyFilterOfSearchText(): void {
        // Clear the sales order list
        this.salesOrderList = new Array<SalesOrder>();
        const hasExportDataOrderStatusList = new Array<string>();

        this.orderStatusInfo.forEach(status => {
            if (status.hasExportData) {
                hasExportDataOrderStatusList.push(status.orderStatus);
            }
        });

        if (this.searchText === '') {
            // No search text, hence copy WithOutFilter Sales order
            //this.salesOrderList = this.salesOrderListWOFilter;
            this.salesOrderListWOFilter.forEach(salesOrder => {
                if (this.includeExport) {
                    // Add matching sales order
                    this.salesOrderList.push(salesOrder);
                } else if (!salesOrder.dataExportedDateTime) {
                    // Add matching sales order
                    this.salesOrderList.push(salesOrder);
                }
                if (hasExportDataOrderStatusList.find(status => status == salesOrder.orderStatus)) {
                    salesOrder.isSalesOrderSelected = true;
                }
            });
        } else {
            this.salesOrderListWOFilter.forEach(salesOrder => {
                // search text in customer name and order inputed by and mobile number
                if (salesOrder.customerDetails.customerName.toLowerCase().match(this.searchText) ||
                    salesOrder.userIDName.toLowerCase().match(this.searchText) ||
                    salesOrder.customerDetails.mobileNo.toLowerCase().match(this.searchText)
                ) {
                    if (this.includeExport) {
                        // Add matching sales order
                        this.salesOrderList.push(salesOrder);
                    } else if (!salesOrder.dataExportedDateTime) {
                        // Add matching sales order
                        this.salesOrderList.push(salesOrder);
                    }
                }
            });
        }
        this.recordCount = this.salesOrderList.length;

        // update the orderStatusCount & selectedOrdersCount to zero
        this.orderStatusInfo.forEach(info => {
            info.orderStatusCount = 0;
            info.selectedOrdersCount = 0;
        });
        // update the orderStatusCount & selectedOrdersCount
        this.salesOrderList.forEach(salesOrder => {
            this.orderStatusInfo.forEach(info => {
                if (info.orderStatus == salesOrder.orderStatus) {
                    info.orderStatusCount++;
                    if (salesOrder.isSalesOrderSelected) {
                        info.selectedOrdersCount++;
                    }
                }
            });
        });
    }

    selectSalesOrder(salesOrderID: string) {
        let salesOrder = this.salesOrderList.find(order => order.salesOrderID == salesOrderID);
        if (salesOrder) {
            salesOrder.isSalesOrderSelected = !salesOrder.isSalesOrderSelected;
        }
    }

    async orderStatusChanged(salesOrder: SalesOrder) {
        try {
            await Utilities.showLoadingCtrl('Saving. Please wait...');
            // update data to database
            await this._salesOrderService.updateSalesOrderStatus(salesOrder);

            await Utilities.presentToast("Order status saved successfully.", "Success");
            await Utilities.hideLoadingCtrl();
        } catch (error) {
            console.log(error);
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert("Some exceptions has occured while saving the sales order!", "Error");
        }
    }

    async viewOrderDetails(salesOrder: SalesOrder) {
        // show the items to user for selection
        const modal = await this._modalCtrl.create({
            component: SalesOrderDetailPage,
            keyboardClose: true,
            componentProps: { salesOrder: salesOrder }
        });
        await modal.present();
    }
}