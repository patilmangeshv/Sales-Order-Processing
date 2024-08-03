import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../components/components.module';
import { UploadDataRoutingModule } from './upload-data-routing.module';
import { UploadDataPage } from './upload-data/upload-data.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    UploadDataRoutingModule,
    ComponentsModule,
  ],
  declarations: [UploadDataPage]
})
export class UploadDataModule { }
