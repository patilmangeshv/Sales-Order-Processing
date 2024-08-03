import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

/**
 * Updates salesOrderNo of Sales order document when it is newly created.
 */
export const updateSalesOrder_salesOrderNo = functions
    // .region('asia-east2').firestore
    .region('asia-south1').firestore
    .document('salesOrder/{salesOrderID}')
    .onCreate(async (snapshot, context) => {
        const data = snapshot.data();

        const salesOrderRef = db.doc(`/salesOrder/${data.salesOrderID}`);
        const docSerialNumberRef = db.doc(`/docSerialNumber/${data.dealerID}`);

        // 1. update so_CurrentSerialNumber (SaleOrder) of salesOrder in docSerialNumber.
        await docSerialNumberRef.set({
            so_CurrentSerialNumber: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

        // 2. get the new serial number
        const docSerialNumberSnap = await docSerialNumberRef.get();
        const docSerialNumberData = docSerialNumberSnap.data();

        // 3. update item package with next serial number in salesOrderNo.
        return salesOrderRef.set({
            salesOrderNo: docSerialNumberData?.so_CurrentSerialNumber,
        }, { merge: true });
    });

/**
 * Sends notification to customer who placed the order for change in the order status.
 */
export const updateSalesOrder_orderStatusChange = functions
    // .region('asia-east2').firestore
    .region('asia-south1').firestore
    .document('salesOrder/{salesOrderID}')
    .onUpdate(async (snapshot, context) => {
        const dataAfter = snapshot.after.data();
        const dataBefore = snapshot.before.data();

        if (dataAfter.orderStatus !== dataBefore.orderStatus) {
            // send the message
            const payload = {
                notification: {
                    title: 'Order status changed!',
                    body: 'Order status is changed to ' + dataAfter.orderStatus + ' for Sales order No.: ' + dataAfter.salesOrderNo?.toString() + '.',
                    icon: '/assets/icon/icon.png',
                },
                data: {
                    entity: 'SalesOrder',
                    salesOrderNo: dataAfter.salesOrderNo?.toString(),
                    orderStatus: dataAfter.orderStatus,
                    orderStatusChangedDate: dataAfter.orderStatusChangedDate.toDate().toJSON(),
                }
            }

            if (dataAfter.userID) {
                const userProfileData = (await db.doc(`userProfile/${dataAfter.userID}`).get()).data();

                const tokens = userProfileData?.fcmTokens ? Object.keys(userProfileData?.fcmTokens) : [];

                if (tokens.length) {
                    await admin.messaging().sendToDevice(tokens, payload);
                }
            }
        }

        return;
    });