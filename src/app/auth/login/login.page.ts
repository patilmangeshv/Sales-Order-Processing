import { Component, OnInit } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MenuController } from '@ionic/angular';

import { AuthService } from "../auth.service";
import { Utilities, LocalDataStorage } from '../../utils/utilities';
import { CommonService } from '../../shared/common.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: [
    './styles/login.page.scss'
  ]
})
export class LoginPage implements OnInit {
  public loginForm: FormGroup;
  private _returnURL: string;

  validation_messages = {
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Enter a valid email.' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 5 characters long.' }
    ]
  };

  constructor(
    public _commonData: CommonService,
    private _router: Router,
    private _route: ActivatedRoute,
    private _menu: MenuController,
    private _authService: AuthService,
  ) {
    this.loginForm = new FormGroup({
      'email': new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      'password': new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required
      ]))
    });
  }

  async ngOnInit() {
    this._returnURL = await LocalDataStorage.getItem("returnURL") || "/home";
  }

  // Disable side menu for this page
  async ionViewDidEnter() {
    await this._menu.enable(false);
  }

  // Restore to default when leaving this page
  async ionViewDidLeave() {
    await this._menu.enable(true);
  }

  async doLogin(): Promise<void> {
    if (this.loginForm.valid) {
      try {
        Utilities.showLoadingCtrl("Logging in. Please wait...");

        this._authService.login(this.loginForm.controls.email.value, this.loginForm.controls.password.value)
          .then(async () => {
            await Utilities.hideLoadingCtrl();
            await this._router.navigateByUrl(this._returnURL, { replaceUrl: true });
          })
          .catch(async (singnInError) => {
            await Utilities.hideLoadingCtrl();
            await Utilities.showAlert(singnInError, "Login");
          });
      } catch (error) {
        await Utilities.hideLoadingCtrl();
        await Utilities.showAlert(error, "Login");
      }
    }
  }

  async doGuestLogin() {
    try {
      Utilities.showLoadingCtrl("Logging in. Please wait...");

      this._authService.guestLogin()
        .then(async () => {
          await Utilities.hideLoadingCtrl();
          await this._router.navigateByUrl(this._returnURL, { replaceUrl: true });
        })
        .catch(async (singnInError) => {
          await Utilities.hideLoadingCtrl();
          await Utilities.showAlert(singnInError, "Login")
        });
    } catch (error) {
      await Utilities.hideLoadingCtrl();
      await Utilities.showAlert(error, "Login");
    }
  }

  /*
  doFacebookLogin(): void {
    console.log('facebook login');
    this._router.navigate(['app/categories']);
  }

  doGoogleLogin(): void {
    console.log('google login');
    this._router.navigate(['app/categories']);
  }

  doTwitterLogin(): void {
    console.log('twitter login');
    this._router.navigate(['app/categories']);
  }
  */
}
