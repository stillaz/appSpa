import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import moment from 'moment';
import { FechaOptions } from '../../interfaces/fecha-options';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioProvider } from '../../providers/usuario';

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
  usuario = {} as UsuarioOptions;
  administrador: boolean;
  disponibilidadesCollection: AngularFirestoreCollection;
  disponibilidades: any[];
  total: number;
  cantidad: number;
  modo: string = 'disponibilidades';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private usuarioServicio: UsuarioProvider
  ) {
    let idususario = this.navParams.get('idusuario');
    this.administrador = this.usuarioServicio.isAdministrador();
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
    this.usuarioDoc = this.afs.doc<UsuarioOptions>(this.usuarioServicio.getFilePathUsuario() + idusuario);
    this.usuarioDoc.valueChanges().subscribe(datosusuario => {
      this.usuario = datosusuario;
      this.updateServicios(this.mesSeleccionado.fecha);
    });
  }

  updateFechas(fechaSeleccionada: Date) {
    this.fechas = [];
    const actual = moment(fechaSeleccionada).startOf("month");
    const fechaInicio = moment(fechaSeleccionada).add(-1, "years");
    let fecha = actual.startOf("month");
    const texto = fecha.locale("es").format("MMMM - YYYY").toLocaleUpperCase();
    this.mesSeleccionado = { fecha: actual.toDate(), texto: texto };

    this.fechas.push(this.mesSeleccionado);
    while (fecha.diff(fechaInicio) > 0) {
      fecha = fecha.add(-1, "month");
      const texto = fecha.locale("es").format("MMMM - YYYY").toLocaleUpperCase();
      this.fechas.push({ fecha: fecha.toDate(), texto: texto });
    }
  }

  private loadDisponibilidades(disponibilidadesCollection: AngularFirestoreCollection<DisponibilidadOptions>, dia: DisponibilidadOptions) {
    const disponibilidadDoc = disponibilidadesCollection.doc(dia.id.toString());
    const modoCollection = disponibilidadDoc.collection<ReservaOptions>(this.modo, ref => ref.orderBy('fechaFin', 'desc'));
    return new Promise<any>(resolve => {
      modoCollection.valueChanges().subscribe(datos => {
        resolve(datos);
      });
    });
  }

  updateServicios(fecha: Date) {
    const fechaInicio = moment(fecha).startOf('month').toDate();
    const fechaFin = moment(fecha).endOf('month').toDate();
    const disponibilidadesCollection: AngularFirestoreCollection<DisponibilidadOptions> = this.usuarioDoc.collection('disponibilidades', ref => ref.where('id', '<=', fechaFin.getTime()).orderBy('id', 'desc').where('id', '>=', fechaInicio.getTime()));
    disponibilidadesCollection.valueChanges().subscribe(data => {
      this.disponibilidades = [];
      this.total = 0;
      this.cantidad = 0;
      if (data) {
        data.forEach(dia => {
          this.loadDisponibilidades(disponibilidadesCollection, dia).then(datos => {
            if (datos && datos[0]) {
              const fechaData = moment(new Date(dia.id)).locale('es').format('dddd, DD');
              this.disponibilidades.push({ grupo: fechaData, disponibilidades: datos });
              this.total += datos.map(c => {
                return c.pago ? Number(c.pago) : 0;
              }).reduce((sum, current) => sum + current);
              this.cantidad += datos.length;
            }
          });
        });
      }
    });
  }

  updateFecha(valor: number) {
    let fechaNueva = moment(this.mesSeleccionado.fecha).add(valor, 'month').toDate();
    this.updateFechas(fechaNueva);
    this.adelante = moment(new Date()).diff(this.mesSeleccionado.fecha, "month") !== 0;
    this.atras = moment(this.mesSeleccionado.fecha).get("month") !== 1;
    this.updateServicios(fechaNueva);
  }

  updateSeleccionado(seleccionado: FechaOptions) {
    this.adelante = moment(new Date()).diff(seleccionado.fecha, "month") !== 0;
    this.atras = moment(seleccionado.fecha).get("month") !== 1;
    this.updateServicios(seleccionado.fecha);
  }

}
