import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

/**
 * Replicate item document changes to itemPackage and itemStockPrice document
 * for below fields.
 * canUploadFile,category,isActive,isDeleted,manufacturer,stockMaintained
 * itemPackages itemPackageID
 */
export const replicateItemChanges = functions
    // .region('asia-east2').firestore
    .region('asia-south1').firestore
    .document('item/{itemID}')
    .onUpdate(async (snapshot, context) => {
        const dataBefore = snapshot.before.data();
        const dataAfter = snapshot.after.data();

        // check if the required columns changed?
        if (dataBefore.canUploadFile !== dataAfter.canUploadFile ||
            dataBefore.itemDescription !== dataAfter.itemDescription ||
            dataBefore.category !== dataAfter.category ||
            dataBefore.isActive !== dataAfter.isActive ||
            dataBefore.isDeleted !== dataAfter.isDeleted ||
            dataBefore.manufacturer !== dataAfter.manufacturer ||
            dataBefore.itemImageThumURL !== dataAfter.itemImageThumURL ||
            dataBefore.stockMaintained !== dataAfter.stockMaintained
        ) {
            // 1. Update all item packages
            // 1.1 get all item packages to be changed
            if (dataAfter.itemPackages) {
                dataAfter.itemPackages.forEach(async (itemPackage: any) => {
                    const itemPackageRef = db.doc(`/item/${dataBefore.itemID}/itemPackage/${itemPackage.itemPackageID}`);

                    // 1.2 update item package 
                    await itemPackageRef.set({
                        canUploadFile: dataAfter.canUploadFile,
                        category: dataAfter.category,
                        itemDescription: dataAfter.itemDescription,
                        isActive: dataAfter.isActive,
                        isDeleted: dataAfter.isDeleted,
                        manufacturer: dataAfter.manufacturer,
                        itemImageThumURL: dataAfter.itemImageThumURL,
                        itemImageURLs: dataAfter.itemImageURLs,
                        stockMaintained: dataAfter.stockMaintained,
                    }, { merge: true }).catch(error => console.log('Error: ', error));
                });

                // 2. Update all itemStockPrices
                await db.collection(`/itemStockPrice/`)
                    .where('itemID', '==', dataBefore.itemID)
                    .get()
                    .then(async (itemStockPriceSnap) => {
                        const batch = db.batch();
                        // get all itemStockPrices ref which has same itemID
                        itemStockPriceSnap.forEach(itemStockPrice => {
                            batch.set(itemStockPrice.ref, {
                                canUploadFile: dataAfter.canUploadFile,
                                itemDescription: dataAfter.itemDescription,
                                category: dataAfter.category,
                                isActive: dataAfter.isActive,
                                manufacturer: dataAfter.manufacturer,
                                itemImageURLs: dataAfter.itemImageURLs,
                                itemImageThumURL: dataAfter.itemImageThumURL,
                                stockMaintained: dataAfter.stockMaintained,
                            }, { merge: true });
                        });

                        await batch.commit();
                    });
            }

            return;
        } else {
            return;
        }
    });
