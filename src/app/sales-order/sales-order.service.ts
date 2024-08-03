import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentReference } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { AuthService } from '../auth/auth.module';
import { CommonService } from '../shared/common.service';
import { SalesOrder, SalesOrderItems } from './model/sales-order';
import { ItemStockPrice } from '../item/model/item';
import { dateInterval } from '../shared/native-type.extensions';

@Injectable({
    providedIn: 'root',
})
export class SalesOrderService {
    constructor(private _ngFirestore: AngularFirestore,
        private _authService: AuthService,
        private _common: CommonService,
    ) { }

    /**Get sales order list for the dealer and for logged in user */
    getSalesOrderList(dealerID: string): AngularFirestoreCollection<any> {
        let list: AngularFirestoreCollection<any>;

        const dealerMapInfo = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == dealerID);
        if (dealerMapInfo.roles?.customer || dealerMapInfo.roles?.salesperson) {
            // if (this._authService.loggedInUser && (this._authService.loggedInUser.roles?.customer || this._authService.loggedInUser.roles?.salesperson)) {
            list = this._ngFirestore.collection<SalesOrder>(`/salesOrder/`, ref =>
                ref.orderBy('orderStatus')
                    // .orderBy('orderDate', "desc")
                    .orderBy('salesOrderNo', "desc")
                    .orderBy('customerDetails.pincode')
                    .orderBy('customerDetails.mobileNo')
                    .where('dealerID', '==', dealerID)
                    .where('userID', '==', this._authService.loggedInFirebaseUser.uid)
                //.where('isOrderDelivered', 'array-contains-any', arrOrderDelivered)
            );
        } else {
            list = this._ngFirestore.collection<SalesOrder>(`/salesOrder/`, ref =>
                ref.orderBy('orderStatus')
                    // .orderBy('orderDate', "desc")
                    .orderBy('salesOrderNo', "desc")
                    .orderBy('customerDetails.pincode')
                    .orderBy('customerDetails.mobileNo')
                    .where('dealerID', '==', dealerID)
            );
        }

        return list;
    }

    async getSalesOrderDetail(salesOrderID: string) {
        let docRef = this._ngFirestore.collection<SalesOrderItems>(`salesOrderItems`).ref;
        return await docRef.where('salesOrderID', '==', salesOrderID)
            .get()
            .then((value) => {
                return value.docs.map(doc => doc.data());
            });
    }

    /**
     * Update flag of data exported.
     * @param salesOrderID Sales order ID
     * @param dataExportedUserIDName Sales order exported by user name
     */
    async updateSalesOrderDataExported(salesOrderID: string, dataExportedUserIDName: string): Promise<void> {
        await this._ngFirestore.collection('salesOrder').doc(salesOrderID)
            .set({
                dataExportedDateTime: firebase.firestore.FieldValue.serverTimestamp(),
                dataExportedUserIDName: dataExportedUserIDName,
            }, { merge: true });
    }

    async updateSalesOrderStatus(salesOrder: SalesOrder): Promise<void> {
        await this._ngFirestore.collection('salesOrder').doc(salesOrder.salesOrderID)
            .set({
                orderStatus: salesOrder.orderStatus,
                orderStatusChangedDate: firebase.firestore.FieldValue.serverTimestamp(),
                orderStatusChangedByUserID: this._authService.loggedInFirebaseUser.uid,
            }, { merge: true });
    }

    async createSalesOrder(salesOrder: SalesOrder, salesOrderItems: SalesOrderItems, favoriteItemStockPriceReferences: string[]): Promise<void> {
        const id: string = this._ngFirestore.createId();
        const orderSystemDate = firebase.firestore.FieldValue.serverTimestamp();
        const batch = this._ngFirestore.firestore.batch();// firebase.firestore().batch();
        const dealerMapInfo = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == salesOrder.dealerID);

        // convert custom class object to JavaScript object in order to save it in firestore.
        let orderItems: Array<any> = new Array<any>();
        salesOrderItems.orderItems.forEach(element => {
            orderItems.push(Object.assign({}, element));
        });

        // NOTE: formula for ID {dealerID}{customer.externalCode} 
        var customerItemFavoriteID = "{{0}}{{1}}".format(salesOrder.dealerID, salesOrder.customerDetails.externalCode);
        const customerItemFavoriteRef = this._ngFirestore.doc<SalesOrder>(`/customerItemFavorite/${customerItemFavoriteID}`).ref;
        const salesOrderRef = this._ngFirestore.doc<SalesOrder>(`/salesOrder/${id}`).ref;
        const salesOrderItemsRef = this._ngFirestore.doc<SalesOrderItems>(`/salesOrderItems/${id}`).ref;
        const itemStockPriceRef = [];
        salesOrderItems.orderItems.forEach(orderItem => {
            const ref = this._ngFirestore.doc<ItemStockPrice>(`/itemStockPrice/${orderItem.itemStockPriceID}`).ref;
            const itemRef = { documentRef: ref, quantity: orderItem.quantity, stockMaintained: orderItem.stockMaintained };

            itemStockPriceRef.push(itemRef);
        });

        // 1. Save data in salesOrder header table
        batch.set(salesOrderRef, {
            salesOrderID: id,
            salesOrderNo: null,
            userID: this._authService.loggedInFirebaseUser.uid,
            //userIDName: if order inputed by customer then store "self" else store the user name who inputed the order
            userIDName: (dealerMapInfo.roles?.customer ? "self" : dealerMapInfo.userName),
            userIDExternalCode: dealerMapInfo.externalCode,
            dealerID: salesOrder.dealerID,
            orderDate: salesOrder.orderDate,
            orderSystemDate: orderSystemDate,
            totalAmt: salesOrder.totalAmt,
            totalQty: salesOrder.totalQty,
            narration: salesOrder.narration,
            orderStatus: "pending", // by default a new order is pending.
            // MP Note
            // transform array of orderItems or customerDetails into an array of pure JavaScript objects.
            // The custom objects canot be stored directly in firestore. Refer Custom objects.
            // https://firebase.google.com/docs/firestore/manage-data/add-data 
            customerDetails: Object.assign({}, salesOrder.customerDetails),
        });

        // 2. Save data in salesOrderItems item detail table
        batch.set(salesOrderItemsRef, {
            salesOrderID: id,
            orderItems: Object.assign({}, orderItems)
        });

        // 3. Reduce the quantity from balanceQty of the item.
        itemStockPriceRef.forEach(element => {
            let reduceBalanceQty: any;
            if (element.stockMaintained) {
                reduceBalanceQty = firebase.firestore.FieldValue.increment(-element.quantity);
            } else {
                // if not stock maintained then the balance qty will remain null always
                reduceBalanceQty = null;
            }
            batch.set(element.documentRef, { balanceQty: reduceBalanceQty }, { merge: true });
        });

        // 4. update customer favorite references
        if (favoriteItemStockPriceReferences && favoriteItemStockPriceReferences.length > 0) {
            batch.set(customerItemFavoriteRef, {
                itemStockPriceReferences: favoriteItemStockPriceReferences,
            });
        }
        batch.commit();
    }

    async deleteSalesOrder(salesOrderID: string) {
        return new Promise(async (resolve, reject) => {
            try {
                const batch = this._ngFirestore.firestore.batch();
                const salesOrderItemsRef = this._ngFirestore.doc(`/salesOrderItems/${salesOrderID}`).ref;
                const salesOrderRef = this._ngFirestore.doc(`/salesOrder/${salesOrderID}`).ref;
                batch.delete(salesOrderRef);
                batch.delete(salesOrderItemsRef);

                batch.commit();
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    }

    async deleteAll_SalesOrder(dealerID: string, daysToDeleteData: number) {
        return new Promise(async (resolve, reject) => {
            try {
                // NOTE: the source date has to be converted into the timestamp in order to query the date fields
                const tsDataDeleteFrom = firebase.firestore.Timestamp.fromDate(new Date().dateAdd(dateInterval.day, daysToDeleteData));
                await this._ngFirestore.collection<any>('salesOrder').ref
                    .where('dealerID', '==', dealerID)
                    .where('orderSystemDate', '<=', tsDataDeleteFrom)
                    .get()
                    .then(value => {
                        let i = 0;
                        value.forEach(async element => {
                            i++;
                            const batch = this._ngFirestore.firestore.batch();

                            const salesOrderItemsRef = this._ngFirestore.doc(`/salesOrderItems/${element.id}`).ref;
                            const salesOrderRef = this._ngFirestore.doc(`/salesOrder/${element.id}`).ref;
                            batch.delete(salesOrderRef);
                            batch.delete(salesOrderItemsRef);

                            batch.commit();
                        });
                        console.log('Total deleted records:' + i.toString());
                    }).catch((reason) => {
                        reject(reason);
                    }).finally(() => {
                        resolve(null);
                    });
            } catch (error) {
                reject(error);
            }
        });
    }
}