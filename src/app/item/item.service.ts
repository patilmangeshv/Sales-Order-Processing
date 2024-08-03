import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import {
    AngularFirestore,
    AngularFirestoreCollection,
    AngularFirestoreDocument,
    AngularFirestoreCollectionGroup,
} from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { Category, Manufacturer, Item, ItemStockPrice, ItemPackage, IItemPackage } from './model/item';
import { AuthService } from '../auth/auth.module';
import { CommonService } from '../shared/common.service';
import { DealerService } from '../dealer/dealer.service';
import { Utilities, ValidationError } from '../utils/utilities';

@Injectable({
    providedIn: 'root'
})
export class ItemsService {

    constructor(private afAuth: AngularFireAuth,
        private _ngFirestore: AngularFirestore,
        private _authService: AuthService,
        private _commonData: CommonService,
        private _dealerService: DealerService,
    ) { }

    /**Array of item package units.*/
    public PackageUnits = [{ value: "g", description: "gram" },
    { value: "kg", description: "kilo gram" },
    { value: "l", description: "liter" },
    { value: "ml", description: "mili liter" },
    { value: "box", description: "box" },
    { value: "pcs", description: "piece" },
    { value: "pages", description: "pages" },
    { value: "dozen", description: "dozen" },
    { value: "\"", description: "inch" },
    { value: "pkd", description: "pack" },
    { value: "copy", description: "copy" }
    ];

    public getPackageUnits(): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<any>('packageUnits', ref =>
            ref.orderBy('description')
        );
    }

    public getCategories(dealerID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<Category>('category', ref =>
            ref.orderBy('categoryName')
                .where('dealerID', '==', dealerID)
                .where('isActive', '==', true)
        );
    }

    public getManufacturers(dealerID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<Manufacturer>('manufacturer', ref =>
            ref.orderBy('manufacturerName')
                .where('dealerID', '==', dealerID)
                .where('isActive', '==', true)
        );
    }

    public async uploadManufacturers(arrManufacturer: Manufacturer[]): Promise<void> {
        arrManufacturer.forEach(async manufacturer => {
            await this.createManufacturer(manufacturer);
        });
    }

    private createManufacturer(manufacturer: Manufacturer) {
        try {
            let docID = "";
            if (manufacturer.externalCode) {
                docID = "{{0}}{{1}}".format(manufacturer.dealerID, manufacturer.externalCode);
            } else {
                docID = this._ngFirestore.createId();
            }

            return this._ngFirestore.doc(`/manufacturer/${docID}`)
                .set({
                    dealerID: manufacturer.dealerID,
                    manufacturerName: manufacturer.manufacturerName,
                    externalCode: manufacturer.externalCode,
                    isActive: manufacturer.isActive,
                });
        } catch (error) {
            console.error(error);
            throw "Error occured while saving manufacturer: {0}. Error: {1}.".format(manufacturer.manufacturerName, error);
        }
    }

    public async uploadCategories(arrCategories: Category[]): Promise<void> {
        arrCategories.forEach(async category => {
            await this.createCategory(category);
        });
    }

    private createCategory(category: Category) {
        try {
            let docID = "";
            if (category.externalCode) {
                docID = "{{0}}{{1}}".format(category.dealerID, category.externalCode);
            } else {
                docID = this._ngFirestore.createId();
            }

            return this._ngFirestore.doc(`/category/${docID}`)
                .set({
                    dealerID: category.dealerID,
                    categoryName: category.categoryName,
                    externalCode: category.externalCode,
                    imageURL: category.imageURL,
                    isActive: category.isActive,
                });
        } catch (error) {
            console.error(error);
            throw "Error occured while saving category: {0}. Error: {1}.".format(category.categoryName, error);
        }
    }

    public async uploadItems(arrItems: Item[]): Promise<void> {
        arrItems.forEach(async item => {
            await this.createItemFromUpload(item);
        });
    }

    private createItemFromUpload(item: Item) {
        try {
            let docID = "";
            if (item.itemID) {
                docID = item.itemID;
            } else {
                docID = this._ngFirestore.createId();
            }

            const batchItem = this._ngFirestore.firestore.batch();

            const itemRef = this._ngFirestore.collection('item').doc(docID).ref;

            batchItem.set(itemRef, {
                itemID: item.itemID,
                dealerID: item.dealerID,
                itemName: item.itemName,
                itemDescription: item.itemDescription,
                category: item.category,
                manufacturer: item.manufacturer,
                itemPackages: item.itemPackages,
                tags: "",   // don't want to store this field value as it has calculated value
                itemImageThumURL: item.itemImageThumURL,
                itemImageURLs: item.itemImageURLs,
                canUploadFile: item.canUploadFile,
                stockMaintained: item.stockMaintained,
                isActive: item.isActive,
                userIDNEW: this._authService.loggedInFirebaseUser?.uid,
                isDeleted: false,
            });

            item.itemPackages.forEach(itemPackage => {
                const itemPackageRef = this._ngFirestore.doc<ItemPackage>(`/item/${docID}/itemPackage/${itemPackage.itemPackageID}`).ref;

                batchItem.set(itemPackageRef, {
                    itemPackageID: itemPackage.itemPackageID,
                    itemID: docID,
                    dealerID: item.dealerID,
                    itemPackageName: itemPackage.itemPackageName,
                    itemDescription: item.itemDescription,
                    packageSize: itemPackage.packageSize,
                    packageUnit: itemPackage.packageUnit,
                    category: item.category,
                    manufacturer: item.manufacturer,
                    tags: "",
                    itemImageThumURL: item.itemImageThumURL,
                    itemImageURLs: item.itemImageURLs,
                    canUploadFile: item.canUploadFile,
                    stockMaintained: item.stockMaintained,
                    isActive: item.isActive,
                    isDeleted: false,        
                });
            });

            return batchItem.commit();

        } catch (error) {
            console.error(error);
            throw "Error occured while saving item: {0}. Error: {1}.".format(item.itemName, error);
        }
    }

    getItemList(dealerID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<Item>('item', ref =>
            ref.orderBy('itemName')
                .where('dealerID', '==', dealerID)
                .where('isDeleted', '==', false)
            // .where('isActive', '==', true) Show all items including inactive.
        );
    }

    getItemPackageDetail(itemPackageID: string): AngularFirestoreCollectionGroup<any> {
        return this._ngFirestore.collectionGroup<ItemPackage>(`itemPackage`, ref =>
            ref.where('itemPackageID', '==', itemPackageID)
                .where('isDeleted', '==', false)
        );
    }

    getItemStockPriceList(dealerID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<ItemStockPrice>('itemStockPrice', ref =>
            ref.orderBy('itemName')
                .where('dealerID', '==', dealerID)
        );
    }

    getActiveItemStockPriceList(dealerID: string) {
        var docRef = this._ngFirestore.collection<ItemStockPrice>('itemStockPrice').ref;

        // Valid options for source are 'server', 'cache', or 'default'

        return docRef.orderBy('itemName')
            .where('dealerID', '==', dealerID)
            .where('isActive', '==', true)
            .get({ source: 'server' })
            // .get(TrackStaticDataCache.updateCache4ItemStockPrice ? { source: 'server' } : { source: 'cache' })
            .then((value) => {
                return value.docs.map(doc => doc.data());
                // }).catch(function (error) {
                //     console.log("Error getting itemStockPrice document:", error);
            });
    }

    getActiveItemStockPriceListRT(dealerID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<ItemStockPrice>('itemStockPrice', ref =>
            ref.orderBy('itemName')
                .where('dealerID', '==', dealerID)
                .where('isActive', '==', true)
        );
    }
    async deleteAll_itemStockPrice(dealerID: string) {
        return new Promise(async (resolve, reject) => {
            try {
                await this._ngFirestore.collection<any>('itemStockPrice')
                    .get()
                    .forEach(value => {
                        let i = 0;
                        value.forEach(async element => {
                            if (element.data().dealerID == dealerID) {
                                i++;
                                await this._ngFirestore.doc(`/itemStockPrice/${element.id}`).delete();
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

    getItemDetail(itemID: string): AngularFirestoreCollection<any> {
        return this._ngFirestore.collection<Item>(`/item/`, ref =>
            ref.where('itemID', '==', itemID));
    }

    getActiveItemPackageList(dealerID: string): AngularFirestoreCollectionGroup<any> {
        // Query to get all itemID together and then by itemName of itemPackage
        return this._ngFirestore.collectionGroup<ItemPackage>('itemPackage', ref =>
            ref.orderBy('itemID').orderBy('itemName')
                .where('dealerID', '==', dealerID)
                .where('isActive', '==', true)
                .where('isDeleted', '==', false)
        );
    }

    /**
     * Upload multiple item stock prices to the database.
     * @param arrItemStockPrice Array of ItemStockPrice.
     */
    public async uploadItemStockPrices(arrItemStockPrice: ItemStockPrice[]): Promise<void> {
        let i = 0;
        arrItemStockPrice.forEach(async element => {
            // if (i > 300) {
            //     return;
            // }
            // i++;

            await this.createItemStockPrice(element);
        });
        // Update caching version so that others can refresh the ItemStockPrice er data
        if (arrItemStockPrice.length > 0) this._dealerService.updateVersionOfStaticData(this._commonData.dealer.dealerID, "I");
    }

    private async createItemStockPrice(data: ItemStockPrice) {
        try {
            const itemStockPriceID: string = this._ngFirestore.createId();

            return this._ngFirestore.doc(`/itemStockPrice/${itemStockPriceID}`)
                .set({
                    itemStockPriceID: itemStockPriceID,
                    itemPackageID: data.itemPackageID,
                    externalCode: data.externalCode,
                    externalCode1: data.externalCode1,
                    externalCode2: data.externalCode2,
                    itemName: data.itemName,
                    itemDescription: data.itemDescription,
                    stockDate: firebase.firestore.FieldValue.serverTimestamp(),
                    mrp: data.mrp,
                    sellingPrice: data.sellingPrice,
                    wholesalePrice: data.wholesalePrice,
                    wholesalePriceWithGST: data.wholesalePriceWithGST,
                    gst_pc: data.gst_pc,
                    gcess_pc: data.gcess_pc,
                    free_qty: data.free_qty,
                    off_onmrp: data.off_onmrp,
                    hsn_cd: data.hsn_cd,
                    stk_marg: data.stk_marg,
                    balanceQty: data.stockQty,  // while adding a new stock, balanceQty will be stockQty
                    stockQty: data.stockQty,
                    returnQty: data.returnQty,
                    stockMinimumQty: data.stockMinimumQty,
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

        } catch (error) {
            console.error(error);
            throw "Error occured while saving item: {0}. Error: {1}.".format(data.itemName, error);
        }
    }

    private async createItemLocal(itemData: Item): Promise<void> {
        try {
            return this._ngFirestore
                .doc<Item>(`/item/${itemData.itemID}`)
                .set({
                    itemID: itemData.itemID,
                    dealerID: itemData.dealerID,
                    itemName: itemData.itemName,
                    itemDescription: itemData.itemDescription,
                    category: itemData.category,
                    manufacturer: itemData.manufacturer,
                    tags: "",   // don't want to store this field value as it has calculated value
                    itemImageThumURL: itemData.itemImageThumURL,
                    itemImageURLs: itemData.itemImageURLs,
                    canUploadFile: itemData.canUploadFile,
                    stockMaintained: itemData.stockMaintained,
                    isActive: itemData.isActive,
                    userIDNEW: this._authService.loggedInFirebaseUser?.uid,
                    isDeleted: false,
                });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**Creates new Item document.*/
    async createItem(itemData: Item, itemImageThum: File, itemImages: File[]): Promise<void> {
        let itemID: string;

        if (itemData.itemID) {
            itemID = itemData.itemID;
        } else {
            itemID = this._ngFirestore.createId();
            // update item id
            itemData.itemID = itemID;
        }

        // 1. Upload item image Thumnail to storage
        if (itemImageThum) {
            let storageFolderName: string, storageFileName: string, customMetadata: any;
            storageFolderName = "item";
            // removed extension as user may upload different type of file while modifying which will end up in uploading multiple files
            // in new and modify modes. 
            storageFileName = itemID + "_Thum" // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum"
            // storageFileName = itemID + "_Thum." + itemImageThum.type.split('/')[1] // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum." + "jpeg"
            customMetadata = { itemID: itemID, originalFileName: itemImageThum.name, storageFileName: storageFileName };

            // 3. Add record to the firestore DB with above image URLs
            Utilities.uploadImage2Storage(itemImageThum, storageFolderName, storageFileName, customMetadata)
                .subscribe(async uploadTask => {
                    // 6.1 Get the uploaded files URL
                    itemData.itemImageThumURL = await uploadTask.ref.getDownloadURL();

                    // 7. create a item
                    return this.createItemLocal(itemData);
                });
        } else {
            return this.createItemLocal(itemData);
        }
    }

    /**Modifies changes of Item.*/
    async modifyItem(itemData: Item, itemImageThum: File, itemImages: File[]): Promise<void> {
        const itemID: string = itemData.itemID;

        if (itemImageThum) {
            let storageFolderName: string, storageFileName: string, customMetadata: any;
            storageFolderName = "item";
            // removed extension as user may upload different type of file while modifying which will end up in uploading multiple files
            // in new and modify modes. 
            storageFileName = itemID + "_Thum" // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum"
            // storageFileName = itemID + "_Thum." + itemImageThum.type.split('/')[1] // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum." + "jpeg"
            customMetadata = { itemID: itemID, originalFileName: itemImageThum.name, storageFileName: storageFileName };

            Utilities.uploadImage2Storage(itemImageThum, storageFolderName, storageFileName, customMetadata)
                .subscribe(async uploadTask => {
                    // 6.1 Get the uploaded files URL
                    itemData.itemImageThumURL = await uploadTask.ref.getDownloadURL();

                    // 7. create a item
                    return this.modifyItemLocal(itemData);
                });
        } else {
            return this.modifyItemLocal(itemData);
        }
    }

    private async modifyItemLocal(itemData: Item): Promise<void> {
        try {
            return this._ngFirestore.collection('item').doc(itemData.itemID)
                .set({
                    itemName: itemData.itemName,
                    itemDescription: itemData.itemDescription,
                    category: itemData.category,
                    manufacturer: itemData.manufacturer,
                    itemImageThumURL: itemData.itemImageThumURL,
                    itemImageURLs: itemData.itemImageURLs,
                    canUploadFile: itemData.canUploadFile,
                    stockMaintained: itemData.stockMaintained,
                    isActive: itemData.isActive,
                }, { merge: true });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async deleteItem(itemData: Item): Promise<void> {
        // 1. Delete itemPackage
        await this._ngFirestore.collectionGroup('itemPackage', ref =>
            ref.where('itemID', '==', itemData.itemID)).get()
            .forEach(items => {
                items.forEach(async element => {
                    await this.deleteItemPackage(element.id, itemData)
                });
            });

        // 2. Delete item
        return this._ngFirestore.doc(`/item/${itemData.itemID}`)
            .set({
                isDeleted: true,
            }, { merge: true });
    }

    private async createItemPackageLocal(itemPackage: ItemPackage, itemData: Item): Promise<void> {
        const batchItem = this._ngFirestore.firestore.batch();

        const itemRef = this._ngFirestore.collection('item').doc(itemPackage.itemID).ref;
        const itemPackageRef = this._ngFirestore.doc<ItemPackage>(`/item/${itemPackage.itemID}/itemPackage/${itemPackage.itemPackageID}`).ref;

        batchItem.set(itemRef, {
            itemPackages: itemData.itemPackages,
        }, { merge: true });

        batchItem.set(itemPackageRef, {
            itemPackageID: itemPackage.itemPackageID,
            itemPackageName: itemPackage.itemPackageName,
            itemDescription: itemPackage.itemDescription,
            packageSize: itemPackage.packageSize,
            packageUnit: itemPackage.packageUnit,
            itemID: itemPackage.itemID,
            dealerID: itemPackage.dealerID,
            category: itemPackage.category,
            manufacturer: itemPackage.manufacturer,
            tags: itemPackage.tags,
            itemImageThumURL: itemPackage.itemImageThumURL,
            itemImageURLs: itemPackage.itemImageURLs,
            canUploadFile: itemPackage.canUploadFile,
            stockMaintained: itemPackage.stockMaintained,
            isActive: itemPackage.isActive,
            isDeleted: false,
        });

        return batchItem.commit();
    }

    async createItemPackage(itemPackage: ItemPackage, itemData: Item, itemImageThum: File, itemImages: File[]): Promise<void> {
        try {
            const itemPackageID: string = this._ngFirestore.createId();

            // 1. Create blank item packages if it is undefined
            if (!itemData.itemPackages) {
                itemData.itemPackages = new Array<IItemPackage>();
            }

            // 2. Check for duplicate package & unit
            if (!(itemData.itemPackages.findIndex(value => value.packageSize == itemPackage.packageSize
                && value.packageUnit == itemPackage.packageUnit) == -1)) {
                throw new ValidationError('Duplicate package size ({0}) and unit ({1}).'.format(itemPackage.packageSize, itemPackage.packageUnit));
            }

            // 3. Add new item package to item document.
            let newPackage: IItemPackage = { itemPackageID: itemPackageID, itemPackageName: itemPackage.itemPackageName, packageSize: itemPackage.packageSize, packageUnit: itemPackage.packageUnit };
            itemData.itemPackages.push(newPackage);

            // 4. Update the itemPackageID
            itemPackage.itemPackageID = itemPackageID;

            if (itemImageThum) {
                // 5. compose the file name
                let storageFolderName: string, storageFileName: string, customMetadata: any;
                storageFolderName = "itemPackage";
                // removed extension as user may upload different type of file while modifying which will end up in uploading multiple files
                // in new and modify modes. 
                storageFileName = itemPackageID + "_Thum" // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum"
                // storageFileName = itemPackageID + "_Thum." + itemImageThum.type.split('/')[1] // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum." + "jpeg"
                customMetadata = { itemPackageID: itemPackageID, originalFileName: itemImageThum.name, storageFileName: storageFileName };

                // 6. upload image to storage
                Utilities.uploadImage2Storage(itemImageThum, storageFolderName, storageFileName, customMetadata)
                    .subscribe(async uploadTask => {
                        // 6.1 Get the uploaded files URL
                        itemPackage.itemImageThumURL = await uploadTask.ref.getDownloadURL();

                        // 7. create a item package
                        return this.createItemPackageLocal(itemPackage, itemData);
                    });
            } else {
                // 7. create a item package without image file
                return this.createItemPackageLocal(itemPackage, itemData);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async modifyItemPackage(itemPackage: ItemPackage, itemData: Item, itemImageThum: File, itemImages: File[]): Promise<void> {
        try {
            const itemPackageID: string = itemPackage.itemPackageID;

            // 1. Create blank item packages if it is undefined
            if (!itemData.itemPackages) {
                itemData.itemPackages = new Array<IItemPackage>();
            }

            // 2. Check for duplicate package & unit exluding itself
            if (!(itemData.itemPackages.findIndex(value => value.itemPackageID !== itemPackage.itemPackageID && value.packageSize == itemPackage.packageSize
                && value.packageUnit == itemPackage.packageUnit) == -1)) {
                throw new ValidationError('Duplicate package size ({0}) and unit ({1}).'.format(itemPackage.packageSize, itemPackage.packageUnit));
            }

            if (itemImageThum) {
                // 3. compose the file name
                let storageFolderName: string, storageFileName: string, customMetadata: any;
                storageFolderName = "itemPackage";
                // removed extension as user may upload different type of file while modifying which will end up in uploading multiple files
                // in new and modify modes. 
                storageFileName = itemPackageID + "_Thum" // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum"
                // storageFileName = itemPackageID + "_Thum." + itemImageThum.type.split('/')[1] // e.g. "DU5iFOT20cwDKLhbyPyh" + "_Thum." + "jpeg"
                customMetadata = { itemPackageID: itemPackageID, originalFileName: itemImageThum.name, storageFileName: storageFileName };

                // 4. upload image to storage
                Utilities.uploadImage2Storage(itemImageThum, storageFolderName, storageFileName, customMetadata)
                    .subscribe(async uploadTask => {
                        // 4.1 Get the uploaded files URL
                        itemPackage.itemImageThumURL = await uploadTask.ref.getDownloadURL();

                        // 5. update a item package
                        return this.modifyItemPackageLocal(itemPackage, itemData);
                    });
            } else {
                // 5. update a item package without image file
                return this.modifyItemPackageLocal(itemPackage, itemData);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private async modifyItemPackageLocal(itemPackage: ItemPackage, itemData: Item): Promise<void> {
        try {
            await this._ngFirestore.collection(`/item/${itemPackage.itemID}/itemPackage/`)
                .doc(itemPackage.itemPackageID)
                .set({
                    itemPackageName: itemPackage.itemPackageName,
                    itemDescription: itemPackage.itemDescription,
                    packageSize: itemPackage.packageSize,
                    packageUnit: itemPackage.packageUnit,
                    itemID: itemPackage.itemID,
                    dealerID: itemPackage.dealerID,
                    category: itemPackage.category,
                    manufacturer: itemPackage.manufacturer,
                    tags: itemPackage.tags,
                    itemImageThumURL: itemPackage.itemImageThumURL,
                    itemImageURLs: itemPackage.itemImageURLs,
                    canUploadFile: itemPackage.canUploadFile,
                    stockMaintained: itemPackage.stockMaintained,
                    isActive: itemPackage.isActive,
                }, { merge: true });
        } catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
    }

    async deleteItemPackage(itemPackageID: string, itemData: Item): Promise<void> {
        return new Promise(async (resolve, reject) => {
            // 1. Check for package & unit existence
            let foundIndex = itemData.itemPackages.findIndex(value => value.itemPackageID == itemPackageID);

            if (foundIndex == -1) {
                // Not found
                throw new ValidationError('Package does not exists: {0}.'.format(itemPackageID));
            } else {
                // 2. delete item package from item document.
                itemData.itemPackages.splice(foundIndex, 1);

                const batchItem = this._ngFirestore.firestore.batch();

                const itemRef = this._ngFirestore.doc(`/item/${itemData.itemID}`).ref;
                const itemPackageRef = this._ngFirestore.doc(`/item/${itemData.itemID}/itemPackage/${itemPackageID}`).ref;

                // 3. Update packages in item document.
                batchItem.set(itemRef, { itemPackages: itemData.itemPackages, }, { merge: true });
                // 4. delete the package from itemPackage collection
                batchItem.set(itemPackageRef, { isDeleted: true, }, { merge: true });

                return batchItem.commit();
            }
        });
    }

    // private async uploadImage2DB(mode: string, itemData: Item, file: File, storageFolderName: string, storageFileName: string, customMetadata: any): Promise<void> {
    //     // The storage path
    //     const storagePath = `${storageFolderName}/${storageFileName}`;

    //     // File reference
    //     const fileRef = this._ngStorage.ref(storagePath);

    //     // size of the file
    //     let fileSize: number;

    //     // The main task to upload the file
    //     const task = this._ngStorage.upload(storagePath, file, { customMetadata });

    //     task.snapshotChanges().pipe(
    //         finalize(async () => {
    //             // Get uploaded file storage path
    //             const uploadedFileURL = await fileRef.getDownloadURL().toPromise();

    //             // update image URL to 
    //             itemData.itemImageThumURL = uploadedFileURL;
    //             if (mode == 'NEW') {
    //                 await this.createItemLocal(itemData);
    //             } else {
    //                 await this.modifyItemLocal(itemData);
    //             }
    //         }),
    //         tap(snap => {
    //             fileSize = snap.totalBytes;
    //         })
    //     ).subscribe();
    // }
}