import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import moment from 'moment';
import { FechaOptions } from '../../interfaces/fecha-options';
import { AngularFireAuth } from 'angularfire2/auth';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import * as DataProvider from '../../providers/constants';

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
  usuario = {} as UsuarioOptions;
  administrador: boolean;
  totalesUsuarios: any[];
  total: number;
  cantidad: number;
  read;
  modo: string = 'finalizados';
  totalesDoc: AngularFirestoreDocument;
  constantes = DataProvider;
  filtros: string[];
  filtroSeleccionado: string = 'MENSUAL';
  initDate: Date = new Date();
  disabledDates: Date[] = [];
  maxDate: Date = new Date();
  minDate: Date = moment(new Date()).add(-30, 'days').toDate();


  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public alertCtrl: AlertController
  ) {
    this.filtros = [
      'DIARIO',
      'SEMANAL',
      'MENSUAL',
      'ANUAL'
    ];
    this.updateFechas(new Date());
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
          this.updateTotalesMes(this.mesSeleccionado.fecha);
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
          this.navCtrl.setRoot('LogueoPage');
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

  updateTotalesMes(fecha: Date) {
    let fechaInicio = moment(fecha).startOf('month').toDate();
    this.totalesDoc = this.afs.doc('totalesservicios/' + fechaInicio.getTime().toString());
    let totalesServiciosUsuariosCollection: AngularFirestoreCollection<TotalesServiciosOptions> = this.totalesDoc.collection('totalesServiciosUsuarios');
    this.read = totalesServiciosUsuariosCollection.valueChanges().subscribe(data => {
      this.totalesUsuarios = [];
      this.total = 0;
      this.cantidad = 0;
      this.totalesUsuarios = data;

      if (data.length > 0) {
        this.total += this.totalesUsuarios.map(totalUsuario => Number(totalUsuario.totalServicios)).reduce((a, b) => a + b);
        this.cantidad += this.totalesUsuarios.map(totalUsuario => Number(totalUsuario.cantidadServicios)).reduce((a, b) => a + b);
      }
    });
  }

  updateFechaMes(valor: number) {
    this.read.unsubscribe();
    let fechaNueva = moment(this.mesSeleccionado.fecha).add(valor, 'month').toDate();
    this.updateFechas(fechaNueva);
    this.adelante = moment(new Date()).diff(this.mesSeleccionado.fecha, "month") !== 0;
    this.atras = moment(this.mesSeleccionado.fecha).get("month") !== 1;
    this.updateTotalesMes(fechaNueva);
  }

  updateSeleccionadoMes(seleccionado: FechaOptions) {
    this.read.unsubscribe();
    this.adelante = moment(new Date()).diff(seleccionado.fecha, "month") !== 0;
    this.atras = moment(seleccionado.fecha).get("month") !== 1;
    this.updateTotalesMes(seleccionado.fecha);
  }

  updateTotalesDia(fecha: Date) {
    let fechaInicio = moment(fecha).startOf('day').toDate();
    let usuarioDiarioCollection = this.afs.collection<UsuarioOptions>('usuarios');
    this.read = usuarioDiarioCollection.valueChanges().subscribe(data => {
      this.totalesUsuarios = [];
      this.total = 0;
      this.cantidad = 0;
      data.forEach(usuario => {
        let disponibilidadUsuarioDoc = this.afs.doc('usuarios/' + usuario.id + '/disponibilidades/' + fechaInicio.getTime().toString());
        disponibilidadUsuarioDoc.ref.get().then(totalDia => {
          if (totalDia.exists) {
            let totalesDia = totalDia.get('totalServicios');
            let cantidadesDia = totalDia.get('cantidadServicios');
            this.total += totalesDia ? Number(totalesDia) : 0;
            this.cantidad += cantidadesDia ? Number(cantidadesDia) : 0;
            this.totalesUsuarios.push(totalDia.data());
          }
        });
      });
    });
  }

  updateSeleccionadosDia(fecha: Date) {
    this.initDate = fecha;
    this.read.unsubscribe();
    this.updateTotalesDia(fecha);
  }

  ver(idusuario: string) {
    this.navCtrl.push('DetalleReportePage', { idusuario: idusuario });
  }

  filtrar(filtro: string) {
    this.filtroSeleccionado = filtro;
    switch (this.constantes.FILTROS_FECHA[filtro]) {
      case this.constantes.FILTROS_FECHA.DIARIO:
        this.updateSeleccionadosDia(new Date());
        break;

      case this.constantes.FILTROS_FECHA.MENSUAL:
        this.updateFechas(new Date());
        this.updateTotalesMes(this.mesSeleccionado.fecha);
        break;
    }
  }

}
