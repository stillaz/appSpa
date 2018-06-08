import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Calendar } from '@ionic-native/calendar'
import { DatePicker } from '@ionic-native/date-picker';
import { DatePickerModule } from 'ionic3-datepicker';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';

import { AgendaPage } from '../pages/agenda/agenda';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { PerfilProvider } from '../providers/perfil';
import { ServicioProvider } from '../providers/servicio';
import { UsuarioProvider } from '../providers/usuario';
import { ReservaProvider } from '../providers/reserva';

@NgModule({
  declarations: [
    MyApp,
    AgendaPage,
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
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Calendar,
    DatePicker,
    PerfilProvider,
    ServicioProvider,
    UsuarioProvider,
    ReservaProvider
  ]
})
export class AppModule { }
