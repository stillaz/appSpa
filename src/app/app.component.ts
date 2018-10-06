import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { AngularFireAuth } from 'angularfire2/auth';
import { TabsPage } from '../pages/tabs/tabs';
import { AngularFirestore } from 'angularfire2/firestore';
import { UsuarioProvider } from '../providers/usuario';
import { UsuarioOptions } from '../interfaces/usuario-options';
import { FmcProvider } from '../providers/fmc';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = 'LogueoPage';

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public usuarioService: UsuarioProvider,
    fcm: FmcProvider
  ) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      this.afa.auth.onAuthStateChanged(user => {
        if (user) {
          let usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
          usuarioDoc.valueChanges().subscribe(data => {
            fcm.getToken();
            /*if (platform.is('cordova')) {
              fcm.listenToNotifications().pipe(
                tap(() => {
                  fcm.setNotificaciones(1);
                })).subscribe();
            }*/
            if (data) {
              this.rootPage = TabsPage;
              this.usuarioService.setUsuario(data);
              this.afs.doc<any>('negocios/' + data.idempresa).valueChanges().subscribe(dataEmpresa => {
                this.usuarioService.setEmpresa(dataEmpresa.nombre);
              });
            } else {
              alert('Usuario no encontrado');
            }
          });
        } else {
          this.rootPage = 'LogueoPage';
        }
      });
    });
  }
}
