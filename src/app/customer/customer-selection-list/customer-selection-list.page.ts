import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ModalController } from '@ionic/angular';

import * as firebase from "firebase/app"
// Add the Performance Monitoring library
import "firebase/performance";

import { CustomerDetails } from '../model/customerDetails';
import { CustomerService } from '../customer.service';
import { LocalCachingService } from '../../shared/local-caching.service';
import { CommonService } from '../../shared/common.service';

@Component({
    selector: 'app-customer-selection-list',
    templateUrl: 'customer-selection-list.page.html',
})
export class CustomerSelectionListPage implements OnInit, OnDestroy {
    public isDataLoaded: boolean = false;
    public _customerList: Array<CustomerDetails>;
    public _customerListWOFilter: Array<CustomerDetails>;
    private _customerSelected: CustomerDetails;

    public searchText: string;
    public recordCount: number = 0;

    private _traceCustomerList: firebase.performance.Trace;

    constructor(
        private commonData: CommonService,
        private _customerService: CustomerService,
        private _localCachingService: LocalCachingService,
        private _modalCtrl: ModalController,
    ) {
        // Initialize Performance Monitoring and get a reference to the service
        const perf = firebase.performance();
        this._traceCustomerList = perf.trace("fetch_traceCustomerList");
    }

    ngOnInit() {
        // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
        const modalState = {
            modal: true,
            desc: 'fake state for our modal'
        };
        history.pushState(modalState, null);

        this.searchText = '';
        this.fetchData();
    }

    ngOnDestroy() {
        // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
        // ngDestroy() method
        if (window.history.state.modal) {
            history.back();
        }
    }

    filterDataOnSearchText(ev: any) {
        // Search will be done against lower case to achieve case insensitive search.
        this.searchText = ev.target.value.trim().toLowerCase();

        // Call fetch method to filter serach text
        this.applyFilterOfSearchText();
    }

    /**Apply Search Text filter on the customer list for the Customer Name.*/
    applyFilterOfSearchText(): void {
        if (this.searchText === '') {
            // No search text, hence copy WithOutFilter Customers
            this._customerList = this._customerListWOFilter;
        } else {
            // Clear the list
            this._customerList = new Array<CustomerDetails>();

            this._customerListWOFilter.forEach(customer => {
                // search text in customerName, externalCode, externalCode1, externalCode2, mobileNo, pincode.
                if (customer.tags.toLowerCase().match(this.searchText)) {
                    // Add matching customer
                    this._customerList.push(customer);
                }
            });
        }
        this.recordCount = this._customerList.length;
    }

    async fetchData(): Promise<void> {
        this._traceCustomerList.start();
        this._customerListWOFilter = await this._localCachingService.customerList();
        this._traceCustomerList.stop();

        this.recordCount = this._customerListWOFilter.length;
        // Refresh the list based on the Search Text
        this.applyFilterOfSearchText();

        // set flag that the data is loaded
        this.isDataLoaded = true;
    }

    async doRefresh(event) {
        // await this.createData();
        await this.fetchData();

        setTimeout(() => {
            event.target.complete();
        }, 50);
    }

    customerSelected(customer: CustomerDetails) {
        this._modalCtrl.dismiss(customer);
    }

    // Dismiss the Pop-up when the back button is pressed
    @HostListener('window:popstate', ['$event'])
    dismiss(): void {
        this._modalCtrl.dismiss();
    }

    async saveClicked() {
        this._modalCtrl.dismiss(this._customerSelected);
    }
}