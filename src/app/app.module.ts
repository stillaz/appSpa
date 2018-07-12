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
import { Push } from '@ionic-native/push';
import { Camera } from '@ionic-native/camera';
import { FileChooser } from '@ionic-native/file-chooser';
import { FilePath } from '@ionic-native/file-path';
import { AngularFireStorageModule } from 'angularfire2/storage';
import { SearchPipe } from '../pipes/search/search';
import { GastoPage } from '../pages/gasto/gasto';
import { JoinsPipe } from '../pipes/joins/joins';


@NgModule({
  declarations: [
    MyApp,
    AgendaPage,
    ConfiguracionPage,
    GastoPage,
    ReportesPage,
    TabsPage,
    SearchPipe,
    JoinsPipe
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    DatePickerModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFireStorageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AgendaPage,
    ConfiguracionPage,
    GastoPage,
    ReportesPage,
    TabsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    Calendar,
    Camera,
    DatePicker,
    FileChooser,
    FilePath,
    Push,
    ReservaProvider
  ]
})
export class AppModule { }
