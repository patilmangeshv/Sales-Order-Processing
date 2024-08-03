import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { LoginPage } from './login/login.page';
import { ForgotPasswordPage } from './forgot-password/forgot-password.page';
import { SignupPage } from './signup/signup.page';
import { ProfilePage } from './profile/profile.page';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    component: LoginPage,
  },
  {
    path: 'signup',
    component: SignupPage
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordPage
  },
  {
    path: 'profile',
    component: ProfilePage,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
