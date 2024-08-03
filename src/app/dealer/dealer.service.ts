import { Injectable } from '@angular/core';
import {
    AngularFirestore,
    AngularFirestoreCollection,
} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { Dealer, StaticDataCachedVer, TrackStaticDataCache } from './model/dealer';
import { UserProfile } from '../auth/model/userProfile';

@Injectable({
    providedIn: 'root'
})
export class DealerService {
    constructor(private fireStore: AngularFirestore,
    ) { }

    trackVersionOfStaticData(dealerID: string) {
        try {
            return this.fireStore.collection(`/staticDataCachedVer/`).doc<StaticDataCachedVer>(dealerID)
                .valueChanges()
                .forEach((data) => {
                    TrackStaticDataCache.staticDataChanged(data);

                    return;
                });
        } catch (error) {
            console.error(error);
        }
    }

    updateVersionOfStaticData(dealerID: string, updateStaticData: "C" | "I" | "S") {
        const refDoc = this.fireStore.doc(`/staticDataCachedVer/${dealerID}`).ref;

        switch (updateStaticData) {
            case "C":
                return refDoc.set({
                    verCustomer: firebase.firestore.FieldValue.increment(1),
                }, { merge: true });
            case "I":
                return refDoc.set({
                    verItemStockPrice: firebase.firestore.FieldValue.increment(1),
                }, { merge: true });
            case "S":
                return refDoc.set({
                    verSalesperson: firebase.firestore.FieldValue.increment(1),
                }, { merge: true });
        }
    }

    async userDealerList(user: UserProfile): Promise<Dealer[]> {
        let mappedDealers = Array<Dealer>();

        if (user) {
            const dealerListSnap = await this.fireStore.collection<Dealer>(`/dealers/`, ref => ref.where('isActive', '==', true)).ref.get();

            dealerListSnap.forEach(dealerDoc => {
                if (dealerDoc.exists) {
                    // search the dealer if it is mapped to the logged in user and then add it to the list.
                    if (user.dealerUserMappingInfo.find(dumi => dumi.dealerID == dealerDoc.id)) {
                        const dealerData = Object.assign({}, dealerDoc.data());
                        let dealer = new Dealer();

                        dealer.dealerID = dealerData.dealerID;
                        dealer.dealerCode = dealerData.dealerCode;
                        dealer.companyCode = dealerData.companyCode;
                        dealer.dealerName = dealerData.dealerName;
                        dealer.address = dealerData.address;
                        dealer.dealerEmailAddress = dealerData.dealerEmailAddress;

                        mappedDealers.push(dealer);
                    }
                }
            });
        }

        return mappedDealers;
    }

    getDealerDetails(dealerCode: string): AngularFirestoreCollection<any> {
        return this.fireStore.collection<Dealer>(`/dealers/`, ref =>
            ref.where('isActive', '==', true)
                .where('dealerCode', '==', dealerCode.toLowerCase())
        );
    }
    /**Creates new Dealer.*/
    async createDealer(dealerData: Dealer): Promise<void> {
        const id: string = this.fireStore.createId();

        try {
            return this.fireStore
                .doc<Dealer>(`/dealers/${id}`)
                .set({
                    dealerID: id,
                    dealerCode: await this.generateDealerCode(dealerData.dealerCode), // Code will be created from this class.
                    companyCode: dealerData.companyCode,
                    dealerName: dealerData.dealerName,
                    hasExternalSystem: dealerData.hasExternalSystem,
                    dealerEmailAddress: dealerData.dealerEmailAddress,
                    address: dealerData.address,
                    dealerLogoURL: dealerData.dealerLogoURL,
                    instructions: dealerData.instructions,
                    minimumOrderAmount: dealerData.minimumOrderAmount,
                    isActive: dealerData.isActive,
                });
        } catch (error) {
            console.error(error);
        }
    }
    private async generateDealerCode(dealerCode: string): Promise<string> {
        const allowedChars = "abcdefghjkmnpqrstuvwxyz123456789";
        return (dealerCode == "" ? this.makeRandom(4, allowedChars) : dealerCode);
    }

    private makeRandom(lengthOfCode: number, possible: string) {
        let text = "";
        for (let i = 0; i < lengthOfCode; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}