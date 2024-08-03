import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ModalController } from '@ionic/angular';

import { CommonService } from '../../shared/common.service';
import { UserDealerListPage } from '../user-dealer-list/user-dealer-list.page';
import { TrackStaticDataCache } from '../../dealer/model/dealer';
import { DealerService } from '../../dealer/dealer.service';
import { LocalDataStorage } from '../../utils/utilities';

@Component({
    selector: 'app-dealer-name-strip',
    templateUrl: './dealer-name-strip.component.html',
})
export class DealerNameStripComponent {
    @Input('isDataLoaded') _isDataLoaded = false;
    @Input('allowDealerChange') _allowDealerChange = true;
    /**Event raised to notify that the User has changed the dealer.*/
    @Output() public dealerChanged = new EventEmitter();

    constructor(
        public commonData: CommonService,
        private _modalCtrl: ModalController,
        private _dealerService: DealerService,
    ) { }

    /**Show dialog box to select dealer from the available dealer to the logged in user.
     * Once user selects the dealer, it will be updated in commonData.dealer for the rest of the application use.
     * below cases:
     * 1. User presses escape to cancel the selection. In this case the last selected dealer will remain active.
     * 2. User selects one of the dealer from the list. In this case the selected dealer will be set as the current dealer.
     * 3. User is forced to select a dealer if there is no dealer current dealer. If user doesn't want select the current dealer, 
     * then he will be forced to loggout from the app.
     * */
    async showUserDealerList() {
        if (this._allowDealerChange) {
            // show the dealer list for the selection
            const modal = await this._modalCtrl.create({
                component: UserDealerListPage,
                // keyboardClose: true,
                // componentProps: { orderItems, favoriteItemStockPriceReferences }
            });
            await modal.present();
            // Get returned data
            const { data } = await modal.onWillDismiss();

            if (data) {
                // Set selected dealer as current dealer if it is not already current dealer
                if (this.commonData.dealer?.dealerID !== data?.dealerID) {
                    this.setDealerAsCurrentDealer(data.dealerCode);
                }
            }
        }

        return Promise.resolve();
    }

    private setDealerAsCurrentDealer(dealerCode: string) {
        this._dealerService.getDealerDetails(dealerCode).valueChanges()
            .forEach(async dealers => {
                for (const dealer of dealers) {
                    this.commonData.dealer = dealer;

                    await LocalDataStorage.setObject("dealerCode", dealer.dealerCode);
                    TrackStaticDataCache.initialize();
                    this._dealerService.trackVersionOfStaticData(this.commonData.dealer.dealerID);
                }
                // Notify the dealer is changed
                this.dealerChanged.emit();
                Promise.resolve();
            });
    }
}
