import { Component } from '@angular/core';
import { IonicPage, NavController, AlertController } from 'ionic-angular';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AgendaPage } from '../agenda/agenda';
import { ReportesPage } from '../reportes/reportes';
import { ConfiguracionPage } from '../configuracion/configuracion';
import { GastoPage } from '../gasto/gasto';

/**
 * Generated class for the TabsPage tabs.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {
  tabs = [];

  constructor(
    private afa: AngularFireAuth,
    private navCtrl: NavController,
    private afs: AngularFirestore,
    public alertCtrl: AlertController
  ) {
    this.tabs.push({ root: AgendaPage, title: 'Agenda', icon: 'bookmarks', badge: 0 });
    this.tabs.push({ root: ReportesPage, title: 'Reportes', icon: 'list', badge: 0 });
    this.updateUsuario();
  }

  genericAlert(title: string, message: string) {
    let alert = this.alertCtrl.create({
      title: title,
      message: message,
      buttons: [{
        text: 'OK'
      }]
    });
    alert.present();
  }

  updateUsuario() {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      let usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      usuarioDoc.ref.get().then(data => {
        if (data) {
          let administrador = data.get('perfiles').some(perfil => perfil.nombre === 'Administrador');
          if (administrador) {
            this.tabs.splice(2, 1, { root: GastoPage, title: 'Gastos', icon: 'logo-usd', badge: 0 });
          }
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
          this.navCtrl.setRoot('LogueoPage');
        }
        this.tabs.push({ root: ConfiguracionPage, title: 'Configuración', icon: 'options', badge: 0 });
      });
    }
  }

}