import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import moment from 'moment';
import { FechaOptions } from '../../interfaces/fecha-options';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import * as DataProvider from '../../providers/constants';
import { UsuarioProvider } from '../../providers/usuario';

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

  filtros = [
    'DIARIO',
    'SEMANAL',
    'MENSUAL',
    'ANUAL'
  ];

  mesSeleccionado: FechaOptions;
  adelante: boolean = false;
  atras: boolean = true;
  fechas: FechaOptions[];
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuario = {} as UsuarioOptions;
  administrador: boolean;
  totalesUsuarios: any[];
  total: number;
  cantidad: number;
  read;
  totalesDoc: AngularFirestoreDocument;
  constantes = DataProvider;
  filtroSeleccionado: string = 'MENSUAL';
  initDate: Date = new Date();
  disabledDates: Date[] = [];
  maxDate: Date = new Date();
  minDate: Date = moment(new Date()).add(-30, 'days').toDate();
  usuarioDiarioCollection: AngularFirestoreCollection<UsuarioOptions>;
  textoSemana: string;
  semanaSeleccionada: Date;
  anoSeleccionado: Date;
  textoAno: string;
  filePathEmpresa: string;
  filePathUsuarios: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private usuarioServicio: UsuarioProvider
  ) {
    this.usuario = this.usuarioServicio.getUsuario();
    this.administrador = this.usuarioServicio.isAdministrador();
    this.filePathEmpresa = this.usuarioServicio.getFilePathEmpresa();
    this.filePathUsuarios = this.usuarioServicio.getFilePathUsuarios();
    this.updateFechasMes(new Date());
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
    this.usuarioDiarioCollection = this.administrador ? this.afs.collection<UsuarioOptions>(this.filePathUsuarios) : this.afs.collection<UsuarioOptions>(this.filePathUsuarios, ref => ref.where('id', '==', this.usuario.id));
    this.updateTotalesMes(this.mesSeleccionado.fecha);
  }


  updateFechasMes(fechaSeleccionada: Date) {
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
    this.totalesDoc = this.afs.doc(this.filePathEmpresa + '/totalesservicios/' + fechaInicio.getTime().toString());
    let totalesServiciosUsuariosCollection: AngularFirestoreCollection<TotalesServiciosOptions> = this.administrador ? this.totalesDoc.collection('totalesServiciosUsuarios') : this.totalesDoc.collection('totalesServiciosUsuarios', ref => ref.where('idusuario', '==', this.usuario.id));
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
    this.updateFechasMes(fechaNueva);
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
    this.read = this.usuarioDiarioCollection.valueChanges().subscribe(data => {
      this.totalesUsuarios = [];
      this.total = 0;
      this.cantidad = 0;
      data.forEach(usuario => {
        let disponibilidadUsuarioDoc = this.afs.doc<any>(this.filePathUsuarios + '/' + usuario.id + '/disponibilidades/' + fechaInicio.getTime().toString());
        disponibilidadUsuarioDoc.valueChanges().subscribe(totalDia => {
          if (totalDia) {
            let totalesDia = totalDia.totalServicios;
            let cantidadesDia = totalDia.cantidadServicios;
            this.total += totalesDia ? Number(totalesDia) : 0;
            this.cantidad += cantidadesDia ? Number(cantidadesDia) : 0;
            let totalUsuario = this.totalesUsuarios.find(totalUsuario => totalUsuario.idusuario === totalDia.idusuario);
            if (!totalUsuario) {
              this.totalesUsuarios.push(totalDia);
            } else {
              let item = this.totalesUsuarios.indexOf(totalUsuario);
              this.totalesUsuarios.splice(item, 1, totalDia);
            }
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

  updateDataSemana(usuario: UsuarioOptions, init: Date, fin: Date) {
    let inicio = init;
    while (moment(inicio).isSameOrBefore(fin)) {
      let disponibilidadUsuarioDoc = this.afs.doc<any>(this.filePathUsuarios + '/' + usuario.id + '/disponibilidades/' + inicio.getTime().toString());
      let totalSemana = 0;
      let cantidadSemana = 0;
      disponibilidadUsuarioDoc.valueChanges().subscribe(totalDia => {
        if (totalDia) {
          totalSemana += totalDia.totalServicios;
          cantidadSemana += totalDia.cantidadServicios;
          this.total += totalSemana ? Number(totalSemana) : 0;
          this.cantidad += cantidadSemana ? Number(cantidadSemana) : 0;
          totalDia.totalServicios = totalSemana;
          totalDia.cantidadServicios = cantidadSemana;
          let totalUsuarioEncontrado = this.totalesUsuarios.find(totalUsuario => totalUsuario.idusuario === usuario.id);
          if (!totalUsuarioEncontrado) {
            console.log('entra1')
            console.log(totalDia);
            this.totalesUsuarios.push(totalDia);
          } else {
            console.log('entra2')
            console.log(totalDia);
            let item = this.totalesUsuarios.indexOf(totalUsuarioEncontrado);
            totalDia.totalServicios += totalSemana;
            totalDia.cantidadServicios += cantidadSemana;

            this.totalesUsuarios.splice(item, 1, totalDia);
          }
        }
      });

      inicio = moment(inicio).add(1, 'days').toDate();
    }
  }

  updateTotalesSemana(fecha: Date) {
    let diaInicioSemana = moment(fecha).startOf('week').toDate();
    let diaFinSemana = moment(diaInicioSemana).endOf('week').toDate();
    diaInicioSemana = moment(diaInicioSemana).add(1, 'days').toDate();
    diaFinSemana = moment(diaFinSemana).add(1, 'days').toDate();
    let init = diaInicioSemana;

    this.textoSemana = moment(diaInicioSemana).locale('es').format('[Del] DD ') + moment(diaFinSemana).locale('es').format('[al] DD [de] MMMM');

    this.read = this.usuarioDiarioCollection.valueChanges().subscribe(data => {
      this.totalesUsuarios = [];
      this.total = 0;
      this.cantidad = 0;
      data.forEach(usuario => {
        this.updateDataSemana(usuario, init, diaFinSemana);
      });
    });
  }

  updateFechaSemana(valor: number) {
    this.read.unsubscribe();
    this.semanaSeleccionada = moment(this.semanaSeleccionada).add(valor, 'week').startOf('week').toDate();
    this.adelante = moment(new Date()).diff(this.semanaSeleccionada, 'week') !== 0;
    this.atras = moment(this.semanaSeleccionada).get('week') !== 1;
    this.updateTotalesSemana(this.semanaSeleccionada);
  }

  updateTotalesAno(fecha: Date) {
    let diaInicioAno = moment(fecha).startOf('year').toDate();
    let diaFinAno = moment(diaInicioAno).endOf('year').toDate();
    let init = diaInicioAno;

    this.textoAno = moment(diaInicioAno).locale('es').format('YYYY');

    this.totalesUsuarios = [];
    this.total = 0;
    this.cantidad = 0;

    while (moment(init).isSameOrBefore(diaFinAno)) {
      let mesInit = moment(init).startOf('month').toDate();
      this.totalesDoc = this.afs.doc(this.filePathEmpresa + '/totalesservicios/' + mesInit.getTime().toString());
      let totalesServiciosUsuariosCollection: AngularFirestoreCollection<TotalesServiciosOptions> = this.administrador ? this.totalesDoc.collection('totalesServiciosUsuarios') : this.totalesDoc.collection('totalesServiciosUsuarios', ref => ref.where('idusuario', '==', this.usuario.id));
      this.read = totalesServiciosUsuariosCollection.valueChanges().subscribe(data => {
        data.forEach(totalData => {
          if (this.totalesUsuarios.length === 0 || !this.totalesUsuarios.some(usuarioT => usuarioT.idusuario === totalData.idusuario)) {
            this.totalesUsuarios.push(totalData);
          } else {
            let totalUsuarioEncontrado = this.totalesUsuarios.find(usuarioT => usuarioT.idusuario === totalData.idusuario);
            totalUsuarioEncontrado.totalServicios += totalUsuarioEncontrado.totalServicios ? Number(totalUsuarioEncontrado.totalServicios) : 0;
            totalUsuarioEncontrado.cantidadServicios += totalUsuarioEncontrado.cantidadServicios ? Number(totalUsuarioEncontrado.cantidadServicios) : 0;
          }
        });

        if (data.length > 0) {
          this.total += data.map(totalUsuario => Number(totalUsuario.totalServicios)).reduce((a, b) => a + b);
          this.cantidad += data.map(totalUsuario => Number(totalUsuario.cantidadServicios)).reduce((a, b) => a + b);
        }
      });

      init = moment(init).add(1, 'month').toDate();
    }
  }

  updateFechaAno(valor: number) {
    this.read.unsubscribe();
    this.anoSeleccionado = moment(this.anoSeleccionado).add(valor, 'year').startOf('year').toDate();
    this.adelante = moment(new Date()).diff(this.anoSeleccionado, 'year') !== 0;
    this.atras = moment(this.anoSeleccionado).get('year') !== 1;
    this.updateTotalesAno(this.anoSeleccionado);
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
        this.updateFechasMes(new Date());
        this.updateTotalesMes(this.mesSeleccionado.fecha);
        break;

      case this.constantes.FILTROS_FECHA.SEMANAL:
        this.semanaSeleccionada = new Date();
        this.updateFechaSemana(0);
        break;

      case this.constantes.FILTROS_FECHA.ANUAL:
        this.anoSeleccionado = new Date();
        this.updateFechaAno(0);
        break;
    }
  }

}
