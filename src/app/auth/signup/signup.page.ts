import { Component } from '@angular/core';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalController, MenuController, IonRouterOutlet } from '@ionic/angular';

import { AuthService } from "../auth.service";
import { Utilities } from '../../utils/utilities';

import { TermsOfServicePage } from '../terms-of-service/terms-of-service.page';
import { PrivacyPolicyPage } from '../privacy-policy/privacy-policy.page';
import { PasswordValidator } from '../../validators/password.validator';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: [
    './styles/signup.page.scss'
  ]
})
export class SignupPage {
  signupForm: FormGroup;
  matching_passwords_group: FormGroup;

  validation_messages = {
    'email': [
      { type: 'required', message: 'Email is required.' },
      { type: 'pattern', message: 'Enter a valid email.' }
    ],
    'password': [
      { type: 'required', message: 'Password is required.' },
      { type: 'minlength', message: 'Password must be at least 5 characters long.' }
    ],
    'confirm_password': [
      { type: 'required', message: 'Confirm password is required' }
    ],
    'matching_passwords': [
      { type: 'areNotEqual', message: 'Password mismatch' }
    ]
  };

  constructor(
    private _AuthService: AuthService,
    private _router: Router,
    private _modalController: ModalController,
    private _menu: MenuController,
    private _routerOutlet: IonRouterOutlet
  ) {
    // separate form for matching passwords
    this.matching_passwords_group = new FormGroup({
      'password': new FormControl('', Validators.compose([
        Validators.minLength(5),
        Validators.required
      ])),
      'confirm_password': new FormControl('', Validators.required)
    }, (formGroup: FormGroup) => {
      return PasswordValidator.areNotEqual(formGroup);
    });

    // form to validate email and passwords
    this.signupForm = new FormGroup({
      'email': new FormControl('', Validators.compose([
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$')
      ])),
      'matching_passwords': this.matching_passwords_group
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

  // async showTermsModal() {
  //   const modal = await this.modalController.create({
  //     component: TermsOfServicePage,
  //     swipeToClose: true,
  //     presentingElement: this.routerOutlet.nativeEl
  //   });
  //   return await modal.present();
  // }

  // async showPrivacyModal() {
  //   const modal = await this.modalController.create({
  //     component: PrivacyPolicyPage,
  //     swipeToClose: true,
  //     presentingElement: this.routerOutlet.nativeEl
  //   });
  //   return await modal.present();
  // }

  async doSignup() {
    try {
      await Utilities.showLoadingCtrl("Signing up. Please wait...");
      await this._AuthService.signup(this.signupForm.controls.email.value, this.matching_passwords_group.controls.password.value);

      // NOTE: once user successfully signsup he becomes logged in user.
      // Hence forecfully logout that and redirect to the login page.
      await this._AuthService.logoutUser();

      await Utilities.hideLoadingCtrl()
      await Utilities.presentToast("Sign up successful. Please login to sign in.", "Sign up");

      // navigate to login after successful
      await this._router.navigateByUrl("/auth/login");
    } catch (singnUpError) {
      await Utilities.hideLoadingCtrl();
      await Utilities.showAlert(singnUpError, "Sign up error");
    }
  }

  async showTermsModal() {
    const modal = await this._modalController.create({
      component: TermsOfServicePage,
      swipeToClose: true,
      presentingElement: this._routerOutlet.nativeEl
    });
    return await modal.present();
  }

  async showPrivacyModal() {
    const modal = await this._modalController.create({
      component: PrivacyPolicyPage,
      swipeToClose: true,
      presentingElement: this._routerOutlet.nativeEl
    });
    return await modal.present();
  }

  /*
  doFacebookSignup(): void {
    console.log('facebook signup');
    this.router.navigate(['app/categories']);
  }

  doGoogleSignup(): void {
    console.log('google signup');
    this.router.navigate(['app/categories']);
  }

  doTwitterSignup(): void {
    console.log('twitter signup');
    this.router.navigate(['app/categories']);
  }
  */
}
