import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { UsuarioProvider } from '../../providers/usuario';

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
  usuario: UsuarioOptions;
  noDisponibleColection: AngularFirestoreCollection;
  noDisponible: any[];
  filePathUsuario: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private usuarioServicio: UsuarioProvider
  ) {
    this.usuario = this.navParams.get('usuario');
    this.filePathUsuario = this.usuarioServicio.getFilePathUsuario() + this.usuario.id;
    this.usuarioDoc = this.afs.doc(this.filePathUsuario);
    this.updateHorarioNoDisponible();
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
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
