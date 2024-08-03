import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators, FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { ModalController, NavParams } from '@ionic/angular';

import { CommonService } from '../../shared/common.service';
import { Utilities } from '../../utils/utilities';

import { Item, Category, Manufacturer, ItemPackage } from '../../item/model/item';
import { ItemsService } from '../../item/item.service';

@Component({
    templateUrl: './item-detail-edit.page.html',
    styleUrls: ['./styles/forms-validations.page.scss'],
})
export class ItemDetailEditPage implements OnInit, OnDestroy {
    public isDataLoaded: boolean = false;
    public itemDetailForm: FormGroup;

    public categories: Category[];
    public manufacturers: Manufacturer[];

    public formMode: string;  // ModeForm, NEW/MODIFY

    /**
     * File open dialog control to allow user to select a document file and get the file name and its contents.
     */
    @ViewChild('fileSelector') private fileSelector: ElementRef;
    @ViewChild('itemImageThum') private itemImageThum: ElementRef;

    //Holds the current selected file in binary format and it will be use to save the data in DocumentAttach.
    private _itemImageThumFile: File;

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
    };

    constructor(
        public commonData: CommonService,
        private _fb: FormBuilder,
        private _itemService: ItemsService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _navParams: NavParams,
        private _modalCtrl: ModalController,
    ) { }

    async getFormData(itemID: string) {
        if (itemID) {
            // Edit Mode
            this.formMode = 'MODIFY';
            await this.populateItemDetails(itemID);
        } else {
            // NEW Mode
            this.formMode = 'NEW';
        }
    }

    async populateItemDetails(itemID: string) {
        await this._itemService.getItemDetail(itemID).valueChanges()
            .forEach(item => {
                for (const oneItem of item) {
                    this.itemDetailForm.patchValue({
                        itemID: oneItem.itemID, itemName: oneItem.itemName,
                        itemDescription: oneItem.itemDescription, category: oneItem.category,
                        manufacturer: oneItem.manufacturer, itemImageThumURL: oneItem.itemImageThumURL,
                        itemImageURLs: oneItem.itemImageURLs, canUploadFile: oneItem.canUploadFile,
                        stockMaintained: oneItem.stockMaintained, isActive: oneItem.isActive,
                        itemPackages: oneItem.itemPackages,
                    }, { emitEvent: true });

                    if (oneItem.itemImageThumURL) {
                        this.itemImageThum.nativeElement.src = oneItem.itemImageThumURL;
                    } else {
                        this.itemImageThum.nativeElement.src = "../../../assets//icon//camera.png";
                    }
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
                // Validators.minLength(5),
                // Validators.required
            ])),
            category: new FormControl('', Validators.compose([
                // Validators.required
            ])),
            manufacturer: new FormControl('', Validators.compose([
                Validators.required
            ])),
            itemImageThumURL: new FormControl(null),
            itemImageURLs: new FormControl(null),
            canUploadFile: new FormControl(false),
            stockMaintained: new FormControl(true),
            isActive: new FormControl(true),
            itemPackages: new FormControl(null),
        });

        await this.populateOptions();
        this.isDataLoaded = true;

        // get the itemID
        let itemID = this._navParams.get('itemID');
        await this.getFormData(itemID);
    }

    ngOnDestroy() {
        // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
        // ngDestroy() method
        if (window.history.state.modal) {
            history.back();
        }
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

    public async saveClicked() {
        try {
            if (this.itemDetailForm.valid) {
                await Utilities.showLoadingCtrl('Saving. Please wait...');

                let item = this.convertItemFormData();
                // save item
                if (this.formMode == 'NEW') {
                    await this._itemService.createItem(item, this._itemImageThumFile, null);
                } else {
                    await this._itemService.modifyItem(item, this._itemImageThumFile, null);
                }

                this.goToItemList();

                await Utilities.hideLoadingCtrl();
                await Utilities.presentToast("Item saved successfully.", "Success");
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

                this.goToItemList();

                await Utilities.hideLoadingCtrl();
                await Utilities.presentToast("Item deleted successfully.", "Success");
            }
        } catch (error) {
            console.error(error);
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert("Some exceptions has occured while deleting the item!", "Error");
        }
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
        item.itemPackages = this.itemDetailForm.value.itemPackages;

        return item;
    }

    // Dismiss the Pop-up when the back button is pressed
    @HostListener('window:popstate', ['$event'])
    goToItemList() {
        this._modalCtrl.dismiss()
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
                } else if (file.size > 800000) {
                    // 1.2 file should not be more than 800 KB
                    await Utilities.showAlert("Please select image file with size less than 800 KB. The current size is - " + (file.size / 1024).toFixed(4) + ' KB.', "Validation");

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