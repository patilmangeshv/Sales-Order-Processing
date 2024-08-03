import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { ModalController, NavParams } from '@ionic/angular';

import { CommonService } from '../../shared/common.service';
import { Utilities, ValidationError } from '../../utils/utilities';

import { Item, Category, Manufacturer, ItemPackage } from '../model/item';
import { ItemsService } from '../item.service';

@Component({
    templateUrl: './item-package-detail-edit.page.html',
    styleUrls: ['./styles/forms-validations.page.scss'],
})
export class ItemPackageDetailEditPage implements OnInit, OnDestroy {
    public isDataLoaded: boolean = false;
    public itemDetailForm: FormGroup;
    public packageUnits: any[];

    private _item: Item;
    public formMode: string;  // ModeForm, NEW/MODIFY

    /**Holds package name to display in the form title. */
    public _itemPackageName: string;

    /**
     * File open dialog control to allow user to select a document file and get the file name and its contents.
     */
    @ViewChild('fileSelector') private fileSelector: ElementRef;
    @ViewChild('itemImageThum') private itemImageThum: ElementRef;

    //Holds the current selected file in binary format and it will be use to save the data in DocumentAttach.
    private _itemImageThumFile: File;

    validations = {
        'itemPackageName': [
            { type: 'required', message: 'Item name is required.' },
            { type: 'minlength', message: 'Item name must be at least 5 characters long.' },
            { type: 'maxlength', message: 'Item name cannot be more than 50 characters long.' },
        ],
        'itemDescription': [
            { type: 'required', message: 'Item description is required.' },
            { type: 'minlength', message: 'Item description must be at least 5 characters long.' },
            { type: 'maxlength', message: 'Item description cannot be more than 500 characters long.' },
        ],
        'packageSize': [
            { type: 'required', message: 'Size is required.' },
            { type: 'min', message: 'Size should be between 0.1 and 10000.' },
            { type: 'max', message: 'Size should be between 0.1 and 10000.' },
            { type: 'pattern', message: 'Only numbers are allowed.' },
        ],
        'packageUnit': [
            { type: 'required', message: 'Unit is required.' },
        ],
        'isActive': [
            { type: 'required', message: 'Active flag is required.' },
        ],
    };

    constructor(
        public commonData: CommonService,
        private _fb: FormBuilder,
        private _itemService: ItemsService,
        private _navParams: NavParams,
        private _modalCtrl: ModalController,
    ) { }

    async getFormData(itemPackageID: string) {
        if (itemPackageID) {
            // Edit Mode
            this.formMode = 'MODIFY';
            await this.populateItemDetails(itemPackageID);
        } else {
            // NEW Mode
            this.formMode = 'NEW';
        }
    }

    async populateItemDetails(itemPackageID: string) {
        await this._itemService.getItemPackageDetail(itemPackageID).valueChanges()
            .forEach(item => {
                for (const oneItem of item) {
                    this.itemDetailForm.patchValue({
                        itemPackageID: oneItem.itemPackageID, itemID: oneItem.itemID, itemPackageName: oneItem.itemPackageName,
                        itemDescription: oneItem.itemDescription, packageSize: oneItem.packageSize, packageUnit: oneItem.packageUnit,
                        category: oneItem.category, manufacturer: oneItem.manufacturer, itemImageThumURL: oneItem.itemImageThumURL,
                        itemImageURLs: oneItem.itemImageURLs, canUploadFile: oneItem.canUploadFile,
                        stockMaintained: oneItem.stockMaintained, isActive: oneItem.isActive,
                    }, { emitEvent: true });

                    if (oneItem.itemImageThumURL) {
                        this.itemImageThum.nativeElement.src = oneItem.itemImageThumURL;
                    } else {
                        this.itemImageThum.nativeElement.src = "../../../assets//icon//camera.png";
                    }
                    this._itemPackageName = oneItem.itemPackageName;
                }
            });
    }

    async ngOnInit() {
        // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
        const modalState = {
            modal: true,
            desc: 'fake state for our modal'
        };
        history.pushState(modalState, null);

        // get the item and itemPackageID
        this._item = this._navParams.get('item');
        let itemPackageID = this._navParams.get('itemPackageID');

        // Array for package units from item service
        this.packageUnits = this._itemService.PackageUnits;

        this.itemDetailForm = this._fb.group({
            itemPackageID: new FormControl(null),
            itemID: new FormControl(null),
            itemPackageName: new FormControl(this._item.itemName, Validators.compose([
                Validators.minLength(5),
                Validators.maxLength(50),
                Validators.required
            ])),
            itemDescription: new FormControl(this._item.itemDescription, Validators.compose([
                // Validators.minLength(5),
                Validators.maxLength(500),
                // Validators.required
            ])),
            packageSize: new FormControl(null, Validators.compose([
                Validators.min(0.1),
                Validators.max(10000),
                Validators.required,
                Validators.pattern('^[0-9_.]+$'),
            ])),
            packageUnit: new FormControl(null, [Validators.required]),
            itemImageThumURL: new FormControl(this._item.itemImageThumURL),
            itemImageURLs: new FormControl(this._item.itemImageURLs),
            isActive: new FormControl(this._item.isActive, [Validators.required]),
        });

        this.isDataLoaded = true;
        await this.getFormData(itemPackageID);
    }

    ngOnDestroy() {
        // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
        // ngDestroy() method
        if (window.history.state.modal) {
            history.back();
        }
    }

    public async saveClicked() {
        try {
            if (this.itemDetailForm.valid) {
                await Utilities.showLoadingCtrl('Saving. Please wait...');

                let itemPackage = this.convertItemPackageFormData();
                // save item
                if (this.formMode == 'NEW') {
                    await this._itemService.createItemPackage(itemPackage, this._item, this._itemImageThumFile, null);
                } else {
                    await this._itemService.modifyItemPackage(itemPackage, this._item, this._itemImageThumFile, null);
                }

                this.goToItemList();

                await Utilities.hideLoadingCtrl();
                await Utilities.presentToast("Item package saved successfully.", "Success");
            }
        } catch (error) {
            await Utilities.hideLoadingCtrl();
            if (error instanceof ValidationError) {
                await Utilities.showAlert(error.message, "Validation");
            } else {
                await Utilities.showAlert("Some exceptions has occured while saving the item!", "Error");
            }
        }
    }

    public async deleteClicked() {
        try {
            if (this.itemDetailForm.valid) {
                await Utilities.showLoadingCtrl('Deleting. Please wait...');

                let itemPackage = this.convertItemPackageFormData();
                // delete item package
                await this._itemService.deleteItemPackage(itemPackage.itemPackageID, this._item);

                this.goToItemList();

                await Utilities.hideLoadingCtrl();
                await Utilities.presentToast("Item package deleted successfully.", "Success");
            }
        } catch (error) {
            console.error(error);
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert("Some exceptions has occured while deleting the item package!", "Error");
        }
    }

    /**
     * Converts form data into a Custom class of ItemPackage.
     */
    private convertItemPackageFormData(): ItemPackage {
        let itemPackage: ItemPackage = new ItemPackage();

        itemPackage.itemPackageID = this.itemDetailForm.value.itemPackageID;
        itemPackage.itemID = this._item.itemID;
        itemPackage.dealerID = this.commonData.dealer.dealerID;
        itemPackage.packageSize = this.itemDetailForm.value.packageSize;
        itemPackage.packageUnit = this.itemDetailForm.value.packageUnit;
        itemPackage.itemPackageName = this.itemDetailForm.value.itemPackageName;
        itemPackage.itemDescription = this.itemDetailForm.value.itemDescription;

        itemPackage.itemImageThumURL = this.itemDetailForm.value.itemImageThumURL;
        itemPackage.itemImageURLs = this.itemDetailForm.value.itemImageURLs;

        itemPackage.category = this._item.category;
        itemPackage.manufacturer = this._item.manufacturer;
        itemPackage.canUploadFile = this._item.canUploadFile;
        itemPackage.stockMaintained = this._item.stockMaintained;

        itemPackage.isActive = this.itemDetailForm.value.isActive;

        return itemPackage;
    }

    public packageSizeUnitChanged() {
        // ISSUE: Whenever a existing record gets oppened this event gets fired and it changes the package item name
        // Before uncommenting we need to resolve this change.
        // let newItemName = this._item.itemName;
        // if (this.itemDetailForm.value.packageSize && this.itemDetailForm.value.packageUnit) {
        //     newItemName += " " + this.itemDetailForm.value.packageSize + " " + this.itemDetailForm.value.packageUnit;
        // }
        // this.itemDetailForm.patchValue({ itemPackageName: newItemName });
    }

    itemPackageNameChanged() {
        this._itemPackageName = this.itemDetailForm.value.itemPackageName;
    }

    // Dismiss the Pop-up when the back button is pressed
    @HostListener('window:popstate', ['$event'])
    goToItemList() {
        this._modalCtrl.dismiss();
    }

    // File handling
    fileSelectClicked() {
        this.fileSelector.nativeElement.click();
    }

    fileRemoveClicked() {
        // remove attached file
        this.itemDetailForm.patchValue({ itemImageThumURL: null });
        this.itemImageThum.nativeElement.src = "../../../assets//icon//camera.png";
        this._itemImageThumFile = null;
    }

    /**
    * Event handler to allow user to select the file to upload.
    * @param event 
    */
    public async fileChangeListener(event: any) {
        try {
            // var fileReader = new FileReader();

            // Check if any file selected
            if (event.target.files.length >= 1) {
                const stxtFileName = event.target.files[0].name;

                // 1. Validate file
                // The File object
                const file = event.target.files[0];

                // 1.1 Validation for Images Only
                if (file.type.split('/')[0] !== 'image') {
                    await Utilities.showAlert("Invalid file. Please select image file only!", "Validation");

                    return;
                } else if (file.size > 1000000) {
                    // 1.2 file should not be more than 1 MB
                    await Utilities.showAlert("Please select image file with size less than 1 MB. The current size is - " + (file.size / 1024 / 1024).toFixed(4) + ' MB.', "Validation");

                    return;
                }

                // set image locally
                this.itemImageThum.nativeElement.src = URL.createObjectURL(file);
                this._itemImageThumFile = file;

            } else {
                this.itemImageThum.nativeElement.src = null;
                this._itemImageThumFile = null;
            }
        } catch (error) {
            console.error(error);
            this.itemImageThum.nativeElement.src = null;
            this._itemImageThumFile = null;
            // this.errHandlerSvc.publishError(new ApplicationError(error, error.message, this.myComponentName + "fileChangeListener", 'custody-document'));
        }
    }

}