import { Component } from '@angular/core';
import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import * as firebase from "firebase/app"
// Add the Performance Monitoring library
import "firebase/performance";

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Utilities } from '../app/utils/utilities';

import { CommonService } from '../app/shared/common.service';
import { AuthService } from '../app/auth/auth.module';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss',
    // './side-menu/styles/side-menu.scss',
    './side-menu/styles/side-menu.shell.scss',
    './side-menu/styles/side-menu.responsive.scss'
  ]
})
export class AppComponent {
  public currentLoggedinUser: firebase.User;

  /**Available pages to build and check permissions to the roles.
   * accessibleToRoles: "admin" will have all access to all menus,
   *                    "empty" means accessible to all, 
   *                    "specific roles" will have access to these roles only.
  */
  public appPages = [
    {
      title: 'Place order',
      url: '/home',
      icon: 'receipt',
      accessibleToRoles: []
    },
    {
      title: 'Order list',
      url: '/sales-order-list',
      icon: 'newspaper',
      accessibleToRoles: []
    },
    {
      title: 'Purchase order',
      url: '/purchase-order',
      icon: 'newspaper',
      accessibleToRoles: ["admin", "dealer", "manager"]
    },
    // {
    //   title: 'Item stock & price',
    //   url: '/items/item-stock-price-list',
    //   icon: 'swap-vertical',
    //   accessibleToRoles: ["admin", "dealer1", "manager1", "operator1"]
    // },
    {
      title: 'Item list',
      url: '/items',
      icon: 'list',
      accessibleToRoles: ["admin", "dealer", "manager", "operator"]
    },
    {
      title: 'Pincode list',
      url: '/pincodes',
      icon: 'list',
      accessibleToRoles: ["admin", "dealer1", "manager1", "operator1"]
    },
    {
      title: 'Dealer list',
      url: '/dealers',
      icon: 'list',
      accessibleToRoles: ["admin"]
    },
    {
      title: 'Upload data',
      url: '/upload-data/data',
      icon: 'cloud-upload',
      accessibleToRoles: ["admin", "dealer1", "manager1"]
    },
    {
      title: 'Profile',
      url: '/auth/profile',
      icon: 'person',
      accessibleToRoles: ["admin"]
    },
  ];

  constructor(
    public commonData: CommonService,
    public authService: AuthService,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private _alertCtrl: AlertController,
    private _loadingCtrl: LoadingController,
    private _toastCtrl: ToastController,
    private _storage: AngularFireStorage,
    private _router: Router,
  ) {
    this.initializeApp();
    // Initialize Performance Monitoring and get a reference to the service
    const perf = firebase.performance();

    // This is to initialise the Utilities class with alertCtrl,loadingCtrl,toastCtrl
    const init: Utilities = new Utilities(this._alertCtrl, this._loadingCtrl, this._toastCtrl, this._storage);
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  public async logoutClicked() {
    await this.authService.logoutUser();
    await this._router.navigateByUrl("/auth");
    // await this._router.navigate(["/auth"], { replaceUrl: true });
  }
}
