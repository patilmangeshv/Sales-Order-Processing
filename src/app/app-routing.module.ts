import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../app/auth/auth.guard'
import { AngularFireAuthGuard, hasCustomClaim, redirectUnauthorizedTo, redirectLoggedInTo } from '@angular/fire/auth-guard';

const adminOnly = () => hasCustomClaim('admin');
const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['home']);
const belongsToAccount = (next) => hasCustomClaim(`account-${next.params.id}`);

// https://github.com/angular/angularfire/blob/master/docs/auth/router-guards.md

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    // canActivate: [AuthGuard]
    //canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  {
    path: 'home/:dealerCode',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    // canActivate: [AuthGuard]
    //canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin }
  },
  {
    path: 'items',
    loadChildren: () => import('./item/item.module').then(m => m.ItemModule)
  },
  {
    path: 'sales-order-list',
    loadChildren: () => import('./sales-order/sales-order.module').then(m => m.SalesOrderModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'purchase-order',
    loadChildren: () => import('./purchase-order/purchase-order.module').then(m => m.PurchaseOrderModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'upload-data',
    loadChildren: () => import('./upload-data/upload-data.module').then(m => m.UploadDataModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule),
    // canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectLoggedInToHome }
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    // RouterModule.forRoot(routes, { enableTracing: true, preloadingStrategy: PreloadAllModules })
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
