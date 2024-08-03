import { Component } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';

import { AuthService } from "../auth.service";
import { Utilities } from '../../utils/utilities';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: [
    './styles/forgot-password.page.scss'
  ]
})
export class ForgotPasswordPage {
  forgotPasswordForm: FormGroup;

  validation_messages = {
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Enter a valid email.' }
    ]
  };

  constructor(
    private _router: Router,
    private _menu: MenuController,
    private _AuthService: AuthService,
  ) {
    this.forgotPasswordForm = new FormGroup({
      'email': new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ]))
    });
  }

  // Disable side menu for this page
  async ionViewDidEnter() {
    await this._menu.enable(false);
  }

  // Restore to default when leaving this page
  async ionViewDidLeave() {
    await this._menu.enable(true);
  }

  async recoverPassword() {
    try {
      if (this.forgotPasswordForm.valid) {
        await Utilities.showLoadingCtrl("Sending reset password link to the email id. Please wait...");

        await this._AuthService.resetPassword(this.forgotPasswordForm.controls.email.value);
        await Utilities.hideLoadingCtrl()
        await Utilities.presentToast("Reset password link sent to the email.", "Forgot password");

        // navigate to login after successful
        await this._router.navigateByUrl("/auth/login");
      }
    } catch (error) {
      await Utilities.hideLoadingCtrl();
      await Utilities.showAlert(error, "Error");
    }
  }
}
