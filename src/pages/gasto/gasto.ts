import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ModalController } from 'ionic-angular';
import moment from 'moment';
import { FechaOptions } from '../../interfaces/fecha-options';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { GastoOptions } from '../../interfaces/gasto-options';

/**
 * Generated class for the ReportesPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-gasto',
  templateUrl: 'gasto.html',
})
export class GastoPage {

  mesSeleccionado: FechaOptions;
  adelante: boolean = false;
  atras: boolean = true;
  fechas: FechaOptions[];
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuarioLogueado: UsuarioOptions;
  usuario = {} as UsuarioOptions;
  administrador: boolean;
  gastos: any[];
  total: number;
  read;
  modo: string = 'finalizados';

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController
  ) {
    let idususario = this.navParams.get('idusuario');
    this.updateFechas(new Date());
    this.updateUsuario(idususario);
  }

  crear() {
    this.modalCtrl.create('DetalleGastoPage').present();
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
            this.updateGastos(this.mesSeleccionado.fecha);
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

  updateGastos(fecha: Date) {
    let fechaInicio = moment(fecha).startOf('month').toDate().getTime().toString();

    let gastosMesDoc: AngularFirestoreDocument = this.afs.doc('gastos/' + fechaInicio);
    this.read = gastosMesDoc.valueChanges().subscribe(gastosMes => {
      this.total = 0;
      this.gastos = [];
      if (gastosMes) {
        this.total = gastosMes.totalGastos;
        let gastosDiariosCollection: AngularFirestoreCollection = gastosMesDoc.collection('totalesgastos');
        gastosDiariosCollection.ref.get().then(gastosdiarios => {
          gastosdiarios.forEach(gasto => {
            gasto.ref.collection('gastos').get().then(gastos => {
              let fechaData = moment(gasto.get('fecha').toDate()).locale('es').format('dddd, DD');
              let detalle = [];
              gastos.forEach(dato => {
                detalle.push(dato.data());
              })
              this.gastos.push({ grupo: fechaData, gastos: detalle });
            });
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
    this.updateGastos(fechaNueva);
  }

  updateSeleccionado(seleccionado: FechaOptions) {
    this.read.unsubscribe();
    this.adelante = moment(new Date()).diff(seleccionado.fecha, "month") !== 0;
    this.atras = moment(seleccionado.fecha).get("month") !== 1;
    this.updateGastos(seleccionado.fecha);
  }

  ver(gasto: GastoOptions){
    this.modalCtrl.create('DetalleGastoPage', {
      gasto: gasto
    });
  }

}
