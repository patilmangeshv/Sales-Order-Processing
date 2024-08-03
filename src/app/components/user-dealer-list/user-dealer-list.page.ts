import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { Dealer } from '../../dealer/model/dealer';
import { AuthService } from '../../auth/auth.module';
import { DealerService } from '../../dealer/dealer.service';

@Component({
    selector: 'user-dealer-list',
    templateUrl: 'user-dealer-list.page.html',
})
export class UserDealerListPage implements OnInit, OnDestroy {
    public isDataLoaded: boolean = false;
    public _dealerList: Array<Dealer>;

    constructor(
        private _authService: AuthService,
        private _dealerService: DealerService,
        private _modalCtrl: ModalController,
    ) { }

    async ngOnInit() {
        // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
        const modalState = {
            modal: true,
            desc: 'fake state for our modal'
        };
        history.pushState(modalState, null);

        await this.fetchData();
    }

    ngOnDestroy() {
        // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
        // ngDestroy() method
        if (window.history.state.modal) {
            history.back();
        }
    }

    async fetchData(): Promise<void> {
        this._dealerList = await this._dealerService.userDealerList(this._authService.loggedInUser);

        // set flag that the data is loaded
        this.isDataLoaded = true;
    }

    async dealerSelected(dealer: Dealer) {
        if (dealer) {
            this._modalCtrl.dismiss(dealer);
            // } else if (!this._commonData.dealer) {
            //     // There is no current dealer hence force user to select a dealer else ask to logout.
            //     const rtn = await Utilities.presentAlertConfirm("There is no dealer selected, you must select one dealer to continue.", "Dealer selection", "Cancel will forced to logout!")
        }
    }

    // Dismiss the Pop-up when the back button is pressed
    @HostListener('window:popstate', ['$event'])
    async dismiss(): Promise<void> {
        this._modalCtrl.dismiss();
    }

    // async logoutClicked() {
    //     this._modalCtrl.dismiss();
    // }
}