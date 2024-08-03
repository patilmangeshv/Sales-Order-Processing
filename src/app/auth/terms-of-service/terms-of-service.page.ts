import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-terms-of-service-page',
  templateUrl: 'terms-of-service.page.html',
  styleUrls: [
    './styles/terms-of-service.page.scss'
  ]
})

export class TermsOfServicePage implements OnInit, OnDestroy {

  constructor(private modalController: ModalController) { }

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

  // Dismiss the Pop-up when the back button is pressed
  @HostListener('window:popstate', ['$event'])
  dismiss(): void {
    this.modalController.dismiss();
  }
}
