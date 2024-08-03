import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore'
import { AngularFireMessaging } from '@angular/fire/messaging';
import { mergeMapTo } from 'rxjs/operators';

import { Utilities } from '../utils/utilities';

/**
 * Firebase cloud messaging service.
 */
@Injectable({
    providedIn: 'root'
})
export class FCMessagingService {
    // private _fcMessaging = firebase.messaging();

    private messageSource = new Subject()
    currentMessage = this.messageSource.asObservable() // message observable to show in Angular component

    constructor(private _ngfs: AngularFirestore,
        private _ngfMessaging: AngularFireMessaging,
    ) { }

    /**
     * Get token from user for sending push notifications.
     * @param user Logged in User ID.
     */
    getPermission(user) {
        this._ngfMessaging.requestToken
            .subscribe(
                (token) => {
                    // console.log('Permission granted! Save to the server!', token);
                    // const user = this.authService.loggedInUser;
                    this.saveToken(user, token);
                }, (error) => { console.error(error); },
            );
    }

    /**
     * Save the permission token in firestore.
     * @param user Logged in User ID.
     * @param token 
     */
    private saveToken(user, token): void {

        const currentTokens = user.fcmTokens || {};

        // If token does not exist in firestore, update db
        if (!currentTokens[token]) {
            const userRef = this._ngfs.collection('userProfile').doc(user.uid).ref;
            const tokens = { ...currentTokens, [token]: true };
            userRef.update({ fcmTokens: tokens });
        }
    }

    deleteToken() {
        this._ngfMessaging.getToken
            .pipe(mergeMapTo(token => this._ngfMessaging.deleteToken(token)))
            .subscribe(
                (token) => { console.log('Token deleted!'); },
            );
    }

    /**
     * Gets refreshed token from user for sending push notifications.
     * @param user Logged in User ID.
     */
    monitorRefresh(user) {
        this._ngfMessaging.onTokenRefresh(() => {
            this._ngfMessaging.getToken
                .subscribe(refreshedToken => {
                    console.log('Token refreshed.');
                    this.saveToken(user, refreshedToken);
                })
        });
    }

    /**Register for message receipts and shows message to the end user.*/
    async receiveMessages() {
        this._ngfMessaging.onMessage(async payload => {
            if (payload) {
                console.log('Message received on onMessage. ', payload);
                // console.log(new Date(payload.data.orderStatusChangedDate).formatDateTime('E MMM dd yyyy hh:mm:ss aaaa'));
                await Utilities.presentToast(payload.notification.body, payload.notification.title, "bottom");
            }
            this.messageSource.next(payload);
        });
    }
    // // 1. Get Permission from the User
    // // get permission to send messages
    // getPermission(user) {
    //     this._fcMessaging.requestPermission()
    //         .then(() => {
    //             console.log('Notification permission granted.');
    //             return this._fcMessaging.getToken()
    //         })
    //         .then(token => {
    //             console.log(token)
    //             // const user = this.authService.loggedInUser;
    //             this.saveToken(user, token)
    //         })
    //         .catch((err) => {
    //             console.log('Unable to get permission to notify.', err);
    //         });
    // }

    // // Monitor the token refresh. If the token changes, it will update it in Firestore to ensure the user still receives notifications.
    // // Listen for token refresh
    // monitorRefresh(user) {
    //     this._fcMessaging.onTokenRefresh(() => {
    //         this._fcMessaging.getToken()
    //             .then(refreshedToken => {
    //                 console.log('Token refreshed.');
    //                 this.saveToken(user, refreshedToken)
    //             })
    //             .catch(err => console.log(err, 'Unable to retrieve new token'))
    //     });
    // }

    // // 2. Save the Token in Firestore
    // /** Save the permission token in firestore*/
    // private saveToken(user, token): void {

    //     const currentTokens = user.fcmTokens || {}

    //     // If token does not exist in firestore, update db
    //     if (!currentTokens[token]) {
    //         const userRef = this._afs.collection('users').doc(user.uid)
    //         const tokens = { ...currentTokens, [token]: true }
    //         userRef.update({ fcmTokens: tokens })
    //     }
    // }

    // // 3. Receive Messages in Angular
    // // used to show message when app is open
    // receiveMessages() {
    //     this._fcMessaging.onMessage(payload => {
    //         console.log('Message received. ', payload);
    //         this.messageSource.next(payload)
    //     });
    // }

    // // 4. Delete token from service
    // async deleteToken() {
    //     await this._fcMessaging.getToken()
    //         .then(async token => await this._fcMessaging.deleteToken(token));
    // }
}