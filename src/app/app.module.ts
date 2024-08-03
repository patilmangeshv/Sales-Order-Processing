import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';

import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';
import { AngularFireAuthGuard } from '@angular/fire/auth-guard';
import { AngularFireMessagingModule } from '@angular/fire/messaging';

import * as firebase from "firebase/app"
// Add the Performance Monitoring library
import "firebase/performance";

import { firebaseConfig } from './credentials';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { ComponentsModule } from './components/components.module';

import './shared/native-type.extensions';

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    ComponentsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    // AngularFireModule.initializeApp(firebaseConfigDev, "dev"),
    // AngularFirestoreModule.enablePersistence(),
    AngularFirestoreModule.enablePersistence({ synchronizeTabs: true }),
    /* https://firebase.googleblog.com/2018/09/multi-tab-offline-support-in-cloud.html
    AngularFirestoreModule.enablePersistence({synchronizeTabs :true}).then(() => {
      console.log("Woohoo! Multi-Tab Persistence!");
    }), */
    AngularFireAuthModule,
    AngularFireMessagingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    StatusBar,
    SplashScreen,
    AngularFireAuthGuard,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
