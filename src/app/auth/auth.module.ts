import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../components/components.module';

import { LoginPage } from './login/login.page';
import { SignupPage } from './signup/signup.page';
import { ProfilePage } from './profile/profile.page';
import { ForgotPasswordPage } from './forgot-password/forgot-password.page';
import { AuthRoutingModule } from './auth-routing.module';
import { TermsOfServicePage } from './terms-of-service/terms-of-service.page';
import { PrivacyPolicyPage } from './privacy-policy/privacy-policy.page';

@NgModule({
  // Modules who has required set of functionality (i.e. nessary components, services, directives own by the module) 
  // which is required by this modules own components need to mention in 'imports' array.
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    AuthRoutingModule,
    ComponentsModule,
  ],

  // The components which will are accessible outside this module when this module  gets imported
  exports: [
    LoginPage,
    ProfilePage,
    SignupPage,
    ForgotPasswordPage,
  ],

  // Declared components which are owned by this module.
  declarations: [TermsOfServicePage, PrivacyPolicyPage, LoginPage, ProfilePage, SignupPage, ForgotPasswordPage]
})
export class AuthModule { }

export { AuthService } from './auth.service';
// export * from './auth.guard';