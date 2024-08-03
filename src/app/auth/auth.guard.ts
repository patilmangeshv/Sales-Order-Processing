import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

//import * as firebase from 'firebase/app';
// import 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/auth';

import { LocalDataStorage } from '../utils/utilities';
import { AuthService } from '../auth/auth.module';
import { CommonService } from '../shared/common.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private _router: Router,
        private _afAuth: AngularFireAuth,
        private _commonData: CommonService,
        private _authService: AuthService) { }

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean | Observable<boolean> | Promise<boolean> {
        return new Promise((resolve, reject) => {
            // this.afAuth.onAuthStateChanged((user: firebase.User) => {
            this._afAuth.user.subscribe(async user => {
                if (user) {
                    let isValidDealer: boolean = false;
                    if (this._commonData.dealer && this._commonData.dealer.dealerCode) {
                        // only associated dealer can access the url
                        if (this._authService.doesUserAssociatedWithThisDealer(this._commonData.dealer.dealerID)) {
                            // remove the url
                            await LocalDataStorage.setItem("returnURL", "");
                            isValidDealer = true;
                            resolve(true);
                        }
                    }

                    if (!isValidDealer) {
                        await this._router.navigateByUrl("/");
                        resolve(false);
                    }
                } else {
                    if (state.url) {
                        // store the url. This needs to be done as the navigate by url does not accept two parameters.
                        await LocalDataStorage.setItem("returnURL", state.url);
                    }
                    await this._router.navigateByUrl("/auth/login");
                    resolve(false);
                }
            });
        });
    }
}
