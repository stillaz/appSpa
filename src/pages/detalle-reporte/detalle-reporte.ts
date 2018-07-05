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
  selector: 'page-detalle-reporte',
  templateUrl: 'detalle-reporte.html',
})
export class DetalleReportePage {

  mesSeleccionado: FechaOptions;
  adelante: boolean = false;
  atras: boolean = true;
  fechas: FechaOptions[];
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuarioLogueado: UsuarioOptions;
  usuario = {} as UsuarioOptions;
  administrador: boolean;
  disponibilidadesCollection: AngularFirestoreCollection;
  disponibilidades: any[];
  total: number;
  cantidad: number;
  read;
  modo: string = 'finalizados';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public alertCtrl: AlertController
  ) {
    let idususario = this.navParams.get('idusuario');
    this.updateFechas(new Date());
    this.updateUsuario(idususario);
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  updateUsuario(idusuario: string) {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      let usuarioLogueadoDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + idusuario);
      usuarioLogueadoDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuarioLogueado = data;
          this.administrador = this.usuarioLogueado.perfiles.some(perfil => perfil.nombre === 'Administrador');
          this.usuarioDoc.valueChanges().subscribe(datosusuario => {
            this.usuario = datosusuario;
            this.updateServicios(this.mesSeleccionado.fecha);
          });
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
        }
      });
    }
  }

  updateFechas(fechaSeleccionada: Date) {
    this.fechas = [];
    let actual = moment(fechaSeleccionada).startOf("month");
    let fechaInicio = moment(fechaSeleccionada).add(-1, "years");
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
    let fechaInicio = moment(fecha).startOf('month').toDate();
    let fechaFin = fecha.getMonth() == new Date().getMonth() ? new Date() : moment(fecha).endOf('month').toDate();
    let disponibilidadesCollection: AngularFirestoreCollection<DisponibilidadOptions> = this.usuarioDoc.collection('disponibilidades', ref => ref.where('id', '<=', fechaFin.getTime()).orderBy('id', 'desc').where('id', '>=', fechaInicio.getTime()));
    this.read = disponibilidadesCollection.valueChanges().subscribe(data => {
      this.disponibilidades = [];
      this.total = 0;
      this.cantidad = 0;
      if (data) {
        data.forEach(dia => {
          disponibilidadesCollection.doc(dia.id.toString()).collection<ReservaOptions>(this.modo, ref => ref.orderBy('fechaFin', 'desc')).valueChanges().subscribe(datos => {
            if (datos && datos.length > 0) {
              let fechaData = moment(new Date(dia.id)).locale('es').format('dddd, DD')
              this.disponibilidades.push({ grupo: fechaData, disponibilidades: datos });
              this.total = datos.map(c => {
                if (c.servicio && c.servicio.valor) {
                  return Number(c.servicio.valor);
                }
                return 0;
              }).reduce((sum, current) => sum + current);
              this.cantidad = datos.length;
            }
          });
        });
      }
    });
  }

  updateFecha(valor: number) {
    this.read.unsubscribe();
    let fechaNueva = moment(this.mesSeleccionado.fecha).add(valor, 'month').toDate();
    this.updateFechas(fechaNueva);
    this.adelante = moment(new Date()).diff(this.mesSeleccionado.fecha, "month") !== 0;
    this.atras = moment(this.mesSeleccionado.fecha).get("month") !== 1;
    this.updateServicios(fechaNueva);
  }

  updateSeleccionado(seleccionado: FechaOptions) {
    this.read.unsubscribe();
    this.adelante = moment(new Date()).diff(seleccionado.fecha, "month") !== 0;
    this.atras = moment(seleccionado.fecha).get("month") !== 1;
    this.updateServicios(seleccionado.fecha);
  }

}
