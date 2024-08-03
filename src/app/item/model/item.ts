export class OrderItem {
    dealerID: string;
    item: ItemStockPrice;
    quantity: number;
    // amount: number;
    /**Uploaded file reference in case if the item is canUploadFile=true.
     * This will be the uploded file reference.
    */
    orderItemFile?: any;
}

/**Mimumum Item details which are required to be stored in the Sales Order table.*/
export class OrderItemData {
    itemStockPriceID: string;
    /**External system code to map the items between this and the external system.*/
    externalCode?: string;
    /**External system code 1 */
    externalCode1?: string;
    /**External system code 2 */
    externalCode2?: string;
    itemName: string;
    itemDescription: string;
    itemImageThumURL?: string;
    sellingPrice: number;
    mrp: number;
    wholesalePrice: number;
    wholesalePriceWithGST?: number;
    gst_pc?: number;
    gcess_pc?: number;
    free_qty?: number;
    off_onmrp?: number;
    hsn_cd?: string;
    stk_marg?: number;
    /**Discount amount on the selling price*/
    discount: number;
    quantity: number;
    /**Size of the item to sale. e.g. .500 gram, 1 kg, 1 ltr,  */
    packageSize: string;
    packageUnit: string;
    stockMaintained: boolean;

    /**Can customer upload a file. This could be used if the item is stationary
      * to be printed. The customer can upload one single file to be printed.*/
    canUploadFile?: boolean
    /**Uploaded file reference in case if the item is canUploadFile=true.
     * This will be the uploded file reference.
    */
    orderItemFile?: any;
}

export interface IImageURL {
    URL: string;
    ImageSize: string;
}

export class Category {
    dealerID: string;
    /**External system code to map the items between this and the external system.*/
    externalCode?: string;
    categoryName: string;
    imageURL?: string;
    isActive: boolean;
}

export class Manufacturer {
    dealerID: string;
    /**External system code to map the items between this and the external system.*/
    externalCode?: string;
    manufacturerName: string;
    isActive: boolean;
}

/**
 * Item document.
 * Structure.
 * Item
 *   |
 *    --> ItemPackage (1 to n) sub collection
 *   |
 *    --> ItemStockPrice (1 to n) sub collection - this document will be shown to the customer for placing sales orders.
 *   |
 *   --> ItemStockPriceReversal (1 to n) sub collection till ItemStockPrice.balanceQty=ItemStockPriceReversal.reversalStockQty.
 */
export class Item {
    itemID: string;
    dealerID: string;
    itemName: string;
    itemDescription: string;
    category?: string;
    manufacturer?: string;
    /**Tags for the item. This will hold the item name, description, category, manufacturer.
    * The search will be happen on this field to centralise the search of the item on these fields.*/
    public get tags(): string {
        return this.itemName + " " + this.itemDescription + " " + this.category + " " + this.manufacturer;
    }
    /**Item thumnail image URL.*/
    itemImageThumURL?: string;
    itemImageURLs?: IImageURL[];
    /**Can customer upload a file. This could be used if the item is stationary
     * to be printed. The customer can upload one single file to be printed.*/
    canUploadFile?: boolean;
    /**Flag to determine if the stock of the item is maintained and the balance quantity to be checked while accepting the order from customer.*/
    stockMaintained: boolean;
    isActive?: boolean;
    isDeleted: boolean;
    /**New record created by User ID.*/
    userIDNEW: string;
    /**Array of item packages summary works as tags.*/
    itemPackages?: IItemPackage[];
}

export interface IItemPackage {
    itemPackageID: string;
    itemPackageName: string;
    packageSize: string;
    packageUnit: string;
}

/**Item packing master. This is the unit of item to sale. e.g. Parle G 100g.*/
export class ItemPackage {
    /**Unique ID of the salable item of the Item.*/
    itemPackageID: string;
    /**Packaged Item name to be shown to the customer. Will be defaulted from Item.itemName 
    * will be appended by packageSize + packageUnit.
    */
    itemPackageName: string;
    itemDescription: string;
    /**Size of the item to sale. e.g. .500 gram, 1 kg, 1 ltr,  */
    packageSize: string;
    packageUnit: string;

    // DUPLICATE data from Item
    // Below fields will be duplicated from Item to avoid fetching data from Item.
    // NOTE: The redundancy should be maintained if there are any changes in Item,
    // then the same should be replicated here.
    itemID: string;
    dealerID: string;
    category?: string;
    manufacturer?: string;
    /**Tags for the item. This will hold the item name, description, category, manufacturer.
    * The search will be happen on this field to centralise the search of the item on these fields.*/
    public get tags(): string {
        return this.itemPackageName + " " + this.itemDescription + " " + this.category + " " + this.manufacturer;
    }
    /**Item thumnail image URL.*/
    itemImageThumURL?: string;
    /**Image URLs for the items to show to the end user. If this is null then 
    * Item's URL will be shown to the user.
    */
    itemImageURLs?: IImageURL[];

    canUploadFile?: boolean;
    stockMaintained: boolean;
    /**Flag to determine if the Item is available for sale.*/
    isActive: boolean;
    isDeleted: boolean;
    /**Flag to identify if the user has selected this item on the UI screen. Should not be used for database operation.*/
    isItemSelected?: boolean;
}

/**
 * Item document which holds the price, the stock quantity and the running balance quantity. The customer will be placing
 * orders by selecting record from this document. This may holds duplicate records of the 
 * same or different item price with same or different stockQty. If user enters duplicate records, the customer will see
 * the same as a geniune case to have multiple stocks of the same item with same/different price with same/different stockQty.
 */
export class ItemStockPrice {
    itemStockPriceID: string;   // Auto ID
    itemPackageID: string;
    /**External system code to map the items between this and the external system.*/
    externalCode?: string;
    /**External system code 1 */
    externalCode1?: string;
    /**External system code 2 */
    externalCode2?: string;
    /**Packaged Item name to be shown to the customer. Will be defaulted from ItemPackage.itemName 
    * and allowed to change to the user.
    */
    itemName: string;
    itemDescription: string;

    /**Stock record adding date.*/
    stockDate: any;
    orderID?: string;
    orderDate?: Date;
    orderNo?: string;
    mrp: number;
    sellingPrice: number;
    wholesalePrice: number;
    wholesalePriceWithGST?: number;
    /**This price will be either wholesalePrice and wholesalePriceWithGST. 
     * IF wholesalePriceWithGST>0 THEN wholesalePriceWithGST ELSE wholesalePrice.*/
    public get wholesaleBillPrice(): number {
        return this.wholesalePriceWithGST > 0 ? this.wholesalePriceWithGST : this.wholesalePrice;
    }
    gst_pc?: number;
    gcess_pc?: number;
    free_qty?: number;
    off_onmrp?: number;
    hsn_cd?: string;
    stk_marg?: number;
    /**Stock balance quantity. This will be maintained to verify the stock of the items in the system.
     * 1. When a new record is created this will hold the value from stockQty field.
     * 2. Whenever customer buys this item the quanity from this field will be reduced and to be checked if this does not get -ve anytime.
     * 3. Whenever customer cancels the sales order the qauntity will be increased.
     * 4. Whenever the stock reversal is processed on this item, the reversal quantity should be reduced from this upto the balance qty and
     * make sure this never gets -ve. A new record will be created in ItemStockPriceReversal document to maintain the record.
    */
    balanceQty?: number;
    /**Stock quantity of the item. This will be used to validate the stock of the item.
     * The null value means the stock is not maintained and no balance quantity check to be done.
    */
    stockQty?: number;
    /**Qty to keep the record of return qty.*/
    returnQty?: number;
    /**Minimum stock quantity to maintained. Once this quantity is less than balanceQty then system will show the balance quantity to the user.*/
    stockMinimumQty?: number;
    /**New record created by User ID.*/
    userIDNEW: string;
    isItemSelected?: boolean;
    isFavorite?: boolean;
    /**Order quantity while placing the order.*/
    quantity?: number;

    // DUPLICATE data from Item. A function should be written to replicate changes in ItemPackage to this document.
    // Below fields will be duplicated from Item to avoid fetching data from Item.
    // NOTE: The redundancy should be maintained if there are any changes in Item,
    // then the same should be replicated here.
    itemID: string;
    dealerID: string;
    category?: string;
    manufacturer?: string;
    /**Tags for the item. This will hold the item name, description, category, manufacturer.
    * The search will be happen on this field to centralise the search of the item on these fields.*/
    public get tags(): string {
        return this.itemName + " " + this.itemDescription + " " + this.category + " " + this.manufacturer;
    }
    /**Item thumnail image URL.*/
    itemImageThumURL?: string;
    /**Image URLs for the items to show to the end user. If this is null then 
    * Item's URL will be shown to the user.
    */
    itemImageURLs?: IImageURL[];
    /**Size of the item to sale. e.g. .500 gram, 1 kg, 1 ltr,  */
    packageSize: string;
    packageUnit: string;

    canUploadFile?: boolean;
    stockMaintained: boolean;
    /**Flag to determine if the Item is available for sale.*/
    isActive: boolean;
}

/**
 * A stock price reversal record keeping document which will allow user to select the stock price record from ItemStockPrice
 * document and accepts the reversalStockQty. This should never be greater than balanceQty of ItemStockPrice.
 * A function will be written to reduce the balanceQty of ItemStockPrice by reversalStockQty of this document.
 */
export class ItemStockPriceReversal {
    itemStockPriceReversalID: string;   // Auto ID
    itemStockPriceID: string;
    reversalStockQty: number;
    reversalStockDate: Date;
    /**New record created by User ID.*/
    userIDNEW: string;
}