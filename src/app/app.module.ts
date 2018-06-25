import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Calendar } from '@ionic-native/calendar'
import { DatePicker } from '@ionic-native/date-picker';
import { DatePickerModule } from 'ionic3-datepicker';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';

import { AgendaPage } from '../pages/agenda/agenda';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ReservaProvider } from '../providers/reserva';

export const firebaseConfig = {
  apiKey: "AIzaSyD_K1Iw-jUr8-2Sesm5_Yqq-LaiL7ljj3c",
  authDomain: "barberia-12b66.firebaseapp.com",
  databaseURL: "https://barberia-12b66.firebaseio.com",
  projectId: "barberia-12b66",
  storageBucket: "barberia-12b66.appspot.com",
  messagingSenderId: "603689567449"
};

@NgModule({
  declarations: [
    MyApp,
    AgendaPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    DatePickerModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AgendaPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Calendar,
    DatePicker,
    ReservaProvider
  ]
})
export class AppModule { }
