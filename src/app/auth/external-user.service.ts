import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';

import { ExternalUser } from './model/external-user';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExternalUserService {
  constructor(
    private _ngFirestore: AngularFirestore,
    private _authService: AuthService,
  ) { }

  /**
   * Upload multiple external users to the database.
   * @param users Array of ExternalUser.
   */
  public async uploadExternalUsers(users: ExternalUser[]): Promise<void> {
    let i = 0;
    users.forEach(async user => {
      // if (i > 100) {
      //     return;
      // }
      // i++;

      await this.createExternalUser(user);
    });
  }

  private async createExternalUser(data: ExternalUser) {
    try {
      const externalUserID: string = this._ngFirestore.createId();

      return this._ngFirestore.doc(`/externalUser/${externalUserID}`)
        .set({
          externalUserID: externalUserID,
          userProfileID: data.userProfileID,
          email: data.email,
          systemDate: firebase.firestore.FieldValue.serverTimestamp(),
          userID: this._authService.loggedInFirebaseUser.uid,
          // convert custom class to object as firebase does not understand custom classes.
          externalUserData: Object.assign({}, data.externalUserData),
        });
    } catch (error) {
      console.error(error);
      throw new Error("Error occured while saving external user: {0}. Error: {1}.".format(data.email, error));
    }
  }
}
