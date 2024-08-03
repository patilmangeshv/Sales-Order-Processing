import { Injectable } from '@angular/core';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { AuthService } from '../auth/auth.module';
import { PurchaseOrder, PurchaseOrderItems } from '../purchase-order/model/purchase-order';

@Injectable({
    providedIn: 'root',
})
export class PurchaseOrderService {
    constructor(private _ngFirestore: AngularFirestore,
        private _authService: AuthService,
    ) { }

    getPurchaseOrderList(dealerID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<any>('purchaseOrder', ref =>
            ref.orderBy('stockDate', 'desc')
                .where('dealerID', '==', dealerID)
        );
    }

    getPurchaseOrderDetail(orderID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<any>(`purchaseOrderItems`, ref =>
            ref.where('orderID', '==', orderID)
        );
    }

    async createPurchaseOrder(purchaseOrder: PurchaseOrder, purchaseOrderItems: PurchaseOrderItems): Promise<void> {
        const purchaseOrderID: string = this._ngFirestore.createId();

        try {
            // 1. Create a new order
            this._ngFirestore.doc<PurchaseOrder>(`/purchaseOrder/${purchaseOrderID}`)
                .set({
                    orderID: purchaseOrderID,
                    dealerID: purchaseOrder.dealerID,
                    stockDate: firebase.firestore.FieldValue.serverTimestamp(),
                    orderNo: purchaseOrder.orderNo,
                    orderDate: purchaseOrder.orderDate,
                    totalAmt: purchaseOrder.totalAmt,
                    totalQty: purchaseOrder.totalQty,
                    userID: this._authService.loggedInFirebaseUser?.uid,
                });

            // 2. Create a all order
            purchaseOrderItems.orderItems.forEach(value => {
                const purchaseOrderItemID: string = this._ngFirestore.createId();

                this._ngFirestore.doc<any>(`/purchaseOrderItems/${purchaseOrderItemID}`)
                    .set({
                        purchaseOrderItemID: purchaseOrderItemID,
                        itemPackageID: value.itemPackageID,
                        externalCode: value.externalCode,
                        externalCode1: value.externalCode1,
                        externalCode2: value.externalCode2,
                        itemName: value.itemName,
                        itemDescription: value.itemDescription,
                        stockDate: firebase.firestore.FieldValue.serverTimestamp(),
                        orderID: purchaseOrderID,
                        orderDate: value.orderDate,
                        orderNo: value.orderNo,
                        mrp: value.mrp,
                        sellingPrice: value.sellingPrice,
                        wholesalePrice: value.wholesalePrice,
                        // balanceQty: value.stockQty,  // while adding a new stock, balanceQty will be stockQty
                        stockQty: value.stockQty,
                        returnQty: value.returnQty,
                        userIDNEW: this._authService.loggedInFirebaseUser?.uid,
                        itemID: value.itemID,
                        dealerID: value.dealerID,
                        category: value.category,
                        manufacturer: value.manufacturer,
                        tags: "",   // don't want to store this field value as it has calculated value
                        itemImageThumURL: value.itemImageThumURL,
                        itemImageURLs: value.itemImageURLs,
                        packageSize: value.packageSize,
                        packageUnit: value.packageUnit,
                        canUploadFile: value.canUploadFile,
                        stockMaintained: value.stockMaintained,
                        isActive: value.isActive
                    });
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
