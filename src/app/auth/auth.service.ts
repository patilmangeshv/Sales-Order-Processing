import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { Roles } from "./model/roles";
import { UserProfile } from "./model/userProfile";
import { FCMessagingService } from '../shared/fcMessaging.service';
import { Utilities } from '../utils/utilities';
import { ExternalUserData } from './model/external-user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**Currently logged in system user.*/
  public loggedInUser: UserProfile;
  /**Currently logged in firebase user.*/
  public loggedInFirebaseUser: firebase.User;

  constructor(
    private afAuth: AngularFireAuth,
    private firestore: AngularFirestore,
    private _FCMessagingService: FCMessagingService,
  ) {
    this.afAuth.onAuthStateChanged(((user) => {
      // if (user) {
      //   if (user.isAnonymous) {
      //     console.log("onAuthStateChanged - Anonymous user: " + user.uid);
      //   } else {
      //     console.log("onAuthStateChanged - Normal user: " + user.uid + ", email id: " + user.email);
      //   }
      // } else {
      //   console.log("onAuthStateChanged - User not logged in.")
      // }

      this.loggedInFirebaseUser = user;
      if (user) {
        if (user.isAnonymous) {
          // user is anonumous, so create a dummy logged in user.
          let userProfile = new UserProfile()
          userProfile.uid = user.uid;
          userProfile.isAnonymous = true;
          userProfile.email = null;
          userProfile.dealerUserMappingInfo = [];
          this.loggedInUser = userProfile;
        } else {
          // fetch user details from document
          this.firestore.doc<UserProfile>(`userProfile/${user.uid}`).valueChanges()
            .subscribe((user) => {
              this.loggedInUser = user;
            });
        }

        // register for firebase cloud messaging service.
        this._FCMessagingService.getPermission(user);
        this._FCMessagingService.monitorRefresh(user);
        this._FCMessagingService.receiveMessages();
      }
    }), (error) => {
      console.error("constructor.onAuthStateChanged - " + error);
    });
  }

  /**
   * Checks if user has the specified role.
   * @param dealerID
   * @param allowedRoles Role array to check.
   * @param user User for whom role needs to check if passed else considers logged in user.
   */
  public doesUserHasRole(dealerID: string, allowedRoles: string[], user?: UserProfile): boolean {
    // if user is not passed then consider loggedInUser
    if (!user) { user = this.loggedInUser };
    // if user is still null then return false
    if (user) {
      if (allowedRoles.length > 0) {
        // if user has the role then return true else false.
        const dealerMapInfo = user.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == dealerID);
        for (const role of allowedRoles) {
          if (dealerMapInfo && dealerMapInfo.roles[role]) {
            return true;
          }
        }
      } else {
        // if allowed roles are empty means option is allowed to all
        return true;
      }
    }

    return false;
  }

  /**
   * Verifies if the user is associated with speficied dealerID by scanning user.dealerIDs property.
   * @param dealerID Current dealer ID.
   * @param user User object if specified else the loggedInUser will be considered.
   */
  public doesUserAssociatedWithThisDealer(dealerID: string, user?: UserProfile): boolean {
    // if user is not passed then consider loggedInUser
    if (!user) { user = this.loggedInUser };
    // if user is still null then return false
    if (user) {
      // if no dealerUserMappingInfo then user is not associated with any dealer, return false
      // if dealerUserMappingInfo has null dealerID means user has access to all dealer
      if (user.dealerUserMappingInfo && user.dealerUserMappingInfo.length > 0) {
        if (user.dealerUserMappingInfo[0].dealerID == null) {
          return true;
        } else {
          // user has specific dealer access then check if it is a current dealer then retun true else return false
          if (user.dealerUserMappingInfo.find(dealerInfo => dealerInfo.dealerID == dealerID)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // getUser(): firebase.User {
  //   this.afAuth.authState
  //     .subscribe(async user => {
  //       if (user) {
  //         if (user.isAnonymous) {
  //           console.log("authState - Anonymous user: " + user.uid);
  //         } else {
  //           console.log("authState - Normal user: " + user.uid + ", email id: " + user.email);
  //         }
  //       } else {
  //         console.log("authState - User not logged in.")
  //       }

  //       this.loggedInFirebaseUser = user;
  //       if (user) {
  //         if (user.isAnonymous) {
  //           this.loggedInUser = { uid: user.uid, isAnonymous: true, email: null, roles: { } };
  //         } else {
  //           await this.firestore.doc<UserProfile>(`userProfile/${user.uid}`).valueChanges().subscribe((user) => {
  //             this.loggedInUser = user;
  //           });
  //         }
  //       }

  //       return user;
  //     });
  //   return null;
  //   // return this.afAuth.authState;
  // }

  // getUserInfo(): Promise<firebase.User> {
  //   return this.afAuth.onAuthStateChanged;
  //   // this.afAuth.onAuthStateChanged((user: firebase.User) => {
  //   //    Promise.resolve(user);
  //   // });
  // }

  login(email: string, password: string): Promise<firebase.auth.UserCredential> {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  guestLogin(): Promise<firebase.auth.UserCredential> {
    return this.afAuth.signInAnonymously();
  }

  async signup(email: string, password: string): Promise<firebase.auth.UserCredential> {
    try {
      // check if user is already logged in as anonymous
      const loggedInUser: firebase.User = (await this.afAuth.currentUser)
      let newUserCredential: firebase.auth.UserCredential;

      if (loggedInUser && loggedInUser.isAnonymous) {
        // 1. user is logged in as anonymous, so link him with provided email and password
        const emailCredential = firebase.auth.EmailAuthProvider.credential(email, password);
        newUserCredential = await loggedInUser.linkWithCredential(emailCredential);
        // console.log("anonymous user-" + loggedInUser.uid);
      } else {
        // 2. user is not logged in, so create new credentials using provided email and password
        newUserCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
        // console.log("new user-" + newUserCredential.user.uid);
      }

      let dealerUserMappingInfo = new Array<ExternalUserData>();
      dealerUserMappingInfo.push({ dealerID: null, dealerCode: null, userName: null, roles: { customer: true } });
      await this.firestore
        .doc(`userProfile/${newUserCredential.user.uid}`)
        .set({
          uid: newUserCredential.user.uid,
          email: email,
          dealerUserMappingInfo: dealerUserMappingInfo,
        });

      return newUserCredential;
    } catch (error) {
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string) {
    var signInMethods = await this.afAuth.fetchSignInMethodsForEmail(email);
    // (1) ['password']
    // if it has any methods means user is already registered and don't need to send password reset link again.
    if (signInMethods && signInMethods.length > 0) {
      return;
    } else {
      return this.afAuth.sendPasswordResetEmail(email);
    }
  }

  /**Adds user in the userProfile document and registers with firebase. */
  async addUserProfile(email: string, dealerIDs: string[], roles: Roles): Promise<firebase.auth.UserCredential> {
    return new Promise(async (resolve, reject) => {
      try {
        let newUserCredential: firebase.auth.UserCredential;

        // 1. create new credentials using provided email and password
        newUserCredential = await this.afAuth.createUserWithEmailAndPassword(email, Utilities.getUID(7));
        // newUserCredential.user.displayName
        // newUserCredential.user.phoneNumber

        // 2. send password reset link so that the user can login by resetting password
        await this.afAuth.sendPasswordResetEmail(email);

        // 3. add user to the userProfile document
        let dealerUserMappingInfo = new Array<ExternalUserData>();
        dealerIDs.forEach(dealerID => {
          // MP Note: dealerCode needs to set correctly
          dealerUserMappingInfo.push({ dealerID: dealerID, dealerCode: 'dealerCode', userName: null, roles: roles });
        });
        await this.firestore
          .doc(`userProfile/${newUserCredential.user.uid}`)
          .set({
            uid: newUserCredential.user.uid,
            email: email,
            dealerUserMappingInfo: dealerUserMappingInfo,
          });

        resolve(newUserCredential);
      } catch (error) {
        reject(error);
      }
    });
  }

  resetPassword(email: string): Promise<void> {
    return this.afAuth.sendPasswordResetEmail(email);
  }

  logoutUser(): Promise<void> {
    return this.afAuth.signOut();
  }
}