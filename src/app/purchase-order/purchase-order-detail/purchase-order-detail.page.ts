import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Validators, FormGroup, FormControl, FormBuilder, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ModalController, NavParams } from '@ionic/angular';

import { Utilities } from '../../utils/utilities';
import { CommonService } from '../../shared/common.service';
import { PurchaseOrder, PurchaseOrderItems } from '../model/purchase-order';
import { ItemStockPrice } from '../../item/model/item';
import { ItemPurchaseListPage } from '../../item/item-purchase-list/item-purchase-list.page';

import { PurchaseOrderService } from '../../purchase-order/purchase-order.service';

@Component({
  templateUrl: 'purchase-order-detail.page.html',
})
export class PurchaseOrderDetailPage implements OnInit, OnDestroy {
  public isDataLoaded: boolean = false;
  public purchaseForm: FormGroup;
  public orderItemsFormControl: FormControl[];
  public totalQty: number = 0;
  public totalAmt: number = 0;
  public formMode: string;  // ModeForm, NEW/VIEW

  private _purchaseOrder: PurchaseOrder;
  private _purchaseOrderItems: PurchaseOrderItems;

  validations = {
    'orderNo': [
      { type: 'required', message: 'Purchase order no. is required.' },
      { type: 'minlength', message: 'Purchase order no. must be at least 3 characters long.' },
      { type: 'maxlength', message: 'Purchase order no. cannot be more than 20 characters long.' },
    ],
    'orderDate': [
      { type: 'required', message: 'Order date is required.' },
      { type: 'min', message: 'Order date should be before.' },
      { type: 'max', message: 'Order date should not be future date.' },
    ],
    'mrp': [
      { type: 'required', message: 'MRP is required.' },
      { type: 'min', message: 'MRP should be non zero.' },
      { type: 'max', message: 'MRP should not be more than 10000.' },
    ],
    'sellingPrice': [
      { type: 'required', message: 'Selling price is required.' },
      { type: 'min', message: 'Selling price should be non zero.' },
      { type: 'max', message: 'Selling price should not be more than 10000.' },
    ],
    'wholesalePrice': [
      { type: 'required', message: 'Wholesale price is required.' },
      { type: 'min', message: 'Wholesale price should be non zero.' },
      { type: 'max', message: 'Wholesale price should not be more than 10000.' },
    ],
    'stockQty': [
      { type: 'min', message: 'Quantity should be non zero.' },
      { type: 'max', message: 'Quantity should not be more than 10000.' },
    ],
    'orderItems': [
      { type: 'required', message: 'At least one item is required.' },
    ],
  };

  constructor(
    public commonData: CommonService,
    private _fb: FormBuilder,
    private _navParams: NavParams,
    private _purchaseOrderService: PurchaseOrderService,
    private _modalCtrl: ModalController,
    private _route: ActivatedRoute,
  ) { }

  public createOrderItems(itemData: ItemStockPrice): FormGroup {
    return this._fb.group({
      itemPackageID: new FormControl(itemData.itemPackageID),
      itemID: new FormControl(itemData.itemID),
      dealerID: new FormControl(itemData.dealerID),
      itemName: new FormControl(itemData.itemName),
      itemDescription: new FormControl(itemData.itemDescription),
      category: new FormControl(itemData.category),
      manufacturer: new FormControl(itemData.manufacturer),
      itemImageThumURL: new FormControl(itemData.itemImageThumURL),
      itemImageURLs: new FormControl(itemData.itemImageURLs),
      packageSize: new FormControl(itemData.packageSize),
      packageUnit: new FormControl(itemData.packageUnit),
      stockMaintained: new FormControl(itemData.stockMaintained),
      canUploadFile: new FormControl(itemData.canUploadFile),
      mrp: new FormControl(itemData.mrp, Validators.compose([
        Validators.min(1),
        Validators.max(10000),
        Validators.required
      ])),
      sellingPrice: new FormControl(itemData.sellingPrice, Validators.compose([
        Validators.min(1),
        Validators.max(10000),
        Validators.required
      ])),
      wholesalePrice: new FormControl(itemData.wholesalePrice),
      // if stock is not maintained then the stockQty will be disabled
      stockQty: new FormControl({ value: itemData.stockQty, disabled: !itemData.stockMaintained }, Validators.compose([
        Validators.min(1),
        Validators.max(10000),
      ])),
    });
  }

  async ngOnInit() {
    // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
    const modalState = {
      modal: true,
      componentName: 'PurchaseOrderDetailPage',
      desc: 'fake state for our modal'
    };
    history.pushState(modalState, null);

    this.purchaseForm = this._fb.group({
      orderNo: new FormControl('', Validators.compose([
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.required
      ])),
      orderDate: new FormControl(new Date().formatDateTime("yyyy-MM-dd"), Validators.compose([
        Validators.required,
      ])),
      totalQty: new FormControl(0),
      totalAmt: new FormControl(0),
      orderItems: this._fb.array([], Validators.compose([
        Validators.required,
      ]))
    });

    // register change events
    this.onChanges();

    // set flag that the data is loaded
    this.isDataLoaded = true;

    // get the purchaseOrder details
    this._purchaseOrder = this._navParams.get('purchaseOrder');
    await this.getFormData();
  }

  ngOnDestroy() {
    // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
    // ngDestroy() method
    if (window.history.state.modal) {
      history.back();
    }
  }

  async getFormData() {
    if (this._purchaseOrder) {
      // View Mode
      this.formMode = 'VIEW';
      // disable the form in VIEW mode
      this.purchaseForm.disable();
      await this.populateItemDetails();
    } else {
      // NEW Mode
      this.formMode = 'NEW';
    }
  }

  async populateItemDetails() {
    return this._purchaseOrderService.getPurchaseOrderDetail(this._purchaseOrder.orderID).valueChanges()
      .forEach(items => {
        // 1. populate form header part
        this.purchaseForm.patchValue({
          orderNo: this._purchaseOrder.orderNo, orderDate: this._purchaseOrder.orderDate.formatDateTime('yyyy-MM-dd'), totalQty: this._purchaseOrder.totalQty,
          totalAmt: this._purchaseOrder.totalAmt,
        }, { emitEvent: true });

        // 2. populate item detail part
        for (const item of items) {
          let itemStockPrice: ItemStockPrice;
          // convert from Object to ItemStockPrice
          itemStockPrice = Object.assign({}, item)
          this.orderItemsControlArray.push(this.createOrderItems(itemStockPrice));
          // disable form
          this.orderItemsControlArray.disable();
        }
      });
  }

  async onChanges(): Promise<void> {
    this.purchaseForm.get("orderItems").valueChanges.subscribe(value => {
      this.orderItemsChanges(value);
    });
  }

  async orderItemsChanges(value: any) {

    this.totalQty = 0, this.totalAmt = 0;
    if (value) {
      value.forEach(element => {
        // if stockMaintened then only add the qty and amt
        if (element.stockMaintained) {
          this.totalQty += element.stockQty;
          if (element.wholesalePrice && element.wholesalePrice) {
            this.totalAmt += element.wholesalePrice * element.stockQty;
          } else {
            this.totalAmt += element.sellingPrice * element.stockQty;
          }
        }
      });
    }
    this.purchaseForm.get("totalQty").patchValue(this.totalQty);
    this.purchaseForm.get("totalAmt").patchValue(this.totalAmt);
  }

  /**Removes the item from the list.*/
  async removeItemClicked(itemIndex: number) {
    if (this.formMode == 'NEW') {
      if (this.orderItemsControlArray.value && this.orderItemsControlArray.value.length > 0) {
        this.orderItemsControlArray.removeAt(itemIndex);
      }
    }
  }

  /**Show dialog box to select all required items.*/
  async addItemClicked() {
    // await this.createData();

    var orderItems = new Array<ItemStockPrice>();

    if (this.orderItemsControlArray.value && this.orderItemsControlArray.value.length > 0) {
      // clone the selection
      orderItems = new Array<ItemStockPrice>();
      this.orderItemsControlArray.value.forEach((item: any) => {
        orderItems.push(Object.assign({}, item));
      });
    }

    // show the items to user for selection
    const modal = await this._modalCtrl.create({
      component: ItemPurchaseListPage,
      keyboardClose: true,
      componentProps: { orderItems }
    });
    await modal.present();
    // Get returned data
    const { data } = await modal.onWillDismiss();

    // store user selected items
    if (data) {
      if (this.orderItemsControlArray.value && this.orderItemsControlArray.value.length > 0) {
        data.forEach(element => {
          const foundItem = this.orderItemsControlArray.value.find(i => i.itemPackageID == element.itemPackageID);
          if (foundItem) {
            // 1. user selected item exists in the local list, so update the required fields to the user selected list.
            element.stockQty = foundItem.stockQty;
            element.mrp = foundItem.mrp;
            element.sellingPrice = foundItem.sellingPrice;
            element.wholesalePrice = foundItem.wholesalePrice;
          }
        });
      }
      // Now copy user selected items to the form control
      // Clear form controls for orderItems
      this.orderItemsControlArray.clear();

      data.forEach((item: any) => {
        this.orderItemsControlArray.push(this.createOrderItems(item));
      });
    } else {
      // 3. user has deleted all the items, so clear the local copy
      this.orderItemsControlArray.clear();
    }
  }

  /**Gets array reference of orderItems.*/
  public get orderItemsControlArray() {
    return this.purchaseForm.get('orderItems') as FormArray;
  }

  async saveClicked() {
    try {
      if (this.purchaseForm.valid) {
        if (this.orderItemsControlArray.controls.length > 0) {
          await Utilities.showLoadingCtrl('Saving. Please wait...');

          this.convertFormData(this.purchaseForm.value);

          // save the order
          await this._purchaseOrderService.createPurchaseOrder(this._purchaseOrder, this._purchaseOrderItems);
          await Utilities.showAlert("Order placed successfully.", "Success");
          // clear items from the order
          this.orderItemsControlArray.clear();
          await Utilities.hideLoadingCtrl();
        } else {
          this.orderItemsControlArray.setErrors({ required: false });
          await Utilities.showAlert("Please select at least one item.", "Validations");
        }
      }
    } catch (error) {
      console.error(error);
      await Utilities.hideLoadingCtrl();
      await Utilities.showAlert("Some exceptions has occured while saving the order!", "Error");
    }
  }

  /**
   * Converts form data into a Custom class of PurchaseOrder and PurchaseOrderItems.
   * @param formData Form data.
   */
  private convertFormData(formData: any) {
    let orderItemData: ItemStockPrice;

    this._purchaseOrder = new PurchaseOrder();
    this._purchaseOrderItems = new PurchaseOrderItems();

    this._purchaseOrder.orderID = null;
    this._purchaseOrder.dealerID = this.commonData.dealer.dealerID;
    this._purchaseOrder.stockDate = null;
    this._purchaseOrder.orderNo = formData.orderNo;
    this._purchaseOrder.orderDate = formData.orderDate;
    this._purchaseOrder.totalAmt = formData.totalAmt;
    this._purchaseOrder.totalQty = formData.totalQty;

    // Store item details in purchaseOrderItems
    this._purchaseOrderItems.orderItems = new Array<ItemStockPrice>();
    this._purchaseOrderItems.orderID = null;
    formData.orderItems.forEach(element => {
      if (element) {
        orderItemData = new ItemStockPrice();
        orderItemData.itemStockPriceID = null;
        orderItemData.itemPackageID = element.itemPackageID;
        orderItemData.externalCode = null;
        orderItemData.externalCode1 = null;
        orderItemData.externalCode2 = null;
        orderItemData.itemName = element.itemName;
        orderItemData.itemDescription = element.itemDescription;
        orderItemData.stockDate = null;
        orderItemData.orderID = null;
        orderItemData.orderDate = formData.orderDate;
        orderItemData.orderNo = formData.orderNo;
        orderItemData.mrp = element.mrp;
        orderItemData.sellingPrice = element.sellingPrice;
        orderItemData.wholesalePrice = element.wholesalePrice;
        orderItemData.stockQty = element.stockQty || null;
        orderItemData.balanceQty = element.balanceQty;
        orderItemData.returnQty = null;
        orderItemData.itemID = element.itemID;
        orderItemData.dealerID = this.commonData.dealer.dealerID;
        orderItemData.category = element.category;
        orderItemData.manufacturer = element.manufacturer;
        orderItemData.itemImageThumURL = element.itemImageThumURL;
        orderItemData.itemImageURLs = element.itemImageURLs;
        orderItemData.packageSize = element.packageSize;
        orderItemData.packageUnit = element.packageUnit;
        orderItemData.canUploadFile = element.canUploadFile;
        orderItemData.stockMaintained = element.stockMaintained;
        orderItemData.isActive = true;

        this._purchaseOrderItems.orderItems.push(orderItemData);
      }
    });
  }

  // Dismiss the Pop-up when the back button is pressed
  @HostListener('window:popstate', ['$event'])
  gotoOrderList() {
    this._modalCtrl.dismiss()
  }
}
