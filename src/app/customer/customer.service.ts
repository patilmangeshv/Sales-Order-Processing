import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
    AngularFirestore,
    AngularFirestoreCollection,
} from '@angular/fire/firestore';

import { AuthService } from '../auth/auth.module';
import { CustomerDetails } from '../customer/model/customerDetails';
import { CommonService } from '../shared/common.service';
import { DealerService } from '../dealer/dealer.service';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {

    constructor(private afAuth: AngularFireAuth,
        private _ngFirestore: AngularFirestore,
        private _authService: AuthService,
        private _commonData: CommonService,
        private _dealerService: DealerService,
    ) { }

    async getFavoriteItemStockPriceReferences(data: CustomerDetails) {
        var customerRef = "";

        // NOTE: formula for ID {dealerID}{customer.externalCode} or {dealerID}{customer.customerID}
        if (this._commonData.dealer) {
            if (this._commonData.dealer.hasExternalSystem) {
                customerRef = "{{0}}{{1}}".format(this._commonData.dealer.dealerID, data.externalCode);
            } else {
                customerRef = "{{0}}{{1}}".format(this._commonData.dealer.dealerID, data.dealerID);
            }
        }

        const customerFavorite = await this._ngFirestore.doc(`/customerItemFavorite/${customerRef}`)
            .ref
            .get();

        return (customerFavorite.exists ? customerFavorite.data().itemStockPriceReferences : []);
    }

    async getCustomersList(dealerID: string) {
        var docRef = this._ngFirestore.collection<CustomerDetails>('customer').ref;
        if (this._authService.loggedInUser && (this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == dealerID).roles?.customer)) {
            const value = await docRef.orderBy('customerName')
                .where('dealerID', '==', dealerID)
                .where('customerID', '==', this._authService.loggedInFirebaseUser.uid)
                .where('isActive', '==', true) // Show active customers.
                .get({ source: 'server' });
            // .get(updateCache4Customer ? { source: 'server' } : { source: 'cache' });
            return value.docs.map(doc => doc.data());
        } else {
            // if allowedAreas are set then filter according to the areacode else all customsers are allowed for the selection
            const dealerMapInfo = this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == dealerID);
            if (dealerMapInfo.allowedAreas) {
                const value = await docRef.orderBy('customerName')
                    .where('dealerID', '==', dealerID)
                    .where('areaCode', 'in', dealerMapInfo.allowedAreas)
                    .where('isActive', '==', true) // Show active customers.
                    .get({ source: 'server' });
                // .get(updateCache4Customer ? { source: 'server' } : { source: 'cache' });
                return value.docs.map(doc => doc.data());
            } else {
                const value = await docRef.orderBy('customerName')
                    .where('dealerID', '==', dealerID)
                    .where('isActive', '==', true) // Show active customers.
                    .get({ source: 'server' });
                // .get(updateCache4Customer ? { source: 'server' } : { source: 'cache' });
                return value.docs.map(doc => doc.data());
            }
        }
    }

    getCustomersListRT(dealerID: string): AngularFirestoreCollection<any> {
        let list: AngularFirestoreCollection<any>;

        if (this._authService.loggedInUser && (this._authService.loggedInUser.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == dealerID).roles?.customer)) {
            list = this._ngFirestore.collection<CustomerDetails>('customer', ref =>
                ref.orderBy('customerName')
                    .where('dealerID', '==', dealerID)
                    .where('customerID', '==', this._authService.loggedInFirebaseUser.uid)
                    .where('isActive', '==', true) // Show active customers.
            );
        } else {
            list = this._ngFirestore.collection<CustomerDetails>('customer', ref =>
                ref.orderBy('customerName')
                    .where('dealerID', '==', dealerID)
                    .where('isActive', '==', true) // Show active customers.
            );
        }

        return list;
    }

    async deleteAll_customer(dealerID: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await this._ngFirestore.collection<any>('customer')
                    .get()
                    .forEach(value => {
                        let i = 0;
                        value.forEach(async element => {
                            if (element.data().dealerID == dealerID) {
                                i++;
                                await this._ngFirestore.doc(`/customer/${element.id}`).delete();
                            }
                        });
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

    /**
     * Upload multiple customers to the database.
     * @param arrCustomerDetails Array of CustomerDetails.
     */
    public async uploadCustomers(arrCustomerDetails: CustomerDetails[]): Promise<void> {
        let i = 0;
        arrCustomerDetails.forEach(async element => {
            // if (i > 100) {
            //     return;
            // }
            // i++;

            await this.createCustomer(element);
        });
        // Update caching version so that others can refresh the customer data
        if (arrCustomerDetails.length > 0) this._dealerService.updateVersionOfStaticData(this._commonData.dealer.dealerID, "C");
    }

    private async createCustomer(data: CustomerDetails) {
        try {
            const customerID: string = this._ngFirestore.createId();

            return this._ngFirestore.doc(`/customer/${customerID}`)
                .set({
                    customerID: customerID,
                    userProfileUID: data.userProfileUID,
                    dealerID: data.dealerID,
                    customerName: data.customerName,
                    externalCode: data.externalCode,
                    externalCode1: data.externalCode1,
                    externalCode2: data.externalCode2,
                    isRetailer: data.isRetailer,
                    mobileNo: data.mobileNo,
                    deliveryAddress: data.deliveryAddress,
                    areaCode: data.areaCode,
                    pincode: data.pincode,
                    email: data.email,
                    gstNo: data.gstNo,
                    gstate_cd: data.gstate_cd,
                    gst_regstr: data.gst_regstr,
                    foodLicenseNo: data.foodLicenseNo,
                    isActive: data.isActive
                });
        } catch (error) {
            console.error(error);
            throw "Error occured while saving customer: {0}. Error: {1}.".format(data.customerName, error);
        }
    }
}