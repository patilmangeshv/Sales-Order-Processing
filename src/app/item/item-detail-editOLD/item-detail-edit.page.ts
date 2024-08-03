import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';

import { CommonService } from '../../shared/common.service';
import { Utilities } from '../../utils/utilities';

import { Item, Category, Manufacturer, ItemPackage } from '../../item/model/item';
import { ItemsService } from '../../item/item.service';

@Component({
    templateUrl: './item-detail-edit.page.html',
    styleUrls: ['./styles/forms-validations.page.scss'],
})
export class ItemDetailEditOLDPage implements OnInit {
    public isDataLoaded: boolean = false;
    public itemDetailForm: FormGroup;
    public editItemMode: boolean = false;

    public categories: Category[];
    public manufacturers: Manufacturer[];
    public packageUnits: any[];

    private _formMode: string;  // ModeForm, NEW/MODIFY

    validations = {
        'itemName': [
            { type: 'required', message: 'Item name is required.' },
            { type: 'minlength', message: 'Item name must be at least 5 characters long.' },
            { type: 'maxlength', message: 'Item name cannot be more than 50 characters long.' },
            // { type: 'pattern', message: 'Item name must contain only numbers and letters.' },
        ],
        'itemDescription': [
            { type: 'required', message: 'Item description is required.' },
            { type: 'minlength', message: 'Item description must be at least 5 characters long.' },
            { type: 'maxlength', message: 'Item description cannot be more than 500 characters long.' },
        ],
        'category': [
            { type: 'required', message: 'Category is required.' },
        ],
        'manufacturer': [
            { type: 'required', message: 'Manufacturer is required.' },
        ],
        'stockMaintained': [
            { type: 'required', message: 'Stock maintained flag is required.' },
        ],
        'isActive': [
            { type: 'required', message: 'Active flag is required.' },
        ],
        'itemPackages': [
            { type: 'required', message: 'At least one item package is required.' },
        ],
        'packageSize': [
            { type: 'required', message: 'Size is required.' },
            { type: 'min', message: 'Size should be between 0.1 and 1000.' },
            { type: 'max', message: 'Size should be between 0.1 and 1000.' },
            { type: 'pattern', message: 'Only numbers are allowed.' },
        ],
        'packageUnit': [
            { type: 'required', message: 'Unit is required.' },
        ],
    };

    constructor(
        public commonData: CommonService,
        private _fb: FormBuilder,
        private _itemService: ItemsService,
        private _route: ActivatedRoute,
        private _router: Router,
    ) { }

    public createItemPackage(itemPackageData: ItemPackage): FormGroup {
        return this._fb.group({
            itemPackageID: new FormControl(itemPackageData.itemPackageID),
            itemID: new FormControl(itemPackageData.itemID),
            itemName: new FormControl(itemPackageData.itemPackageName, Validators.compose([
                Validators.minLength(5),
                Validators.maxLength(50),
                Validators.required
            ])),
            itemDescription: new FormControl(itemPackageData.itemDescription, Validators.compose([
                Validators.minLength(5),
                Validators.maxLength(500),
                Validators.required
            ])),
            packageSize: new FormControl(itemPackageData.packageSize, Validators.compose([
                Validators.min(0.1),
                Validators.max(1000),
                Validators.required,
                Validators.pattern('^[0-9_.]+$'),
            ])),
            packageUnit: new FormControl(itemPackageData.packageUnit, [Validators.required]),
            itemImageThumURL: new FormControl(itemPackageData.itemImageThumURL),
            itemImageURLs: new FormControl(itemPackageData.itemImageURLs),
            isActive: new FormControl(itemPackageData.isActive, [Validators.required]),
            editItemPackageMode: new FormControl(true), // Default in Edit mode
            showDetailForm: new FormControl(false),  // Default hide other controls
        });
    }

    async getFormData(itemID: string) {
        if (itemID) {
            // Edit Mode
            this._formMode = 'MODIFY';
            // set mode to non-edit mode, 
            this.editItemMode = false;
            this.enableItemControls(false);

            await this.populateItemDetails(itemID);
        } else {
            // NEW Mode
            this._formMode = 'NEW';

            // set mode to edit mode
            this.editItemMode = true;
            this.enableItemControls(true);
        }
    }

    async populateItemDetails(itemID: string) {
        await this._itemService.getItemDetail(itemID).valueChanges()
            .forEach(item => {
                for (const oneItem of item) {
                    this.itemDetailForm.patchValue({
                        itemID: oneItem.itemID, itemPackageName: oneItem.itemPackageName,
                        itemDescription: oneItem.itemDescription, category: oneItem.category,
                        manufacturer: oneItem.manufacturer, itemImageThumURL: oneItem.itemImageThumURL,
                        itemImageURLs: oneItem.itemImageURLs, canUploadFile: oneItem.canUploadFile,
                        stockMaintained: oneItem.stockMaintained, isActive: oneItem.isActive,
                    }, { emitEvent: true });
                }
            });
    }

    async ngOnInit() {
        // Array for package units from item service
        this.packageUnits = this._itemService.PackageUnits;

        this.itemDetailForm = this._fb.group({
            itemID: new FormControl(null),
            itemName: new FormControl('', Validators.compose([
                Validators.maxLength(50),
                Validators.minLength(5),
                // Validators.pattern('^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$'),
                Validators.required
            ])),
            itemDescription: new FormControl('', Validators.compose([
                Validators.maxLength(500),
                Validators.minLength(5),
                Validators.required
            ])),
            category: new FormControl('', Validators.compose([
                Validators.required
            ])),
            manufacturer: new FormControl('', Validators.compose([
                Validators.required
            ])),
            itemImageThumURL: new FormControl(null),
            itemImageURLs: new FormControl(null),
            canUploadFile: new FormControl(false),
            stockMaintained: new FormControl(true),
            isActive: new FormControl(true),
            itemPackages: this._fb.array([])
        });

        await this.populateOptions();
        this.isDataLoaded = true;

        // get the itemID
        let itemID = this._route.snapshot.paramMap.get('itemID');
        await this.getFormData(itemID);
    }

    private async populateOptions() {
        // Options for Categories
        this._itemService.getCategories(this.commonData.dealer.dealerID).valueChanges()
            .forEach(categories => {
                this.categories = new Array<Category>();

                for (const category of categories) {
                    let c = new Category();

                    // c.categoryID = category.id;
                    c.categoryName = category.categoryName;
                    c.isActive = category.isActive;

                    this.categories.push(c);
                }
            });

        // Options for Manufacturers
        this._itemService.getManufacturers(this.commonData.dealer.dealerID).valueChanges()
            .forEach(manufacturers => {
                this.manufacturers = new Array<Manufacturer>();

                for (const manufacturer of manufacturers) {
                    let m = new Manufacturer();

                    // m.manufacturerID = manufacturer.id;
                    m.manufacturerName = manufacturer.manufacturerName;
                    m.isActive = manufacturer.isActive;

                    this.manufacturers.push(m);
                }
            });
    }

    private enableItemControls(enable: boolean) {
        if (enable) {
            this.itemDetailForm.enable();
        } else {
            // this.itemDetailForm.disable();
            this.itemDetailForm.controls.itemPackageName.disable();
            this.itemDetailForm.controls.itemDescription.disable();
            this.itemDetailForm.controls.category.disable();
            this.itemDetailForm.controls.manufacturer.disable();
            this.itemDetailForm.controls.itemImageThumURL.disable();
            this.itemDetailForm.controls.itemImageURLs.disable();
            this.itemDetailForm.controls.canUploadFile.disable();
            this.itemDetailForm.controls.stockMaintained.disable();
            this.itemDetailForm.controls.isActive.disable();
        }
    }

    public editClicked() {
        this.editItemMode = true;
        this.enableItemControls(true);
    }

    public async saveClicked() {
        try {
            if (this.itemDetailForm.valid) {
                await Utilities.showLoadingCtrl('Saving. Please wait...');

                let item = this.convertItemFormData();
                // save item
                if (this._formMode == 'NEW') {
                    await this._itemService.createItem(item, null, null);
                } else {
                    await this._itemService.modifyItem(item, null, null);
                }

                await Utilities.showAlert("Item saved successfully.", "Success");
                await Utilities.hideLoadingCtrl();

                this.editItemMode = false;
                this.enableItemControls(false);
            }
        } catch (error) {
            console.error(error);
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert("Some exceptions has occured while saving the item!", "Error");
        }
    }

    public async deleteClicked() {
        try {
            if (this.itemDetailForm.valid) {
                await Utilities.showLoadingCtrl('Deleting. Please wait...');

                let item = this.convertItemFormData();
                // save item
                await this._itemService.deleteItem(item);

                await this._router.navigateByUrl("/items");

                await Utilities.showAlert("Item deleted successfully.", "Success");
                await Utilities.hideLoadingCtrl();

                this.editItemMode = false;
                this.enableItemControls(false);
            }
        } catch (error) {
            console.error(error);
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert("Some exceptions has occured while deleting the item!", "Error");
        }
    }

    /**Adds blank item package.*/
    async addItemPackageClicked() {
        var itemPackage = new ItemPackage();

        // Set default values to new Item Package
        itemPackage.itemPackageID = null;
        itemPackage.itemID = this.itemDetailForm.controls.itemID.value;
        itemPackage.itemPackageName = this.itemDetailForm.controls.itemPackageName.value;
        itemPackage.itemDescription = this.itemDetailForm.controls.itemDescription.value;
        itemPackage.isActive = this.itemDetailForm.controls.isActive.value;

        this.itemPackagesControlArray.push(this.createItemPackage(itemPackage));
    }

    public showDetailFormClicked(itemPackage: any, itemIndex: number) {
        this.itemPackagesControlArray.controls[itemIndex].patchValue({ showDetailForm: !itemPackage.showDetailForm });
    }

    private enableItemPackageControls(item: any, enable: boolean) {
        if (enable) {
            item.controls.itemPackageName.enable({ onlySelf: true, emitEvent: false });
            item.controls.itemDescription.enable({ onlySelf: true, emitEvent: false });
            item.controls.packageSize.enable({ onlySelf: true, emitEvent: false });
            item.controls.packageUnit.enable({ onlySelf: true, emitEvent: false });
            item.controls.itemImageThumURL.enable({ onlySelf: true, emitEvent: false });
            item.controls.itemImageURLs.enable({ onlySelf: true, emitEvent: false });
            item.controls.isActive.enable({ onlySelf: true, emitEvent: false });
        } else {
            item.controls.itemPackageName.disable({ onlySelf: true, emitEvent: false });
            item.controls.itemDescription.disable({ onlySelf: true, emitEvent: false });
            item.controls.packageSize.disable({ onlySelf: true, emitEvent: false });
            item.controls.packageUnit.disable({ onlySelf: true, emitEvent: false });
            item.controls.itemImageThumURL.disable({ onlySelf: true, emitEvent: false });
            item.controls.itemImageURLs.disable({ onlySelf: true, emitEvent: false });
            item.controls.isActive.disable({ onlySelf: true, emitEvent: false });
        }
    }

    public editPackageClicked(item: any) {
        item.value.editItemPackageMode = true;
        this.enableItemPackageControls(item, true);
    }

    /**Removes the item package from the list.*/
    public deletePackageClicked(itemIndex: number) {
        if (this.itemPackagesControlArray.value && this.itemPackagesControlArray.value.length > 0) {
            this.itemPackagesControlArray.removeAt(itemIndex);
        }
    }

    public async savePackageClicked(item: any, itemIndex: number) {
        try {
            if (this.itemDetailForm.valid) {
                await Utilities.showLoadingCtrl('Saving. Please wait...');

                let itemPackage = this.convertItemPackageFormData(itemIndex);
                // if itemPackageID is non-empty means it is existing package to modify else it is a NEW package
                if (itemPackage.itemPackageID) {
                    await this._itemService.modifyItemPackage(itemPackage, null, null, null);
                } else {
                    await this._itemService.createItemPackage(itemPackage, null, null, null);
                }

                await Utilities.showAlert("Package saved successfully.", "Success");
                await Utilities.hideLoadingCtrl();

                item.value.editItemPackageMode = false;
                this.enableItemPackageControls(item, false);
            }
        } catch (error) {
            console.error(error);
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert("Some exceptions has occured while saving the package!", "Error");
        }

    }

    public packageSizeUnitChanged(itemPackage: any, itemIndex: number) {
        let newItemName = this.itemDetailForm.controls.itemPackageName.value;
        if (itemPackage.packageSize && itemPackage.packageUnit) {
            newItemName += " " + itemPackage.packageSize + " " + itemPackage.packageUnit;
        }
        this.itemPackagesControlArray.controls[itemIndex].patchValue({ itemPackageName: newItemName });
    }

    // public discardPackageClicked(item: any) {
    //     if (this.itemPackagesControlArray.value && this.itemPackagesControlArray.value.length > 0) {
    //          this.editItemPackageMode = !this.editItemPackageMode;
    //         // code to discard changes
    //     }
    // }

    /**Gets array reference of itemPackages.*/
    public get itemPackagesControlArray(): FormArray {
        return this.itemDetailForm.get('itemPackages') as FormArray;
    }

    /**
     * Converts form data into a Custom class of Item.
     */
    private convertItemFormData(): Item {
        let item: Item = new Item();

        item.itemID = this.itemDetailForm.value.itemID;
        item.dealerID = this.commonData.dealer.dealerID;
        item.itemName = this.itemDetailForm.value.itemName;
        item.itemDescription = this.itemDetailForm.value.itemDescription;
        item.category = this.itemDetailForm.value.category;
        item.manufacturer = this.itemDetailForm.value.manufacturer;
        item.itemImageThumURL = this.itemDetailForm.value.itemImageThumURL;
        item.itemImageURLs = this.itemDetailForm.value.itemImageURLs;
        item.canUploadFile = this.itemDetailForm.value.canUploadFile;
        item.stockMaintained = this.itemDetailForm.value.stockMaintained;
        item.isActive = this.itemDetailForm.value.isActive;

        return item;
    }

    /**
    * Converts form data into a Custom class of ItemPackage.
    */
    private convertItemPackageFormData(itemIndex: number): ItemPackage {
        let itemPackage: ItemPackage = new ItemPackage();

        itemPackage.itemPackageID = this.itemPackagesControlArray.value[itemIndex].itemPackageID;
        itemPackage.itemID = this.itemPackagesControlArray.value[itemIndex].itemID;
        itemPackage.dealerID = this.commonData.dealer.dealerID;
        itemPackage.itemPackageName = this.itemPackagesControlArray.value[itemIndex].itemPackageName;
        itemPackage.itemDescription = this.itemPackagesControlArray.value[itemIndex].itemDescription;
        itemPackage.packageSize = this.itemPackagesControlArray.value[itemIndex].packageSize;
        itemPackage.packageUnit = this.itemPackagesControlArray.value[itemIndex].packageUnit;
        itemPackage.category = this.itemDetailForm.controls.category.value;
        itemPackage.manufacturer = this.itemDetailForm.controls.manufacturer.value;
        itemPackage.itemImageThumURL = this.itemPackagesControlArray.value[itemIndex].itemImageThumURL;
        itemPackage.itemImageURLs = this.itemPackagesControlArray.value[itemIndex].itemImageURLs;
        itemPackage.canUploadFile = this.itemDetailForm.controls.canUploadFile.value;
        itemPackage.stockMaintained = this.itemDetailForm.controls.stockMaintained.value;
        itemPackage.isActive = this.itemPackagesControlArray.value[itemIndex].isActive;

        return itemPackage;
    }
}