import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Create firebase user & userProfile on creation of externalUser.
 */
export const createUser_onCreate_externalUser = functions
    .region('asia-south1').firestore
    .document('externalUser/{externalUserID}')
    .onCreate(async (snapshot, context) => {
        const data = snapshot.data();

        if (data.email && data.email !== "") {
            // 1. Check if email id is already registered in the firebase 
            // and retrieve its details.
            let userRecord: admin.auth.UserRecord;

            console.log('Processing1-' + data.email);
            // MP NOTE: getUserByEmail() method throws error if no user found, hence below then.catch.finally block is been used.
            await admin.auth().getUserByEmail(data.email)
                .then((value) => {
                    userRecord = value;
                })
                .catch(async (error) => {
                    // 2. email id does not exisits so create user in the firebase
                    userRecord = await admin.auth().createUser({
                        disabled: false,
                        email: data.email,
                        password: data.externalUserID,  // pwd is temporary
                        // uid: data.externalUserID,    // IMP NOTE: create user with same uid of externalUserID
                    });
                })
                .finally(async () => {
                    console.log('firebase user-' + userRecord.uid);

                    // 3. add user to userProfile document if does not exists else append user details to userProfile.
                    const userProfileDocRef = db.doc(`/userProfile/${userRecord.uid}`);

                    await userProfileDocRef
                        .get()
                        .then(async (userProfileDoc) => {
                            const externalUserData = {
                                dealerID: data.externalUserData.dealerID,
                                dealerCode: data.externalUserData.dealerCode,
                                userName: data.externalUserData.userName,
                                externalCode: data.externalUserData.externalCode,
                                externalCode1: data.externalUserData.externalCode1,
                                externalCode2: data.externalUserData.externalCode2,
                                mobileNo: data.externalUserData.mobileNo,
                                roles: data.externalUserData.roles,
                            };

                            let externalUserDataArray: Array<any> = new Array<any>();
                            if (userProfileDoc.exists) {
                                externalUserDataArray = userProfileDoc.data()?.dealerUserMappingInfo;
                            }
                            const foundIndex = externalUserDataArray.findIndex(userData => userData.dealerID === data.externalUserData.dealerID)
                            console.log('foundIndex-' + foundIndex);
                            // delete if dealer already present so that the new dealer with any changes will be stored
                            if (foundIndex !== -1) {
                                externalUserDataArray.splice(foundIndex, 1);
                            }
                            externalUserDataArray.push(externalUserData);
                            await userProfileDocRef
                                .set({
                                    uid: userRecord.uid,
                                    email: data.email,
                                    dealerUserMappingInfo: externalUserDataArray,
                                }, { merge: true });
                        });

                    // 4. Update userProfileID to externalUser's userProfileID
                    await db.doc(`/externalUser/${data.externalUserID}`)
                        .set({
                            userProfileID: userRecord.uid,
                        }, { merge: true });
                });
        }

        return;
    });

/**
 * Update/delete firebase user & userProfile on deletion of externalUser.
 */
export const deleteUser_onDelete_externalUser = functions
    .region('asia-south1').firestore
    .document('externalUser/{externalUserID}')
    .onDelete(async (snapshot, context) => {
        const data = snapshot.data();

        if (data.userProfileID && data.userProfileID !== "") {
            console.log('processing externalUser-' + data.email);

            // 1. Check if userProfileID exists and extract dealerUserMappingInfo
            const userProfileDocRef = db.doc(`/userProfile/${data.userProfileID}`);
            await userProfileDocRef
                .get()
                .then(async (userProfileDoc) => {

                    let externalUserDataArray: Array<any> = new Array<any>();
                    if (userProfileDoc.exists) {
                        externalUserDataArray = userProfileDoc.data()?.dealerUserMappingInfo;
                    }
                    // find the dealerID from externalUser and search if it is present in userProfile.
                    // if found,
                    // 1. if this is only one dealer present then delete the userProfile
                    // 2. else delete only the current dealer info
                    console.log('data.externalUserData.dealerID-' + data.externalUserData.dealerID);
                    const foundIndex = externalUserDataArray.findIndex(userData => userData.dealerID === data.externalUserData.dealerID)
                    console.log('foundIndex-' + foundIndex);

                    if (externalUserDataArray.length === 1 && foundIndex !== -1) {
                        console.log('deleting userprofile-' + data.email);
                        await userProfileDocRef.delete();
                        // delete firebase user
                        await admin.auth().getUserByEmail(data.email)
                            .then(async (userRecord) => {
                                await admin.auth().deleteUser(userRecord.uid);
                            })
                            .catch(async (error) => {
                                console.log('Error while deleting firebase user - ' + error);
                            });
                    } else {
                        console.log('deleting dealer from userProfile-' + data.email);

                        if (foundIndex !== -1) {
                            externalUserDataArray.splice(foundIndex, 1);
                            await userProfileDocRef
                                .set({
                                    dealerUserMappingInfo: externalUserDataArray,
                                }, { merge: true });
                        }
                    }
                });
        }
    });
