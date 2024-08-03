import { LoadingController, AlertController, ToastController } from '@ionic/angular';
import { Plugins } from '@capacitor/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';

const { Storage } = Plugins;

export class Utilities {
    private static _alertCtrl: AlertController;
    private static _loadingCtrl: LoadingController;
    private static _toastCtrl: ToastController;

    private static _ngStorage: AngularFireStorage;

    private static _loading: HTMLIonLoadingElement;
    private static _toast: HTMLIonToastElement;
    private static _alert: HTMLIonAlertElement;

    constructor(
        private alertCtrl: AlertController,
        private loadingCtrl: LoadingController,
        private toastCtrl: ToastController,
        private ngStorage: AngularFireStorage,
    ) {
        Utilities._alertCtrl = this.alertCtrl;
        Utilities._loadingCtrl = this.loadingCtrl;
        Utilities._toastCtrl = this.toastCtrl;

        Utilities._ngStorage = this.ngStorage;
    }
    static async presentToastWithOptions(message: string, header?: string, position?: "top" | "bottom" | "middle", closeButtonText?: string) {
        Utilities._toast = await Utilities._toastCtrl.create({
            message: message,
            header: header,
            // showCloseButton: true,
            animated: true,
            position: position || "top",
            keyboardClose: true,
            duration: 3000,
            // closeButtonText: closeButtonText || "Done"
        });
        Utilities._toast.present();
    }
    static async presentToastWithButtons() {
        const toast = await Utilities._toastCtrl.create({
            header: 'Toast header',
            message: 'Click to Close',
            position: 'top',
            buttons: [
                {
                    side: 'start',
                    icon: 'star',
                    text: 'Favorite',
                    handler: () => {
                        console.log('Favorite clicked');
                    }
                }, {
                    text: 'Done',
                    role: 'cancel',
                    handler: () => {
                        console.log('Cancel clicked');
                    }
                }
            ]
        });
        toast.present();
    }

    static async presentToastWithCloseButton(message: string, header?: string, position?: "top" | "bottom" | "middle", closeButtonText?: string) {
        Utilities._toast = await Utilities._toastCtrl.create({
            message: message,
            header: header,
            animated: true,
            position: position || "bottom",
            keyboardClose: true,
            buttons: [
                {
                    side: 'end',
                    // icon: 'star',
                    text: closeButtonText,
                    cssClass: 'toastCloseButton'
                    // handler: () => {
                    //     //console.log('Favorite clicked');
                    // }
                }
            ]
        });
        Utilities._toast.present();
    }

    static async presentToast(message: string, header?: string, position?: "top" | "bottom" | "middle", closeButtonText?: string) {
        Utilities._toast = await Utilities._toastCtrl.create({
            message: message,
            header: header,
            //showCloseButton: true,
            animated: true,
            duration: 3000,
            position: position || "bottom",
            keyboardClose: true,
            // closeButtonText: closeButtonText || "OK"
        });
        Utilities._toast.present();
    }

    static async showLoadingCtrl(message: string) {
        Utilities._loading = await Utilities._loadingCtrl.create({ message: message, spinner: 'lines-small' });
        Utilities._loading.present();
    }
    static async hideLoadingCtrl() {
        if (Utilities._loading) {
            await Utilities._loading.dismiss();
        }
    }
    static async showAlert(message: string, header?: string, subHeader?: string) {
        Utilities._alert = await Utilities._alertCtrl.create({
            message: message,
            header: header,
            subHeader: subHeader,
            animated: true,
            keyboardClose: true,
            buttons: [{ text: 'Ok', role: 'cancel' }],
        });
        Utilities._alert.present();
    }
    static async presentAlertConfirm(message: string, header?: string) {
        const alert = await Utilities._alertCtrl.create({
            header: header,
            message: message,
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: (blah) => {
                        blah = true;
                        console.log('Confirm Cancel: blah');
                    }
                }, {
                    text: 'Okay',
                    handler: () => {
                        console.log('Confirm Okay');
                    }
                }
            ]
        });

        await alert.present();
    }

    static async hideAlert() {
        if (Utilities._alert) {
            await Utilities._alert.dismiss();
        }
    }

    /**
     * Returns dynamic UID of specified length.
     * @param codeLen Length of the UID.
     */
    public static getUID(codeLen: number): string {
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        return Utilities.getRandomString(codeLen, possible);
    }

    /**Returns random numbers of specified character length.*/
    public static getRandomNumberString(randomCharlen: number): string {
        const possible = '0123456789';

        return Utilities.getRandomString(randomCharlen, possible);
    }

    private static getRandomString(randomCharlen: number, possible: string) {
        let text = '';

        for (let i = 0; i < randomCharlen; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;

    }

    public static getJSONDateStringWOTimeZone(dateValue: Date): string {
        // "1975-09-28T18:30:00.000Z"
        let dateOnlyDate: string;
        let day: number;
        let month: number;
        let year: number;

        // Convert date
        day = dateValue.getDate();
        month = dateValue.getMonth() + 1;
        year = dateValue.getFullYear();
        // "1975-11-25T00:00:00.000Z"
        dateValue = new Date(year + '-' + month.toString().padStart(2, '0') + '-' + day.toString().padStart(2, '0') + 'T00:00:00.000Z');

        // dateOnlyDate = dateOnlyDate + 'T00:00:00.000Z';
        dateOnlyDate = dateValue.toJSON();

        return dateOnlyDate;
    }

    public static uploadImage2Storage(file: File, storageFolderName: string, storageFileName: string, customMetadata: any) {
        // The storage path
        const storagePath = `${storageFolderName}/${storageFileName}`;

        // File reference
        const fileRef = Utilities._ngStorage.ref(storagePath);

        // The main task to upload the file
        const task = Utilities._ngStorage.upload(storagePath, file, { customMetadata });

        // wait for the file upload completion to add document in the item document
        return task.snapshotChanges();
    }
}

/**Stores/retrieves data stored locally on the device.*/
export class LocalDataStorage {
    // JSON "set" example
    static async setObject(key: string, value: any) {
        return await Storage.set({
            key: key,
            value: JSON.stringify(value)
        });
    }

    // JSON "get" example
    static async getObject(key: string): Promise<any> {
        const ret = await Storage.get({ key: key });
        const value = JSON.parse(ret.value);

        return Promise.resolve(value);
    }

    static async setItem(key: string, value: any) {
        return await Storage.set({
            key: key,
            value: value
        });
    }

    static async getItem(key: string): Promise<any> {
        const { value } = await Storage.get({ key: key });

        return Promise.resolve(value);
    }

    static async removeItem(key: string) {
        return await Storage.remove({ key: key });
    }

    static async keys(): Promise<any> {
        const { keys } = await Storage.keys();
        return Promise.resolve(keys);
    }

    static async clear() {
        return await Storage.clear();
    }
}

export class ValidationError extends Error {
    constructor(message) {
        super(message); // (1)
        this.name = "ValidationError"; // (2)
    }
}
