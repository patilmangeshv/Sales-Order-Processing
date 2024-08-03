import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ShellModule } from '../shell/shell.module';

import { CheckboxWrapperComponent } from './checkbox-wrapper/checkbox-wrapper.component';
import { ShowHidePasswordComponent } from './show-hide-password/show-hide-password.component';
import { CountdownTimerComponent } from './countdown-timer/countdown-timer.component';
import { CounterInputComponent } from './counter-input/counter-input.component';
import { RatingInputComponent } from './rating-input/rating-input.component';
import { DealerNameStripComponent } from './dealer-name-strip/dealer-name-strip.component';
import { UserDealerListPage } from './user-dealer-list/user-dealer-list.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ShellModule,
    IonicModule
  ],
  declarations: [
    CheckboxWrapperComponent,
    ShowHidePasswordComponent,
    CountdownTimerComponent,
    CounterInputComponent,
    RatingInputComponent,
    DealerNameStripComponent,
    UserDealerListPage,
  ],
  exports: [
    ShellModule,
    CheckboxWrapperComponent,
    ShowHidePasswordComponent,
    CountdownTimerComponent,
    CounterInputComponent,
    RatingInputComponent,
    DealerNameStripComponent,
  ]
})
export class ComponentsModule { }
export { DealerNameStripComponent } from './dealer-name-strip/dealer-name-strip.component';
