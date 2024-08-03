import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ModalController, NavParams } from '@ionic/angular';

import { ItemsService } from '../item.service';

@Component({
    templateUrl: './item-stock-price-edit.page.html',
    // styleUrls: ['./iitem-stock-price-edit.page.scss'],
})
export class ItemStockPriceEditPage implements OnInit, OnDestroy {
    public editItemForm: FormGroup;

    public validationMessages = {
        eventOrderNo: [
            { type: 'required', message: 'You need to enter the Order number.' },
            { type: 'min', message: 'Order number should be greater than zero.' },
            { type: 'max', message: 'Order number should be within 100.' },
        ]
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private _itemsService: ItemsService,
        private formBuilder: FormBuilder,
        private _modalCtrl: ModalController,
    ) {
        this.editItemForm = this.formBuilder.group({
            id: [null],
            eventOrderNo: [1, Validators.compose([Validators.required, Validators.min(1), Validators.max(100)])],
        });
    }

    ngOnInit() {
        // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
        const modalState = {
            modal: true,
            desc: 'fake state for our modal'
        };
        history.pushState(modalState, null);
    }

    ngOnDestroy() {
        // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
        // ngDestroy() method
        if (window.history.state.modal) {
            history.back();
        }
    }

    saveClicked() {

    }

    deleteClicked() {

    }
    // Dismiss the Pop-up when the back button is pressed
    @HostListener('window:popstate', ['$event'])
    goToItemList() {
        this._modalCtrl.dismiss()
    }
}