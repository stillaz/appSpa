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
import { GastoPage } from '../pages/gasto/gasto';
import { UsuarioProvider } from '../providers/usuario';
import { AgendaPageModule } from '../pages/agenda/agenda.module';
import { ConfiguracionPageModule } from '../pages/configuracion/configuracion.module';
import { GastoPageModule } from '../pages/gasto/gasto.module';
import { ReportesPageModule } from '../pages/reportes/reportes.module';
import { TabsPageModule } from '../pages/tabs/tabs.module';
import { PipesModule } from '../pipes/pipes.module';
import { FmcProvider } from '../providers/fmc';
import { Firebase } from '@ionic-native/firebase'
import { PendientePageModule } from '../pages/pendiente/pendiente.module';
import { PendientePage } from '../pages/pendiente/pendiente';


@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp,
      {
        monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Ocutbre', 'Noviembre', 'Diciembre'],
        monthShortNames: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
        dayShortNames: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
      }),
    DatePickerModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFireStorageModule,
    AgendaPageModule,
    ConfiguracionPageModule,
    GastoPageModule,
    PendientePageModule,
    ReportesPageModule,
    TabsPageModule,
    PipesModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AgendaPage,
    ConfiguracionPage,
    GastoPage,
    PendientePage,
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
    ReservaProvider,
    UsuarioProvider,
    FmcProvider,
    Firebase
  ]
})
export class AppModule { }
