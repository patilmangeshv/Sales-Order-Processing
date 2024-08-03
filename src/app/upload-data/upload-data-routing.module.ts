import { NgModule, Component } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { UploadDataPage } from './upload-data/upload-data.page';

const routes: Routes = [
  { path: '', redirectTo: 'data', pathMatch: 'full' },
  {
    path: 'data',
    component: UploadDataPage
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UploadDataRoutingModule { }
