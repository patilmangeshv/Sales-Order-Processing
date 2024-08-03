import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl, FormBuilder, FormArray, ValidatorFn, ValidationErrors } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';

import { AuthService } from '../auth/auth.module';
import { CommonService } from '../shared/common.service';
import { Utilities, LocalDataStorage } from '../utils/utilities';

import { SalesOrder, SalesOrderItems } from '../sales-order/model/sales-order';
import { SalesOrderService } from '../sales-order/sales-order.service';
import { CustomerService } from '../customer/customer.service';

import { CustomerDetails } from '../customer/model/customerDetails';

import { ItemStockPrice, OrderItemData, OrderItem } from '../item/model/item';
import { ItemsService } from '../item/item.service';
import { ItemOrderListPage } from '../item/item.module';
import { CustomerSelectionListPage } from '../customer/customer.module';

import { Dealer, TrackStaticDataCache } from '../dealer/model/dealer';
import { DealerService } from '../dealer/dealer.service';
import { FCMessagingService } from '../shared/fcMessaging.service';

export const qtyExceedsBalQtyValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const quantity = control.get('quantity');
  const balanceQty = control.get('balanceQty');
  const stockMaintained = control.get('stockMaintained');

  return stockMaintained && quantity && balanceQty && quantity.value > balanceQty.value ? { 'qtyExceedsBalQtyValidator': true } : null;
};

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['./styles/forms-validations.page.scss'],
})
export class HomePage implements OnInit {
  public isDataLoaded: boolean = false;
  public validationsForm: FormGroup;
  public orderItemsFormControl: FormControl[];
  public totalQty: number = 0;
  public totalAmt: number = 0;

  private _salesOrder: SalesOrder;
  private _salesOrderItems: SalesOrderItems;

  private _favoriteItemStockPriceReferences: string[];
  public _isRetailCustomer: boolean;

  validations = {
    'orderDate': [
      { type: 'required', message: 'Order date is required.' }
    ],
    'customerName': [
      { type: 'required', message: 'Customer name is required.' },
      { type: 'minlength', message: 'Customer name must be at least 10 characters long.' },
      { type: 'maxlength', message: 'Customer name cannot be more than 50 characters long.' },
      // { type: 'pattern', message: 'Your name must contain only numbers and letters.' },
    ],
    'mobileNo': [
      { type: 'required', message: 'Mobile number is required.' },
      { type: 'min', message: 'Mobile number must be 10 characters long without country code.' },
      { type: 'max', message: 'Mobile number must be 10 characters long without country code.' },
    ],
    'pincode': [
      { type: 'required', message: 'Pincode is required.' },
      { type: 'min', message: 'Pincode must be 6 characters long.' },
      { type: 'max', message: 'Pincode must be 6 characters long.' },
    ],
    'deliveryAddress': [
      { type: 'required', message: 'Delivery address is required.' },
      { type: 'minlength', message: 'Delivery address must be minimum 10 characters long.' },
      { type: 'maxlength', message: 'Delivery address must be within 100 characters.' },
    ],
    'lastname': [
      { type: 'required', message: 'Last name is required.' }
    ],
    'email': [
      // { type: 'required', message: 'Email is required.' },
      { type: 'email', message: 'Enter a valid email.' }
    ],
    'orderItems': [
      { type: 'required', message: 'At least one item is required.' },
    ],
    'quantity': [
      { type: 'required', message: 'Quantity is required.' },
      { type: 'min', message: 'Quantity should be between 1 and 100.' },
      { type: 'max', message: 'Quantity should be between 1 and 100.' },
    ],
  };

  constructor(
    public commonData: CommonService,
    private _authService: AuthService,
    private _fb: FormBuilder,
    private _itemService: ItemsService,
    private _customerService: CustomerService,
    private _dealerService: DealerService,
    private _salesOrderService: SalesOrderService,
    private _modalCtrl: ModalController,
    private _route: ActivatedRoute,
    private _fcm: FCMessagingService,
  ) { }

  public createOrderItems(itemData: OrderItem): FormGroup {
    return this._fb.group({
      item: new FormControl(itemData.item),
      balanceQty: new FormControl(itemData.item.balanceQty),
      quantity: new FormControl(itemData.quantity, Validators.compose([
        Validators.min(1),
        Validators.max(100),
        Validators.pattern('^(?=.*[0-9])[0-9]+$'),
        Validators.required
      ])),
      // amount: [itemData.amount, [Validators.required]],
      orderItemFile: new FormControl(itemData.orderItemFile),
    }, { validators: qtyExceedsBalQtyValidator });
  }

  async ngOnInit() {
    let customerDetails: CustomerDetails;
    // get saved customer details from device if present else set blank
    if (this.commonData.dealer && !this.commonData.dealer.hasExternalSystem) {
      customerDetails = await LocalDataStorage.getObject("customerDetails");
    }

    if (!customerDetails) customerDetails = new CustomerDetails();

    this.validationsForm = this._fb.group({
      customerName: new FormControl(customerDetails.customerName, Validators.compose([
        Validators.maxLength(50),
        Validators.minLength(10),
        // Validators.pattern('^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$'),
        Validators.required
      ])),
      mobileNo: new FormControl(customerDetails.mobileNo, Validators.compose([
        Validators.max(9999999999),
        Validators.min(1000000000),
        Validators.required
      ])),
      customerID: new FormControl(customerDetails.customerID),
      externalCode: new FormControl(customerDetails.externalCode),
      deliveryAddress: new FormControl(customerDetails.deliveryAddress, Validators.compose([
        Validators.maxLength(100),
        Validators.minLength(10),
        Validators.required
      ])),
      email: new FormControl(customerDetails.email, Validators.compose([
        // Validators.required,
        Validators.email
      ])),
      pincode: new FormControl(customerDetails.pincode, Validators.compose([
        Validators.max(999999),
        Validators.min(100000),
        Validators.required
      ])),

      orderDate: new FormControl(new Date().formatDateTime("yyyy-MM-dd"), Validators.compose([Validators.required])),
      gstNo: new FormControl(null),
      isRetailer: new FormControl(null),
      gstate_cd: new FormControl(null),
      gst_regstr: new FormControl(null),
      foodLicenseNo: new FormControl(null),
      areaCode: new FormControl(null),
      narration: new FormControl(null),
      totalQty: new FormControl(0),
      totalAmt: new FormControl(0),
      orderItems: this._fb.array([])
      // orderItems: this._fb.array([this.createOrderItems(new OrderItem())])
    });

    // register change events
    this.onChanges();

    // get the dealer details
    let dealerCode = this._route.snapshot.paramMap.get('dealerCode');

    if (dealerCode) {
      // 1. New dealer specified so fetch the details from the database
      this.commonData.dealer = null;
    } else {
      // 2. dealer code not specified in the URL, so check if it is stored locally on the device.
      // await LocalDataStorage.getObject("dealerCode")
      //   .then(value => {
      //     if (value) {
      //       // 3. locally stored dealer found so use the same.
      //       dealerCode = value;
      //     } else {
      //       // 4. locally stored dealer not found so use demo as a dealer.
      //       dealerCode = "demo";
      //     }
      //     // check if dealer object already fetched and it is the same
      //     if (!(this.commonData.dealer && this.commonData.dealer.dealerCode == dealerCode)) {
      //       this.commonData.dealer = null;
      //     }
      // });
      let value = await LocalDataStorage.getObject("dealerCode");
      if (value) {
        // 3. locally stored dealer found so use the same.
        dealerCode = value;
      } else {
        // 4. locally stored dealer not found so use demo as a dealer.
        dealerCode = "demo";
      }
      // check if dealer object is already fetched and it is the same
      if (!(this.commonData.dealer && this.commonData.dealer.dealerCode == dealerCode)) {
        this.commonData.dealer = null;
      }
    }

    // 4. dealer information does not exists so fetch it from the database.
    if (!this.commonData.dealer) {
      this._dealerService.getDealerDetails(dealerCode).valueChanges()
        .forEach(async dealers => {
          // set flag that the data is loaded
          this.isDataLoaded = true;

          for (const dealer of dealers) {
            this.commonData.dealer = dealer;
            this.enable_disableControls();

            await LocalDataStorage.setObject("dealerCode", dealerCode);
            TrackStaticDataCache.initialize();
            this._dealerService.trackVersionOfStaticData(this.commonData.dealer.dealerID);
          }
        });
    } else {
      // set flag that the data is loaded
      this.isDataLoaded = true;
    }

    this.enable_disableControls();
    // Below commented code has required logic to populate the dealer code with various cases.

    // if (dealerCode) {
    //     // 1. New dealer specified so fetch the details from the database
    //     await this.commonData.setDealer(new Dealer());
    // } else {
    //     // 2. dealer code not specified in the URL, so check if it is stored locally on the device.
    //     dealerCode = await this.commonData.getDealerCodeFromStorage();
    //     if (!dealerCode || dealerCode == "") {
    //         // 3. dealer code locally not stored so use demo as a dealer.
    //         dealerCode = "demo";
    //     }
    // }
    // console.log(dealerCode);
  }

  /**Enable/Disable customer detail controls based on hasExternalSystem flag of the dealer.*/
  private enable_disableControls() {
    if (this.commonData.dealer && this.commonData.dealer.hasExternalSystem) {
      this.validationsForm.controls.customerName.disable();
      this.validationsForm.controls.mobileNo.disable();
      this.validationsForm.controls.deliveryAddress.disable();
      this.validationsForm.controls.email.disable();
      this.validationsForm.controls.pincode.disable();
      this.validationsForm.controls.gstNo.disable();
      this.validationsForm.controls.isRetailer.disable();
      this.validationsForm.controls.gstate_cd.disable();
      this.validationsForm.controls.gst_regstr.disable();
      this.validationsForm.controls.foodLicenseNo.disable();
    } else {
      this.validationsForm.controls.customerName.enable();
      this.validationsForm.controls.mobileNo.enable();
      this.validationsForm.controls.deliveryAddress.enable();
      this.validationsForm.controls.email.enable();
      this.validationsForm.controls.pincode.enable();
      this.validationsForm.controls.gstNo.enable();
      this.validationsForm.controls.isRetailer.disable();
      this.validationsForm.controls.gstate_cd.enable();
      this.validationsForm.controls.gst_regstr.enable();
      this.validationsForm.controls.foodLicenseNo.enable();
    }
  }

  async onChanges(): Promise<void> {
    this._fcm.currentMessage.subscribe(payload => {
      // console.log(payload);
    });

    this.validationsForm.get("orderItems").valueChanges.subscribe(value => {
      this.orderItemsChanges(value);
    });
  }

  async orderItemsChanges(value: any) {
    this.totalQty = 0, this.totalAmt = 0;
    if (value) {
      value.forEach(element => {
        this.totalQty += element.quantity;
        if (this.validationsForm.controls.isRetailer.value) {
          this.totalAmt += element.item.sellingPrice * element.quantity;
        } else {
          if (element.item.wholesalePriceWithGST && element.item.wholesalePriceWithGST > 0) {
            this.totalAmt += element.item.wholesalePriceWithGST * element.quantity;
          } else {
            // this.totalAmt += element.item.sellingPrice * element.quantity;
            this.totalAmt += element.item.wholesalePrice * element.quantity;
          }
        }
      });
    }
    this.validationsForm.get("totalQty").patchValue(this.totalQty);
    this.validationsForm.get("totalAmt").patchValue(this.totalAmt);
  }

  /**Removes the item from the list.*/
  async removeItemClicked(itemIndex: number) {
    if (this.orderItemsControlArray.value && this.orderItemsControlArray.value.length > 0) {
      this.orderItemsControlArray.removeAt(itemIndex);
    }
  }

  /**Show dialog box to select customer.*/
  async showCustomerListClicked() {
    // show the customer list for the selection
    const modal = await this._modalCtrl.create({
      component: CustomerSelectionListPage,
      keyboardClose: true,
      // componentProps: { orderItems }
    });
    await modal.present();
    // Get returned data
    const { data } = await modal.onWillDismiss();

    // store user selected customer
    if (data) {
      let customer: CustomerDetails = Object.assign({}, data);

      // customer changed, clear all items to consider isRetailCustomer prices
      this.orderItemsControlArray.clear();

      // reset customer item favorite references on selection of customer
      await this._customerService.getFavoriteItemStockPriceReferences(customer)
        .then(value => {
          this._favoriteItemStockPriceReferences = value;
          this._isRetailCustomer = customer.isRetailer;

          this.validationsForm.patchValue({
            customerID: customer.customerID, externalCode: customer.externalCode, customerName: customer.customerName, mobileNo: customer.mobileNo
            , deliveryAddress: customer.deliveryAddress, email: customer.email, pincode: customer.pincode
            , gstNo: customer.gstNo, isRetailer: customer.isRetailer, gstate_cd: customer.gstate_cd || '', gst_regstr: customer.gst_regstr || '', foodLicenseNo: customer.foodLicenseNo, areaCode: customer.areaCode
          }, { emitEvent: true });
        });
    }
  }

  /**Show dialog box to select all required items.*/
  async addItemClicked() {
    var orderItems = Array<OrderItem>();
    var favoriteItemStockPriceReferences = this._favoriteItemStockPriceReferences;
    var isRetailCustomer = this._isRetailCustomer;

    if (this.orderItemsControlArray.value && this.orderItemsControlArray.value.length > 0) {
      // clone the selection
      orderItems = new Array<OrderItem>();
      this.orderItemsControlArray.value.forEach((item: any) => {
        orderItems.push(Object.assign({}, item));
      });
    }

    // show the items to user for selection
    const modal = await this._modalCtrl.create({
      component: ItemOrderListPage,
      keyboardClose: true,
      componentProps: { orderItems, favoriteItemStockPriceReferences, isRetailCustomer }
    });
    await modal.present();
    // Get returned data
    const { data } = await modal.onWillDismiss();

    // store user selected items
    if (data) {
      if (this.orderItemsControlArray.value && this.orderItemsControlArray.value.length > 0) {
        data.forEach(element => {
          const foundItem = this.orderItemsControlArray.value.find(i => i.item.itemStockPriceID == element.itemStockPriceID);
          if (foundItem) {
            // 1. user selected item exists in the local list, so update the required fields to the user selected list.
            element.item = foundItem.item;
            // element.quantity = foundItem.quantity;
            element.quantity = element.quantity;
            element.orderItemFile = foundItem.orderItemFile;
          }
        });
      }
      // Now copy user selected items to the form control
      // Clear form controls for orderItems
      this.orderItemsControlArray.clear();

      data.forEach((item: any) => {
        // search if the item is from favorite, then mark it as favorite
        if (this._favoriteItemStockPriceReferences) {
          var foundItemRef = this._favoriteItemStockPriceReferences.find(fav => fav == item.item.externalCode);
          if (foundItemRef) item.item.isFavorite = true;
        }

        this.orderItemsControlArray.push(this.createOrderItems(item));
      });
    } else {
      // 3. user has deleted all the items, so clear the local copy
      this.orderItemsControlArray.clear();
    }
  }


  itemFavoriteFlag(item: ItemStockPrice) {
    if (this._favoriteItemStockPriceReferences) {
      item.isFavorite = !item.isFavorite;
      var foundIndex = this._favoriteItemStockPriceReferences.findIndex(itemReference => (item.externalCode == itemReference))

      if (item.isFavorite) {
        if (foundIndex == -1) {
          // item does not exists in favorite array, so add it.
          this._favoriteItemStockPriceReferences.push(item.externalCode);
        }
      } else {
        if (foundIndex != -1) {
          // item exists in favorite array, so delete it.
          this._favoriteItemStockPriceReferences.splice(foundIndex, 1);
        }
      }
    }
  }

  /**Gets array reference of orderItems.*/
  public get orderItemsControlArray() {
    return this.validationsForm.get('orderItems') as FormArray;
  }

  async onSubmit(values: any) {
    try {
      if (this.orderItemsControlArray.controls.length > 0) {
        await Utilities.showLoadingCtrl('Saving. Please wait...');
        // temporary provision of user need not to login to system for placing order if user is not already logined in.
        if (!this._authService.loggedInFirebaseUser) {
          await this._authService.guestLogin();
        }

        this.convertFormData(values);

        // save entered customer details to device
        if (this.commonData.dealer && !this.commonData.dealer.hasExternalSystem) {
          await LocalDataStorage.setObject("customerDetails", this._salesOrder.customerDetails);
          await LocalDataStorage.setObject("favoriteItemStockPriceReferences", this._favoriteItemStockPriceReferences);
        }

        // save the order
        await this._salesOrderService.createSalesOrder(this._salesOrder, this._salesOrderItems, this._favoriteItemStockPriceReferences);
        await Utilities.showAlert("Order placed successfully.", "Success");
        // clear items from the order
        this.orderItemsControlArray.clear();
        await Utilities.hideLoadingCtrl();
      } else {
        this.orderItemsControlArray.setErrors({ required: false });
        await Utilities.showAlert("Please select at least one item.", "Validations");
      }
    } catch (error) {
      console.error(error);
      await Utilities.hideLoadingCtrl();
      await Utilities.showAlert("Some exceptions has occured while saving the order!", "Error");
    }
  }

  /**
   * Converts form data into a Custom class of SalesOrder.
   * @param formData Form data.
   */
  private convertFormData(formData: any) {
    let orderItemData: OrderItemData;

    this._salesOrder = new SalesOrder();
    this._salesOrderItems = new SalesOrderItems();

    this._salesOrder.salesOrderID = "";
    this._salesOrder.salesOrderNo = "";
    this._salesOrder.dealerID = this.commonData.dealer.dealerID;
    this._salesOrder.orderDate = new Date(this.validationsForm.controls.orderDate.value);
    this._salesOrder.totalAmt = this.validationsForm.controls.totalAmt.value;
    this._salesOrder.totalQty = this.validationsForm.controls.totalQty.value;

    this._salesOrder.customerDetails = new CustomerDetails();
    this._salesOrder.customerDetails.customerID = this.validationsForm.controls.customerID.value;
    this._salesOrder.customerDetails.externalCode = this.validationsForm.controls.externalCode.value;
    this._salesOrder.customerDetails.customerName = this.validationsForm.controls.customerName.value;
    this._salesOrder.customerDetails.mobileNo = this.validationsForm.controls.mobileNo.value;
    this._salesOrder.customerDetails.pincode = this.validationsForm.controls.pincode.value;
    this._salesOrder.customerDetails.deliveryAddress = this.validationsForm.controls.deliveryAddress.value;
    this._salesOrder.customerDetails.email = this.validationsForm.controls.email.value;
    this._salesOrder.customerDetails.gstNo = this.validationsForm.controls.gstNo.value;
    this._salesOrder.customerDetails.isRetailer = this.validationsForm.controls.isRetailer.value;
    this._salesOrder.customerDetails.gstate_cd = this.validationsForm.controls.gstate_cd.value;
    this._salesOrder.customerDetails.gst_regstr = this.validationsForm.controls.gst_regstr.value;
    this._salesOrder.customerDetails.foodLicenseNo = this.validationsForm.controls.foodLicenseNo.value;
    this._salesOrder.customerDetails.areaCode = this.validationsForm.controls.areaCode.value;
    this._salesOrder.narration = this.validationsForm.controls.narration.value;

    // Store item details in salesOrderItems
    this._salesOrderItems.orderItems = new Array<OrderItemData>();
    this._salesOrderItems.salesOrderID = "";
    this.validationsForm.controls.orderItems.value.forEach(element => {
      if (element) {
        orderItemData = new OrderItemData();
        orderItemData.itemStockPriceID = element.item.itemStockPriceID;
        orderItemData.itemName = element.item.itemName;
        orderItemData.externalCode = element.item.externalCode;
        orderItemData.externalCode1 = element.item.externalCode1;
        orderItemData.externalCode2 = element.item.externalCode2;
        orderItemData.itemDescription = element.item.itemDescription;
        orderItemData.itemImageThumURL = element.item.itemImageThumURL;
        orderItemData.sellingPrice = element.item.sellingPrice;
        orderItemData.wholesalePrice = element.item.wholesalePrice;
        orderItemData.wholesalePriceWithGST = (element.item.wholesalePriceWithGST ? element.item.wholesalePriceWithGST : 0.0000);
        orderItemData.gst_pc = (element.item.gst_pc ? element.item.gst_pc : 0.00);
        orderItemData.gcess_pc = (element.item.gcess_pc ? element.item.gcess_pc : 0.00);
        orderItemData.free_qty = element.item.free_qty | 0;
        orderItemData.off_onmrp = (element.item.off_onmrp ? element.item.off_onmrp : 0.00);
        orderItemData.hsn_cd = (element.item.hsn_cd ? element.item.hsn_cd : "");
        orderItemData.stk_marg = (element.item.stk_marg ? element.item.stk_marg : 0.00);
        orderItemData.mrp = element.item.mrp;
        orderItemData.quantity = element.quantity;
        orderItemData.packageSize = element.item.packageSize;
        orderItemData.packageUnit = element.item.packageUnit;
        orderItemData.stockMaintained = element.item.stockMaintained;
        orderItemData.canUploadFile = element.item.canUploadFile;
        orderItemData.orderItemFile = element.orderItemFile;

        this._salesOrderItems.orderItems.push(orderItemData);
      }
    });
  }
}