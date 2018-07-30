import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { timer } from 'rxjs/Observable/timer';
import { AngularFireAuth } from '../../node_modules/angularfire2/auth';
import { TabsPage } from '../pages/tabs/tabs';
import { AngularFirestore } from '../../node_modules/angularfire2/firestore';
import { UsuarioProvider } from '../providers/usuario';
import { UsuarioOptions } from '../interfaces/usuario-options';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = 'LogueoPage';
  showSplash = true;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private afa: AngularFireAuth, private afs: AngularFirestore, public usuarioService: UsuarioProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();

      timer(3000).subscribe(() => {
        this.showSplash = false;
        this.afa.auth.onAuthStateChanged(user => {
          if (user) {
            this.afs.doc<UsuarioOptions>('usuarios/' + user.uid).valueChanges().subscribe(data => {
              this.usuarioService.setUsuario(data);
              this.rootPage = TabsPage;
            });
          } else {
            this.rootPage = 'LogueoPage';
          }
        })
      });
    });
  }
}
