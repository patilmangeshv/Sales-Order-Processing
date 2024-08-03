import { Injectable } from '@angular/core';

import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  public userProfile: firebase.firestore.DocumentReference;
  public currentUser: firebase.User;

  constructor(private _ngFirestore: AngularFirestore) { }

  // async getUserProfile(): Promise<firebase.firestore.DocumentSnapshot> {
  //   const user: firebase.User = await this.authService.getUser().toPromise();
  //   this.currentUser = user;
  //   this.userProfile = firebase.firestore().doc(`userProfile/${user.uid}`);
  //   return this.userProfile.get();
  // }

  updateName(firstName: string, lastName: string): Promise<void> {
    return this.userProfile.set({ firstName, lastName }, { merge: true });
  }

  updateDOB(birthDate: string): Promise<void> {
    return this.userProfile.set({ birthDate }, { merge: true });
  }

  async updateEmail(newEmail: string, password: string): Promise<void> {
    try {
      // create a credential object which Firebase uses this for authentication.
      const credential: firebase.auth.AuthCredential = firebase.auth.EmailAuthProvider.credential(
        this.currentUser.email,
        password
      );

      // first authenticate the user with old password, if successful then only update the new email id.
      await this.currentUser.reauthenticateWithCredential(credential);
      // update email to firebase
      await this.currentUser.updateEmail(newEmail);
      // update email to user profile document
      return this.userProfile.set({ email: newEmail }, { merge: true });
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Updates user's allowedAreas. User is allowed to place the orders for the areas listed here. 
   * If allowedAreas is null then all areas are allowed to the user.
   * @param dealerID 
   * @param email 
   * @param allowedAreas 
   */
  public async updateUserProfileAreas(dealerID: string, email: string, allowedAreas: string[]) {
    try {
      await this._ngFirestore.collection('userProfile').ref
        .where("email", "==", email)
        .get()
        .then(data =>
          data.forEach(async (profileRecord) => {
            let dealerFound = false;
            let dealerUserMappingInfo = profileRecord.data().dealerUserMappingInfo;
            // look for the matching dealer, if found then overwrite the allowedAreas else ignore.
            dealerUserMappingInfo.forEach((dealerInfo: { dealerID: string; allowedAreas: string[]; }) => {
              if (dealerInfo.dealerID == dealerID) {
                // overwrite the allowedAreas
                dealerInfo.allowedAreas = allowedAreas;
                dealerFound = true;
              }
            });
            if (dealerFound) {
              await this._ngFirestore.doc(`/userProfile/${profileRecord.id}`)
                .set({
                  dealerUserMappingInfo: dealerUserMappingInfo,
                }, { merge: true }).catch(error => { throw error });
            }
          }));
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(
    newPassword: string,
    oldPassword: string
  ): Promise<void> {
    try {
      // create a credential object which Firebase uses this for authentication.
      const credential: firebase.auth.AuthCredential = firebase.auth.EmailAuthProvider.credential(
        this.currentUser.email,
        oldPassword
      );

      // first authenticate the user with old password, if successful then only update the new email id.
      await this.currentUser.reauthenticateWithCredential(credential);
      // update password to firebase
      return this.currentUser.updatePassword(newPassword);
    } catch (error) {
      console.error(error);
    }
  }
}
