import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ComponentsModule } from '../components/components.module';
import { CustomerSelectionListPage } from './customer-selection-list/customer-selection-list.page';
import { CustomerRoutingModule } from './customer-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CustomerRoutingModule,
    ComponentsModule,
  ],
  exports: [
    CustomerSelectionListPage,
  ],
  declarations: [CustomerSelectionListPage,
  ]
})
export class CustomerModule { }
export { CustomerSelectionListPage } from './customer-selection-list/customer-selection-list.page';
