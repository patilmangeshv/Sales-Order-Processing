import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { Utilities } from '../../utils/utilities';
import { CommonService } from '../../shared/common.service';
import { AuthService } from '../../auth/auth.module';
import { CustomerDetails } from '../../customer/model/customerDetails';
import { Category, IItemPackage, Item, ItemPackage, ItemStockPrice, Manufacturer } from '../../item/model/item';
import { ExternalUser, ExternalUserData } from '../../auth/model/external-user';
import { Dealer } from '../../dealer/model/dealer';

import { ItemsService } from '../../item/item.service';
import { SalesOrderService } from '../../sales-order/sales-order.service';
import { CustomerService } from '../../customer/customer.service';
import { ExternalUserService } from '../../auth/external-user.service';
import { DealerService } from '../../dealer/dealer.service';
import { ProfileService } from '../../auth/profile.service';
import { IUserArea } from '../../auth/model/userProfile';

@Component({
  selector: 'app-upload-data',
  templateUrl: 'upload-data.page.html',
})
export class UploadDataPage implements OnInit, OnDestroy {
  public _fileTypeSelected: boolean;
  private _selectedType: string;
  private _arrCustomerDetails: Array<CustomerDetails>;
  private _arrExternalUsers: Array<ExternalUser>;
  private _arrItemStockPrice: Array<ItemStockPrice>;
  private _arrManufacturer: Array<Manufacturer>;
  private _arrCategories: Array<Category>;
  private _arrItems: Array<Item>;
  private _arrUserAreas: Array<IUserArea>;

  private hasFirstRowColHeader = false;
  public recordCount: number;
  public uploadFileName: string;
  public _isValid: boolean;
  public fileReadData: any[][];

  public _processStatus: string = "";
  public _fileStatus: string = "";
  public _fileUploadStatus: string = "";
  public _fileUploadStatusColor: string = "success";

  /* Holds the DOM refrenece of input file control which is used for file importing.*/
  @ViewChild('fileImportInput', { read: false, static: true }) fileImportInput: any;

  constructor(
    public commonData: CommonService,
    private _authService: AuthService,
    private _profileService: ProfileService,
    private _customerService: CustomerService,
    private _externalUserService: ExternalUserService,
    private _itemsService: ItemsService,
    private _salesOrderService: SalesOrderService,
    private _dealerService: DealerService,
  ) { }

  ngOnInit() {
    this._fileTypeSelected = false;
    this._selectedType = "";
  }

  ngOnDestroy() {
  }

  public typeSelected(type): void {
    this._fileUploadStatus = "";
    // update file status
    this._fileStatus = "";
    // disable Preview & Send buttons
    this._isValid = false;

    if (this.fileImportInput && this.fileImportInput.nativeElement.files.length > 0) {
      this.fileImportInput.nativeElement.value = "";
    }
    this._fileTypeSelected = true;
    this._selectedType = type.value;
  }

  async fileChangeListener(e: any) {
    const input = e.target;
    const reader = new FileReader();
    this.uploadFileName = input.files[0].name;
    this._isValid = false;

    reader.readAsText(input.files[0]);

    reader.onloadend = async () => {
      if (reader.readyState === FileReader.DONE) {
        // set the flag
        this._isValid = true;

        switch (this._selectedType) {
          case "C":
            this.populateCustomerData(input.files[0].name)
              .then((rowCount) => {
                // disable Preview & Send buttons
                this._isValid = true;
                this._fileUploadStatusColor = "success";
                this._fileUploadStatus = "{0} rows processed successfully!".format(rowCount);
                Utilities.presentToast("{0} file loaded successfully!".format(input.files[0].name));

              }).catch((reason) => {
                this._isValid = false;

                this._fileUploadStatusColor = "danger";
                this._fileUploadStatus = reason;
                Utilities.presentToast("{0} file loaded with error!".format(input.files[0].name));
              });
            break;
          case "I":
            this.populateItemData(input.files[0].name)
              .then((rowCount) => {
                // disable Preview & Send buttons
                this._isValid = true;
                this._fileUploadStatusColor = "success";
                this._fileUploadStatus = "{0} rows processed successfully!".format(rowCount);
                Utilities.presentToast("{0} file loaded successfully!".format(input.files[0].name));

              }).catch((reason) => {
                this._isValid = false;

                this._fileUploadStatusColor = "danger";
                this._fileUploadStatus = reason;
                Utilities.presentToast("{0} file loaded with error!".format(input.files[0].name));
              });
            break;
          case "U":
            this.populateExternalUserData(input.files[0].name)
              .then((rowCount) => {
                // disable Preview & Send buttons
                this._isValid = true;
                this._fileUploadStatusColor = "success";
                this._fileUploadStatus = "{0} rows processed successfully!".format(rowCount);
                Utilities.presentToast("{0} file loaded successfully!".format(input.files[0].name));

              }).catch((reason) => {
                this._isValid = false;

                this._fileUploadStatusColor = "danger";
                this._fileUploadStatus = reason;
                Utilities.presentToast("{0} file loaded with error!".format(input.files[0].name));
              });
            break;
          case "UA":  // User areas
            this.populateUserAreaData(input.files[0].name)
              .then((rowCount) => {
                // disable Preview & Send buttons
                this._isValid = true;
                this._fileUploadStatusColor = "success";
                this._fileUploadStatus = "{0} rows processed successfully!".format(rowCount);
                Utilities.presentToast("{0} file loaded successfully!".format(input.files[0].name));

              }).catch((reason) => {
                this._isValid = false;

                this._fileUploadStatusColor = "danger";
                this._fileUploadStatus = reason;
                Utilities.presentToast("{0} file loaded with error!".format(input.files[0].name));
              });
            break;
          default:
            break;
        }
      }
    };

    reader.onload = (data) => {
      const csvData = reader.result;
      let arrRows = csvData.toString().split('\n');
      // Removes first row if it has column header in the file
      if (this.hasFirstRowColHeader === true) {
        arrRows = arrRows.splice(1);
      }
      // update file status
      this._fileStatus = (arrRows.length - 1).toString() + " rows found in the file."
      // initialise the array to blank
      this.fileReadData = [];

      arrRows.forEach((elementRow, indexRow) => {
        // ignore blank row
        if (elementRow != "") {
          const arrCols = elementRow.split('\t');

          try {
            // initialise blank row
            this.fileReadData[indexRow] = [];
            arrCols.forEach((elementCol, indexCol) => {
              this.fileReadData[indexRow][indexCol] = elementCol;
            });
          } catch (error) {
            Utilities.presentToast(error);
            console.error(error);
            this._isValid = false;
          }
        }
      });
    };

    reader.onerror = () => {
      Utilities.presentToast('Unable to read ' + input.files[0]);
      console.error('Unable to read ' + input.files[0]);
      this._isValid = false;
    };
  }

  private isValidCompany(companyCode: string): boolean {
    return (this.commonData.dealer?.companyCode == companyCode);
  }

  private async populateCustomerData(dataFileName: string): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      let processingRowIndex = 0;
      try {
        const totalCol = 22;
        this._arrCustomerDetails = new Array<CustomerDetails>();

        for (processingRowIndex = 0; processingRowIndex < this.fileReadData.length; processingRowIndex++) {
          const element = this.fileReadData[processingRowIndex];
          if (element.length != totalCol) {   // Raise error if total columns mismatches
            reject("Customer data file '{0}' should contains {1} columns but has {2} columns at line {3}.".format(dataFileName, totalCol, element.length, processingRowIndex));
          } else {
            let cust: CustomerDetails = new CustomerDetails();

            // cust.customerName = JSON.parse(element[1]); // descript
            // cust.userProfileUID = null;
            // cust.dealerID = this.commonData.dealer.dealerID;
            // cust.externalCode = JSON.parse(element[0]); // ac_code
            // cust.externalCode1 = JSON.parse(element[11]); // acnt_id
            // cust.externalCode2 = null;
            // cust.mobileNo = JSON.parse(element[7]); // tel_no
            // cust.deliveryAddress = JSON.parse(element[2]) + " " + JSON.parse(element[3]) + " " + JSON.parse(element[4]); // add_1 + add_2 + add_3
            // cust.pincode = JSON.parse(element[5]); // pin_cd
            // cust.email = JSON.parse(element[6]); // email
            // cust.gstNo = JSON.parse(element[9]); // gstin
            // cust.foodLicenseNo = JSON.parse(element[8]); // food_licen
            // cust.isActive = true;

            if (this.isValidCompany(element[0].replaceAll("^", ""))) { // cmpny_cd
              cust.customerName = element[2].replaceAll("^", ""); // descript
              cust.userProfileUID = null;
              cust.dealerID = this.commonData.dealer.dealerID;
              cust.externalCode = element[1].replaceAll("^", ""); // ac_code
              cust.externalCode1 = element[12].replaceAll("^", ""); // acnt_id
              cust.externalCode2 = null;
              // removes last char \r from the value as it contains row delimeter
              let tmpValue = element[21].replaceAll("^", ""); // is_retail
              tmpValue = tmpValue.substr(0, 1);
              cust.isRetailer = tmpValue == "T" ? true : false;

              cust.mobileNo = element[8].replaceAll("^", ""); // tel_no
              cust.deliveryAddress = element[3].replaceAll("^", "") + " " + element[4].replaceAll("^", "") + " " + element[5].replaceAll("^", ""); // add_1 + add_2 + add_3
              cust.pincode = element[6].replaceAll("^", ""); // pin_cd
              cust.areaCode = element[13].replaceAll("^", ""); // sarea_cd

              cust.email = element[7].replaceAll("^", ""); // email
              cust.gstNo = element[10].replaceAll("^", ""); // gstin
              cust.gstate_cd = element[11].replaceAll("^", ""); // gstate_cd
              cust.gst_regstr = element[20].replaceAll("^", ""); // gst_regstr
              cust.foodLicenseNo = element[9].replaceAll("^", ""); // food_licen
              cust.isActive = true;

              this._arrCustomerDetails.push(cust);
            }
          }
        }

        resolve(this._arrCustomerDetails.length);
      } catch (error) {
        reject("Error occured at row [{0}]. Error: {1}".format(processingRowIndex, error));
      }
    });
  }

  private async populateItemData(dataFileName: string): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      let processingRowIndex = 0;
      try {
        const totalCol = 27;  // last column free_qty
        this._arrItemStockPrice = new Array<ItemStockPrice>();
        this._arrManufacturer = new Array<Manufacturer>();
        this._arrCategories = new Array<Category>();
        this._arrItems = new Array<Item>();
        let recordFound;

        // 1. populate items in the array
        for (processingRowIndex = 0; processingRowIndex < this.fileReadData.length; processingRowIndex++) {
          const element = this.fileReadData[processingRowIndex];
          if (element.length !== totalCol) {   // Raise error if total columns mismatches
            reject("Item data file '{0}' should contains {1} columns but has {2} columns at line {3}.".format(dataFileName, totalCol, element.length, processingRowIndex));
          } else {
            // company has to be the current company
            if (!this.isValidCompany(element[0].replaceAll("^", ""))) break; // cmpny_cd

            let categoryName = "", packageSize = "", packageUnit = "", manufacturerName = "", itemID = "";

            categoryName = element[20].replaceAll("^", "");    // it_und_gp
            categoryName = (categoryName == "" ? null : categoryName);

            packageSize = element[10].replaceAll("^", ""); // no_pkg
            // if size is 0 then make it null
            if (packageSize == "0" || packageSize == "0.0" || packageSize == "0.00") packageSize = null;
            packageUnit = element[9].replaceAll("^", ""); // pkg_unit
            // make unit as lower case
            packageUnit = packageUnit.toLocaleLowerCase();

            manufacturerName = element[2].replaceAll("^", "");//mgfname
            itemID = "{{0}}{{1}}".format(this.commonData.dealer.dealerID, element[5].replaceAll("^", ""));//it_cd

            // 1. Manufacturer
            let code = element[1].replaceAll("^", ""); //supp_cd
            if (code) {
              let manufacturer: Manufacturer = new Manufacturer();
              manufacturer.dealerID = this.commonData.dealer.dealerID;
              manufacturer.externalCode = code;
              manufacturer.manufacturerName = manufacturerName;
              manufacturer.isActive = true;

              // find if the manufacturer already exists
              // if find then ignore else add it to the array
              recordFound = this._arrManufacturer.find(m => "{{0}}{{1}}".format(m.dealerID, m.externalCode) == "{{0}}{{1}}".format(manufacturer.dealerID, manufacturer.externalCode));
              if (!recordFound) {
                this._arrManufacturer.push(manufacturer);
              }
            }

            // 2. Category
            if (categoryName) {
              let category: Category = new Category();
              category.dealerID = this.commonData.dealer.dealerID;
              category.externalCode = categoryName;
              category.categoryName = categoryName;
              category.imageURL = "";
              category.isActive = true;

              // find if the category already exists
              // if find then ignore else add it to the array
              recordFound = this._arrCategories.find(c => "{{0}}{{1}}".format(c.dealerID, c.externalCode) == "{{0}}{{1}}".format(category.dealerID, category.externalCode));
              if (!recordFound) {
                this._arrCategories.push(category);
              }
            }

            // 3. Item -> ItemPackage
            let itemPackage: IItemPackage = {
              itemPackageID: element[3].replaceAll("^", "") //itpack_cd
              , itemPackageName: element[4].replaceAll("^", "")//itempackname
              , packageUnit: packageUnit
              , packageSize: packageSize
            };

            // 4. Item
            let item: Item;

            recordFound = <Item>this._arrItems.find(i => i.itemID == itemID);
            if (recordFound) {
              recordFound.itemPackages.push(itemPackage);
              item = recordFound;
            } else {
              item = new Item();

              item.dealerID = this.commonData.dealer.dealerID;
              item.itemID = itemID;
              item.itemName = element[6].replaceAll("^", "");//itemname
              item.itemDescription = "";
              item.itemImageURLs = null;
              item.itemImageThumURL = "";
              item.manufacturer = manufacturerName;
              item.category = categoryName;
              item.canUploadFile = false;
              item.isActive = true;
              item.isDeleted = false;
              item.itemPackages = new Array<IItemPackage>();
              item.itemPackages.push(itemPackage);
              item.stockMaintained = true;
              item.userIDNEW = this._authService.loggedInFirebaseUser?.uid;

              // add new item to the array
              this._arrItems.push(item);
            }

            // 5. ItemStockPrice
            let itemStock: ItemStockPrice = new ItemStockPrice();

            itemStock.itemPackageID = null;
            itemStock.externalCode = element[14].replaceAll("^", "");  //ipmrp_cd
            itemStock.externalCode1 = element[11].replaceAll("^", ""); //short_cd
            itemStock.externalCode2 = element[3].replaceAll("^", ""); //itpack_cd

            itemStock.itemName = element[15].replaceAll("^", "");    //mrp_item
            itemStock.itemDescription = element[19].replaceAll("^", ""); //sal_remark
            itemStock.orderDate = new Date();
            itemStock.orderNo = null;
            // convert string to number
            itemStock.mrp = element[16].replaceAll("^", "") * 1; //mrp
            itemStock.sellingPrice = (element[16].replaceAll("^", "") * 1) - (element[18].replaceAll("^", "") * 1);//mrp-off_onmrp
            itemStock.wholesalePrice = element[17].replaceAll("^", "") * 1;  //sal_gr_rt
            itemStock.wholesalePriceWithGST = element[21].replaceAll("^", "") * 1;  //salnet_rt
            itemStock.gst_pc = element[22].replaceAll("^", "") * 1;  //gst_pc
            itemStock.gcess_pc = element[23].replaceAll("^", "") * 1;  //gcess_pc
            itemStock.free_qty = element[24].replaceAll("^", "") * 1;  //free_qty
            itemStock.off_onmrp = element[18].replaceAll("^", "") * 1;  //off_onmrp
            itemStock.hsn_cd = element[25].replaceAll("^", "");  //hsn_cd
            itemStock.stk_marg = element[26].replaceAll("^", "") * 1;  //stk_marg
            itemStock.stockQty = 100;
            itemStock.returnQty = null;
            itemStock.stockMinimumQty = 9999; // in order to always show the balance qty to the user
            itemStock.userIDNEW = this._authService.loggedInFirebaseUser?.uid;
            itemStock.itemID = itemID;
            itemStock.dealerID = this.commonData.dealer.dealerID;
            itemStock.category = categoryName;
            itemStock.manufacturer = manufacturerName;
            itemStock.itemImageThumURL = null;
            itemStock.itemImageURLs = null;

            itemStock.packageSize = packageSize;
            itemStock.packageUnit = packageUnit;
            itemStock.canUploadFile = false;
            itemStock.stockMaintained = false;
            itemStock.isActive = true;

            this._arrItemStockPrice.push(itemStock);
          }
        }

        resolve(this._arrItemStockPrice.length);
      } catch (error) {
        reject("Error occured at row [{0}]. Error: {1}".format(processingRowIndex, error));
      }
    });
  }

  private async populateUserAreaData(dataFileName: string): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      let processingRowIndex = 0;
      try {
        const totalCol = 3;
        this._arrUserAreas = new Array<IUserArea>();

        for (processingRowIndex = 0; processingRowIndex < this.fileReadData.length; processingRowIndex++) {
          const element = this.fileReadData[processingRowIndex];
          if (element.length != totalCol) {   // Raise error if total columns mismatches
            reject("User area data file '{0}' should contains {1} columns but has {2} columns at line {3}.".format(dataFileName, totalCol, element.length, processingRowIndex));
          } else {

            if (this.isValidCompany(element[0].replaceAll("^", ""))) { // cmpny_cd
              // for ^ column grouping
              // e.g. value '^RAJENDRA ""SINGH^'
              const email = element[1].replaceAll("^", ""); // email
              // removes last char \r from the value as it contains row delimeter
              const areas = element[2].replaceAll("^", "").replaceAll("\r", ""); // areacode

              let userArea = this._arrUserAreas.find(u => u.email == email)
              if (userArea) {
                // append area to the areaCodes
                userArea.areaCodes.push(areas);
              } else {
                // if area is empty, means assign null for all areas
                if (areas) {
                  let areaCodes = new Array<string>();

                  // + delimited multiple areas
                  areas.split("+").forEach((area: string) => {
                    if (area) areaCodes.push(area);
                  });
                  userArea = { email: email, areaCodes: areaCodes };
                }
                else
                  userArea = { email: email, areaCodes: null };

                // Add user only if it has email id
                if (userArea.email) this._arrUserAreas.push(userArea);
              }
            }
          }
        }

        resolve(this._arrUserAreas.length);
      } catch (error) {
        reject("Error occured at row [{0}]. Error: {1}".format(processingRowIndex, error));
      }
    });
  }

  private async populateExternalUserData(dataFileName: string): Promise<number> {
    return new Promise<number>(async (resolve, reject) => {
      let processingRowIndex = 0;
      try {
        const totalCol = 7;
        this._arrExternalUsers = new Array<ExternalUser>();

        for (processingRowIndex = 0; processingRowIndex < this.fileReadData.length; processingRowIndex++) {
          const element = this.fileReadData[processingRowIndex];
          if (element.length != totalCol) {   // Raise error if total columns mismatches
            reject("User data file '{0}' should contains {1} columns but has {2} columns at line {3}.".format(dataFileName, totalCol, element.length, processingRowIndex));
          } else {
            let user: ExternalUser = new ExternalUser();
            let userData: ExternalUserData = new ExternalUserData();

            if (this.isValidCompany(element[0].replaceAll("^", ""))) { // cmpny_cd
              // for ^ column grouping
              // e.g. value '^RAJENDRA ""SINGH^'
              userData.dealerID = this.commonData.dealer.dealerID;
              userData.dealerCode = this.commonData.dealer.dealerCode;
              userData.userName = element[2].replaceAll("^", ""); // descript
              userData.externalCode = element[1].replaceAll("^", ""); // srep_cd
              userData.externalCode1 = null;
              userData.externalCode2 = null;
              userData.mobileNo = element[3].replaceAll("^", ""); // mobile_no
              let roles: string = element[5].replaceAll("^", ""); // user_type

              switch (roles.toUpperCase()) {
                case "D":
                  userData.roles = { dealer: true };
                  break;
                case "M":
                  userData.roles = { manager: true };
                  break;
                case "O":
                  userData.roles = { operator: true };
                  break;
                case "S":
                  userData.roles = { salesperson: true };
                  break;
                case "C":
                  userData.roles = { customer: true };
                  break;
                default:
                  break;
              }

              user.email = element[4].replaceAll("^", ""); // email_id
              user.externalUserID = null;
              user.userProfileID = null;
              user.externalUserData = userData;

              // Add externalUser only if it has email id
              if (user.email && user.email !== "dharamrahul@gmail.com") this._arrExternalUsers.push(user);
            }
          }
        }

        resolve(this._arrExternalUsers.length);
      } catch (error) {
        reject("Error occured at row [{0}]. Error: {1}".format(processingRowIndex, error));
      }
    });
  }

  public async uploadData2DB() {
    this._isValid = false;
    switch (this._selectedType) {
      case "C":
        await this.deleteCustomerFrmDB();
        await this.uploadCustomer2DB();
        break;
      case "I":
        await this.deleteItemsFrmDB();
        await this.uploadItems2DB();
        break;
      case "A":
        // await this.uploadAreas2DB();
        // await this.deleteSalesOrderDB();
        break;
      case "U":
        await this.uploadExternalUser2DB();
        //await this.createData();
        break;
        break;
      case "UA":  // User areas
        await this.updateUserProfileAreas();
        break;
      default:
        break;
    }
  }

  private async updateUserProfileAreas() {
    try {
      let userAreas =
        this._arrUserAreas.forEach(async (userArea: IUserArea) => {
          await this._profileService.updateUserProfileAreas(this.commonData.dealer.dealerID, userArea.email, userArea.areaCodes);
        });
    } catch (error) {
      console.log(error);
    }
  }

  private async deleteSalesOrderDB() {
    try {
      await this._salesOrderService.deleteAll_SalesOrder(this.commonData.dealer.dealerID, -21);
    } catch (error) {
      console.log(error);
    }
  }
  private async deleteItemsFrmDB() {
    try {
      await this._itemsService.deleteAll_itemStockPrice(this.commonData.dealer.dealerID);
    } catch (error) {
      console.log(error);
    }
  }

  private async deleteCustomerFrmDB() {
    try {
      await this._customerService.deleteAll_customer(this.commonData.dealer.dealerID);
    } catch (error) {
      console.log(error);
    }
  }

  private async uploadCustomer2DB(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // upload customers from array to DB
        await this._customerService.uploadCustomers(this._arrCustomerDetails);

        Utilities.presentToast(this.uploadFileName + ' file uploaded successfully!');
        this._fileUploadStatus = this._arrCustomerDetails.length.toString() + ' customer records uploaded successfully!';

        resolve();
      } catch (error) {
        Utilities.presentToast('Error occured while uploading data to database!');
        this._fileUploadStatus = 'Error in uploading file to the database! {0}'.format(error);

        reject(error);
      }
    });
  }

  private async uploadExternalUser2DB(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // 1. upload externalUsers from array to DB
        await this._externalUserService.uploadExternalUsers(this._arrExternalUsers);

        // 2. send password reset link to all valid email ids after (this._arrExternalUsers.length * 1000) ms 
        // which will allow the firebase server to create all users by that time.
        this._fileUploadStatus = "Sending password reset link to all records...";
        setTimeout(async () => {
          console.log("Password reset link.")
          await this.sendPasswordResetLink();

          Utilities.presentToast(this.uploadFileName + ' file uploaded successfully!');
          this._fileUploadStatus = this._arrExternalUsers.length.toString() + ' user records uploaded successfully!';

          resolve();
        }, this._arrExternalUsers.length * 1000);
      } catch (error) {
        Utilities.presentToast('Error occured while uploading data to database!');
        this._fileUploadStatus = 'Error in uploading file to the database! {0}'.format(error);

        reject(error);
      }
    });
  }

  private async uploadItems2DB(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // upload items from array to DB
        await this._itemsService.uploadManufacturers(this._arrManufacturer);
        await this._itemsService.uploadCategories(this._arrCategories);
        await this._itemsService.uploadItems(this._arrItems);
        await this._itemsService.uploadItemStockPrices(this._arrItemStockPrice);

        Utilities.presentToast(this.uploadFileName + ' file uploaded successfully!');
        this._fileUploadStatus = this._arrItemStockPrice.length.toString() + ' item records uploaded successfully!';

        resolve();
      } catch (error) {
        Utilities.presentToast('Error occured while uploading data to database!');
        this._fileUploadStatus = 'File loaded but there was some error uploading it to the database! {0}'.format(error);

        reject(error);
      }
    });
  }

  private async sendPasswordResetLink() {
    this._arrExternalUsers.forEach(async element => {
      if (element.email && element.email != "") {
        await this._authService.sendPasswordResetEmail(element.email);
      }
    });
  }

  private async createData() {
    // Create dealer
    let dealer = new Dealer();

    dealer = new Dealer();
    dealer.dealerID = "";
    dealer.dealerCode = "ge01";
    dealer.companyCode = "2";
    dealer.dealerName = "GAYATRI ENTERPRISE";
    dealer.dealerEmailAddress = "kishortawar57@gmail.com";
    dealer.dealerLogoURL = "";
    dealer.minimumOrderAmount = 1000;
    dealer.instructions = "GST No.:27BCTPT8167R1Z1. SAINATH SHARMA CHALL,SHIVAM HOTEL,JAWAHAR NAGAR,GOLIBA ROAD,KHAR(E),MUM-400015. Mob:8108252393.";
    dealer.address = "SAINATH SHARMA CHALL,SHIVAM HOTEL,JAWAHAR NAGAR,GOLIBA ROAD,KHAR(E),MUM-400015.";
    dealer.hasExternalSystem = true;
    dealer.isActive = true;

    await this._dealerService.createDealer(dealer);
  }
}
