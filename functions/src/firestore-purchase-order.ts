import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Create/update ItemStockPrice on creation of purchaseOrderItems.
 * If itemStockPrice exists then it will update the balance qty else it will create a new itemStockPrice.
 */
export const createItemStockPrice_onCreate_purchaseOrderItems = functions
    // .region('asia-east2').firestore
    .region('asia-south1').firestore
    .document('purchaseOrderItems/{purchaseOrderItemID}')
    .onCreate(async (snapshot, context) => {
        const data = snapshot.data();

        const salesOrderRef = db.collection('itemStockPrice');

        // Check if the itemPackage exists with same mrp and sellingPrice in itemStockPrice
        await salesOrderRef.where('itemPackageID', '==', data.itemPackageID)
            .where('mrp', '==', data.mrp)
            .where('sellingPrice', '==', data.sellingPrice)
            .get()
            .then(async itemStockPriceSnap => {
                if (itemStockPriceSnap.empty) {
                    // 1. document does not exists so create a new document
                    // NOTE: create doucment id, there is no inbuild method .createId() to create a new document id.
                    const itemStockPriceID = db.collection('_').doc().id;

                    await db.doc(`/itemStockPrice/${itemStockPriceID}`)
                        .set({
                            itemStockPriceID: itemStockPriceID,
                            itemPackageID: data.itemPackageID,
                            externalCode: data.externalCode,
                            externalCode1: data.externalCode1,
                            externalCode2: data.externalCode2,
                            itemName: data.itemName,
                            itemDescription: data.itemDescription,
                            stockDate: admin.firestore.FieldValue.serverTimestamp(),
                            mrp: data.mrp,
                            sellingPrice: data.sellingPrice,
                            wholesalePrice: data.wholesalePrice,
                            balanceQty: data.stockQty,  // while adding a new stock, balanceQty will be stockQty
                            userIDNEW: data.userIDNEW,
                            itemID: data.itemID,
                            dealerID: data.dealerID,
                            category: data.category,
                            manufacturer: data.manufacturer,
                            tags: "",   // don't want to store this field value as it has calculated value
                            itemImageThumURL: data.itemImageThumURL,
                            itemImageURLs: data.itemImageURLs,
                            packageSize: data.packageSize,
                            packageUnit: data.packageUnit,
                            canUploadFile: data.canUploadFile,
                            stockMaintained: data.stockMaintained,
                            isActive: data.isActive
                        });
                } else {
                    // 2. document exists update the same with by incrementing balanceQty by stockQty
                    itemStockPriceSnap.forEach(async itemStockPriceDoc => {
                        // ItemStockPrice exists update the balanceQty
                        await itemStockPriceDoc.ref.set({
                            balanceQty: admin.firestore.FieldValue.increment(data.stockQty),
                        }, { merge: true }).catch(error => console.log('Error: ', error));
                    });
                }
            });

        return;
    });
