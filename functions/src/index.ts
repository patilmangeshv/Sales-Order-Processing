import * as admin from 'firebase-admin';

// initialise admin app once for all functions.
admin.initializeApp();

// functions for item document
export { replicateItemChanges } from './firestore-item';
// functions for sales order document
export { updateSalesOrder_salesOrderNo, updateSalesOrder_orderStatusChange } from './firestore-sales-order';
// function for purchaseOrderItems
export { createItemStockPrice_onCreate_purchaseOrderItems } from './firestore-purchase-order';
// function to create firebase users on creation of externalUser
export { createUser_onCreate_externalUser } from './firestore-external-user';
//function to delete/update userProfile & firebase user on deletion of externalUser
export { deleteUser_onDelete_externalUser } from './firestore-external-user';
