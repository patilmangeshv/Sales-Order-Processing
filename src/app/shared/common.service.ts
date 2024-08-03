import { Injectable } from '@angular/core';

import { Dealer } from '../dealer/model/dealer';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  public dealer: Dealer;
}
//   private _dealerID: string
//   private _dealerName: string;
//   private _dealerInstructions: string;
//   private _dealerCode : string;

//   // Gets dealer ID as specified by user.
//   public get dealerID(): string {
//     return this._dealerID;
//   }
//   public get dealerCode() : string {
//     return this._dealerCode;
//   }
//   public get dealerName(): string {
//     return this._dealerName;
//   }
//   public get dealerInstructions(): string {
//     return this._dealerInstructions;
//   }
//   */

//   private _dealer: Dealer;
//   public get dealer(): Dealer {
//     return this._dealer;
//   }

//   /**Get dealer code from storage.*/
//   public async getDealerCodeFromStorage(): Promise<string> {
//     return Promise.resolve(await LocalDataStorage.getItem("dealerCode"));
//   }

//   /**Set dealer object */
//   public async setDealer(value: Dealer) {
//     await LocalDataStorage.setItem("dealerCode", value ? value.dealerCode : null);

//     // Store local dealer details
//     this._dealer = value;

//     return Promise.resolve();
//   }
// }
