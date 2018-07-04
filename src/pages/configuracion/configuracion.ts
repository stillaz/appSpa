import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestoreDocument, AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';

@Component({
  selector: 'page-configuracion',
  templateUrl: 'configuracion.html'
})
export class ConfiguracionPage {

  pages: any[] = [];

  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  private usuario: UsuarioOptions;


  constructor(
    public navCtrl: NavController,
    private afa: AngularFireAuth,
    public alertCtrl: AlertController,
    private afs: AngularFirestore
  ) {
    this.pages.push({ title: 'Horario', component: 'GeneralPage', icon: 'alert' });
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
      this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      this.usuarioDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuario = data;
          let administrador = this.usuario.perfiles.some(perfil => perfil.nombre === 'Administrador');
          if (administrador) {
            this.pages.push({ title: 'Servicios', component: 'ServicioPage', icon: 'alert' });
          }
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
          this.navCtrl.setRoot('LogueoPage');
        }
      });
    }
  }

  openPage(page) {
    this.navCtrl.push(page.component);
  }

}
