import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Calendar } from '@ionic-native/calendar'
import { DatePicker } from '@ionic-native/date-picker';
import { DatePickerModule } from 'ionic3-datepicker';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { AgendaPage } from '../pages/agenda/agenda';
import { ReservaPage } from '../pages/reserva/reserva';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { PersonaProvider } from '../providers/persona/persona';

@NgModule({
  declarations: [
    MyApp,
    AgendaPage,
    ReservaPage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    DatePickerModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AgendaPage,
    ReservaPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Calendar,
    DatePicker,
    PersonaProvider
  ]
})
export class AppModule { }
