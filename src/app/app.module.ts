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

import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ReservaProvider } from '../providers/reserva';
import { firebaseConfig } from './config.firebase';
import { AgendaPage } from '../pages/agenda/agenda';
import { ReportesPage } from '../pages/reportes/reportes';
import { ConfiguracionPage } from '../pages/configuracion/configuracion';


@NgModule({
  declarations: [
    MyApp,
    AgendaPage,
    ConfiguracionPage,
    ReportesPage,
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
    ConfiguracionPage,
    ReportesPage,
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
