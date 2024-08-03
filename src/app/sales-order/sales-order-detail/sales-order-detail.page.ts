import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';

import { CommonService } from '../../shared/common.service';
import { SalesOrder, SalesOrderItems } from '../model/sales-order';
import { SalesOrderService } from '../../sales-order/sales-order.service';
import { OrderItemData } from 'src/app/item/model/item';

@Component({
  selector: 'app-sales-order-detail',
  templateUrl: 'sales-order-detail.page.html',
  styleUrls: ['./styles/forms-validations.page.scss'],
})
export class SalesOrderDetailPage implements OnInit, OnDestroy {
  public salesOrder: SalesOrder;
  public salesOrderItems: SalesOrderItems;

  constructor(
    public commonData: CommonService,
    private _salesOrderService: SalesOrderService,
    private _modalCtrl: ModalController,
    private _navParams: NavParams,
  ) {
    this.salesOrder = this._navParams.get('salesOrder');
  }

  async ngOnInit() {
    // push a "fake" state for our modal in the history when it's displayed, that way the popState event will just get rid of that fake state. 
    const modalState = {
      modal: true,
      desc: 'fake state for our modal'
    };
    history.pushState(modalState, null);

    await this.getSalesOrderDetail();
  }

  ngOnDestroy() {
    // manually cleanup the history in this case. So let's use our modal to remove the last state if needed when we dismiss our modal in the
    // ngDestroy() method
    if (window.history.state.modal) {
      history.back();
    }
  }

  private async getSalesOrderDetail() {
    if (this.salesOrder) {
      await this._salesOrderService.getSalesOrderDetail(this.salesOrder.salesOrderID)
        .then((salesOrderDetail) => {
          this.salesOrderItems = new SalesOrderItems();
          this.salesOrderItems.orderItems = new Array<OrderItemData>();

          salesOrderDetail.forEach(rowOrder => {
            for (const index in rowOrder.orderItems) {
              const orderItem:OrderItemData = Object.assign({}, rowOrder.orderItems[index]);

              this.salesOrderItems.orderItems.push(orderItem);
            }
          });
        });
    }
  }

  // Dismiss the Pop-up when the back button is pressed
  @HostListener('window:popstate', ['$event'])
  closeClicked() {
    this._modalCtrl.dismiss();
  }
}
