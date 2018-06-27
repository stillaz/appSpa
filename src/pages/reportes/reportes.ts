import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import moment from 'moment';
import { FechaOptions } from '../../interfaces/fecha-options';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { ReservaOptions } from '../../interfaces/reserva-options';

/**
 * Generated class for the ReportesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-reportes',
  templateUrl: 'reportes.html',
})
export class ReportesPage {

  mesSeleccionado: FechaOptions;
  adelante: boolean = false;
  atras: boolean = true;
  fechas: FechaOptions[];
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuarioLogueado: UsuarioOptions;
  usuario: UsuarioOptions;
  administrador: boolean;
  disponibilidadesCollection: AngularFirestoreCollection;
  disponibilidad: any[];
  total: number;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public alertCtrl: AlertController
  ) {
    this.updateFechas();
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
          this.administrador = this.usuarioLogueado.perfiles.some(perfil => perfil.id === 0);
          this.updateServicios(this.mesSeleccionado.fecha);
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
        }
      });
    }
  }

  updateFecha() {
    this.adelante = moment(new Date()).diff(this.mesSeleccionado.fecha, "month") !== 0;
    this.atras = moment(this.mesSeleccionado.fecha).get("month") !== 1;
  }

  updateFechas() {
    this.fechas = [];
    let actual = moment(new Date).startOf("month");
    let fechaInicio = moment(new Date).add(-1, "years");
    let fecha = actual.startOf("month");
    let texto = fecha.locale("es").format("MMMM - YYYY").toLocaleUpperCase();
    this.mesSeleccionado = { fecha: actual.toDate(), texto: texto };

    this.fechas.push(this.mesSeleccionado);
    while (fecha.diff(fechaInicio) > 0) {
      fecha = fecha.add(-1, "month");
      let texto = fecha.locale("es").format("MMMM - YYYY").toLocaleUpperCase();
      this.fechas.push({ fecha: fecha.toDate(), texto: texto });
    }
  }

  updateServicios(fecha: Date) {
    let fechaFin = fecha.getMonth == new Date().getMonth ? new Date() : moment(fecha).endOf('month').toDate();
    let disponibilidadesCollection: AngularFirestoreCollection<DisponibilidadOptions> = this.usuarioDoc.collection('disponibilidades', ref => ref.where('id', '<=', fechaFin.getTime()));
    disponibilidadesCollection.valueChanges().subscribe(data => {
      this.disponibilidad = [];
      this.total = 0;
      if (data) {
        data.forEach(dia => {
          disponibilidadesCollection.doc(dia.id.toString()).collection<ReservaOptions>('disponibilidades').valueChanges().subscribe(datos => {
            this.disponibilidad.push({ grupo: dia, disponibilidades: datos });
            this.total += datos.map(c => {
              if (c.servicio && c.servicio.valor) {
                return c.servicio.valor;
              }
              return 0;
            }).reduce((sum, current) => sum + current);
          });
        });
      }
    });
  }

}
