import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { AngularFireAuth } from '../../../node_modules/angularfire2/auth';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from '../../../node_modules/angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';

/**
 * Generated class for the NodisponiblePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-nodisponible',
  templateUrl: 'nodisponible.html',
})
export class NodisponiblePage {

  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuarioLogueado: UsuarioOptions;
  usuario: UsuarioOptions;
  administrador: boolean;
  noDisponibleColection: AngularFirestoreCollection;
  noDisponible: any[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public alertCtrl: AlertController
  ) {
    this.updateUsuario();
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  updateUsuario() {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      this.usuarioDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuarioLogueado = data;
          this.usuario = data;
          this.administrador = this.usuarioLogueado.perfiles.some(perfil => perfil.nombre === 'Administrador');
          this.updateHorarioNoDisponible();
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
        }
      });
    }
  }

  updateHorarioNoDisponible() {
    this.noDisponibleColection = this.usuarioDoc.collection('indisponibilidades', ref => ref.orderBy('fechaDesde', 'desc').limit(10));
    this.noDisponibleColection.valueChanges().subscribe(data => {
      this.noDisponible = data;
    });
  }

  eliminar(noDisponible) {
    let noDisponibleDoc = this.noDisponibleColection.doc(noDisponible.id);
    noDisponibleDoc.delete().then(() => {
      this.genericAlert('Hora de no disponibilidad', 'La hora de no disponibilidad ha sido eliminada');
    }).catch(err => this.genericAlert('Hora de no disponibilidad', err));
  }

}
