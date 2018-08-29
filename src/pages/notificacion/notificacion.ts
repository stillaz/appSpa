import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioProvider } from '../../providers/usuario';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { Observable } from 'rxjs';
import * as DataProvider from '../../providers/constants';

/**
 * Generated class for the NotificacionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-notificacion',
  templateUrl: 'notificacion.html',
})
export class NotificacionPage {

  constantes = DataProvider;
  notificacionesCollection: AngularFirestoreCollection<ReservaOptions>;
  notificaciones: ReservaOptions[];
  filePathNotificaciones: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    private usuarioServicio: UsuarioProvider
  ) {
    const idusuario = this.usuarioServicio.getUsuario().id;
    this.filePathNotificaciones = 'servicioscliente/';
    this.notificacionesCollection = this.afs.collection<ReservaOptions>(this.filePathNotificaciones, ref => ref.where('idusuario', '==', idusuario).orderBy('fechaActualizacion', 'desc').limit(1000));
  }

  ionViewDidLoad() {
    this.updateNotificaciones();
    Observable.interval(300000).subscribe(() => {
      this.setLeidos();
    });
  }

  updateNotificaciones() {
    this.notificacionesCollection.valueChanges().subscribe(data => {
      this.notificaciones = data.filter(notificacion => !notificacion.leido);
    });
  }

  setLeidos() {
    if (this.notificaciones) {
      this.notificaciones.forEach(notificacion => {
        let notificacionDoc = this.afs.doc(this.filePathNotificaciones + notificacion.id);
        notificacionDoc.ref.get().then(() => {
          notificacionDoc.update({ leido: true });
        });
      });
    }
  }

}
