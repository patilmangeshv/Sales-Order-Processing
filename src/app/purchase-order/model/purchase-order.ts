import { ItemStockPrice } from '../../item/model/item';

/**Purchase order header.*/
export class PurchaseOrder {
    orderID: string;
    dealerID: string;
    /**Stock record adding date.*/
    stockDate: any;
    /**Purchase vendor order number.*/
    orderNo: any;
    orderDate: Date;
    totalAmt: number;
    totalQty: number;
    /**The logged in UserID who has created this order.*/
    userID: string;
}

/**Purchase order's item details.*/
export class PurchaseOrderItems {
    /**Reference ID of PurchaseOrder.orderID.*/
    orderID: string;
    orderItems: Array<ItemStockPrice>;
}