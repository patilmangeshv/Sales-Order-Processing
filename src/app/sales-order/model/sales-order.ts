import { CustomerDetails } from '../../customer/model/customerDetails';
import { OrderItemData } from '../../item/model/item';

/**Sales order header.*/
export class SalesOrder {
    salesOrderID: string;
    salesOrderNo: any;
    dealerID: string;
    orderDate: Date;
    orderSystemDate: any;
    totalAmt: number;
    totalQty: number;
    /**The logged in UserID who has created this order.*/
    userID: string;
    /**User name who inputed the order. If customer inputed the order then the "self" will be stored in this else the user name who inputed the order.*/
    userIDName: string;
    /**externalCode from the external system. This will be exported so that the external system will be able to map it with their system.*/
    userIDExternalCode: string;
    orderStatus: string;
    narration: string;
    /**Sales order exported on the date and time*/
    dataExportedDateTime?: any;
    /**Sales order exported by user */
    dataExportedUserIDName?: string;

    /**Cancellation reason of the order. The reason should be recorded while cancelling the order.*/
    orderCancellationReason?: string;
    orderStatusChangedDate?: Date;
    /**The logged in UserID who has changed the status of this order.*/
    orderStatusChangedByUserID?: string;

    customerDetails: CustomerDetails;

    /**In sales order list this flag signifies whether it is selected or not.*/
    isSalesOrderSelected?: boolean;
}

/**Sales order's item details.*/
export class SalesOrderItems {
    /**Reference ID of SalesOrder.salesOrderID.*/
    salesOrderID: string;
    orderItems: Array<OrderItemData>;
}