import moment from 'moment';
import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ItemSliding, NavController, ActionSheetController, PopoverController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { PerfilOptions } from '../../interfaces/perfil-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import { UsuarioProvider } from '../../providers/usuario';

/**
 * Generated class for the AgendaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-agenda',
  templateUrl: 'agenda.html',
})
export class AgendaPage {

  @ViewChild(Content) content: Content;

  horaInicio = 0;
  horaFin = 24;
  tiempoServicio = 30;
  actual: Date;
  initDate: Date = new Date();
  initDate2: Date = new Date();
  disabledDates: Date[] = [];
  maxDate: Date = moment(new Date()).add(30, 'days').toDate();
  min: Date = new Date();
  constantes = DataProvider;
  usuario = {} as UsuarioOptions;
  usuarioLogueado: UsuarioOptions;
  horario: ReservaOptions[];
  horarios: any[];
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  perfiles: PerfilOptions[];
  usuarios: UsuarioOptions[];
  private disponibilidadDoc: AngularFirestoreDocument;
  terms: string = '';
  private indisponibles;
  private filePathEmpresa: string;
  administrador: boolean;

  opciones: any[] = [
    { title: 'Configuración', component: 'ConfiguracionAgendaPage', icon: 'stats' }
  ];

  constructor(
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public navCtrl: NavController,
    private afs: AngularFirestore,
    public popoverCtrl: PopoverController,
    private usuarioService: UsuarioProvider,
  ) {
    this.usuarioLogueado = this.usuarioService.getUsuario();
    this.filePathEmpresa = 'negocios/' + this.usuarioLogueado.idempresa;
    this.administrador = this.usuarioService.isAdministrador();
    if (this.administrador) {
      this.updateUsuarios();
      this.updatePerfiles();
    }
  }

  ionViewDidLoad() {
    Observable.interval(60000).subscribe(() => {
      this.initDate = new Date();
      this.initDate2 = new Date();
      this.updateHorariosInicial();
    });
  }

  ionViewDidEnter() {
    this.updateUsuario(this.usuarioLogueado.id);
  }

  updateUsuarios() {
    let filePathUsuarios = this.filePathEmpresa + '/usuarios';
    let usuariosCollection = this.afs.collection<UsuarioOptions>(filePathUsuarios);
    usuariosCollection.valueChanges().subscribe(data => {
      this.usuarios = data;
    });
  }

  private updatePerfiles() {
    let filePathPerfiles = this.filePathEmpresa + '/perfiles';
    let perfilesCollection = this.afs.collection<PerfilOptions>(filePathPerfiles);
    perfilesCollection.valueChanges().subscribe(data => {
      this.perfiles = data;
    });
  }

  setDate(date: Date) {
    this.initDate = date;
    let fecha: Date = moment(date).startOf('day').toDate();
    this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    this.updateHorariosInicial();
  }

  updateUsuario(id: string) {
    this.usuarioDoc = this.afs.doc<UsuarioOptions>(this.filePathEmpresa + '/usuarios/' + id);
    this.usuarioDoc.valueChanges().subscribe(data => {
      if (data) {
        this.usuario = data;
        let configuracion = this.usuario.configuracion;
        if (configuracion) {
          this.horaInicio = configuracion.horaInicio;
          this.horaFin = configuracion.horaFin;
          this.tiempoServicio = configuracion.tiempoDisponibilidad;
        }
        let fecha = moment(this.initDate).startOf('days').toDate().getTime().toString();
        this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha);
        this.updateHorarioNoDisponible();
      }
    });
  }

  loadHorarioNoDisponible(fecha: Date): ServicioOptions {
    let encontrado = this.indisponibles.find(item => {
      let fechaDesde: Date = moment(new Date(item.fechaDesde)).startOf('day').toDate();
      let fechaFin: Date = item.indefinido ? moment(new Date(item.fechaDesde)).endOf('day').toDate() : moment(new Date(item.fechaHasta)).endOf('day').toDate();

      if (moment(this.initDate).isBetween(fechaDesde, fechaFin)) {
        let horaInicio = item.todoDia ? this.horaInicio : moment(item.horaDesde, 'HH:mm').toDate().getHours();
        let horaFin = item.todoDia ? this.horaFin : moment(item.horaHasta, 'HH:mm').toDate().getHours() - 1;
        let horaReserva = fecha.getHours();
        if (horaReserva >= horaInicio && horaReserva <= horaFin) {
          return item;
        }
      }
    });

    let servicio: ServicioOptions;

    if (encontrado) {
      servicio = {} as ServicioOptions;
      servicio.nombre = encontrado.descripcion;
    }

    return servicio;
  }

  updateHorarioNoDisponible() {
    let indisponibilidadCollection = this.usuarioDoc.collection('indisponibilidades');
    indisponibilidadCollection.valueChanges().subscribe(indisponibilidades => {
      this.indisponibles = indisponibilidades;
      this.updateHorariosInicial();
    });
  }

  updateHorariosInicial() {
    this.disponibilidadDoc.collection<ReservaOptions>('disponibilidades').valueChanges().subscribe(data => {
      this.horario = [];
      this.horarios = [];
      let grupos = [];
      let reservas: ReservaOptions[] = data;
      let fechaInicio = moment(this.initDate).startOf('day').hours(this.horaInicio);
      let fechaFin = moment(this.initDate).hours(this.horaFin);
      let ahora = new Date();
      while (fechaInicio.isSameOrBefore(fechaFin.toDate())) {
        let fechaInicioReserva = fechaInicio.toDate();
        let fechaFinReserva = moment(fechaInicio).add(this.tiempoServicio, 'minutes').toDate();
        let noDisponible = this.loadHorarioNoDisponible(fechaInicioReserva);
        let reserva: ReservaOptions;
        if (noDisponible) {
          reserva = {
            fechaInicio: fechaInicioReserva,
            fechaFin: fechaFinReserva,
            estado: this.constantes.ESTADOS_RESERVA.NO_DISPONIBLE,
            evento: this.constantes.EVENTOS.OTRO,
            idcarrito: null,
            cliente: {} as ClienteOptions,
            servicio: [noDisponible],
            idusuario: this.usuario.id,
            nombreusuario: this.usuario.nombre
          };
        } else {
          let reservaEnc = reservas.find(item => item.fechaInicio.toDate().getTime() === fechaInicioReserva.getTime());
          if (!reservaEnc) {
            reserva = {
              fechaInicio: fechaInicioReserva,
              fechaFin: fechaFinReserva,
              estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
              evento: this.constantes.EVENTOS.OTRO,
              idcarrito: null,
              cliente: {} as ClienteOptions,
              servicio: [{} as ServicioOptions],
              idusuario: this.usuario.id,
              nombreusuario: this.usuario.nombre
            };
          } else {
            reserva = {
              fechaInicio: reservaEnc.fechaInicio.toDate(),
              fechaFin: reservaEnc.fechaFin.toDate(),
              estado: reservaEnc.estado,
              evento: null,
              idcarrito: reservaEnc.idcarrito,
              cliente: reservaEnc.cliente,
              servicio: reservaEnc.servicio,
              idusuario: reservaEnc.idusuario,
              nombreusuario: reservaEnc.nombreusuario
            };
          }
        }

        if (moment(ahora).isBetween(reserva.fechaInicio, reserva.fechaFin)) {
          reserva.evento = this.constantes.EVENTOS.ACTUAL;
          if (reserva.estado === this.constantes.ESTADOS_RESERVA.RESERVADO) {
            reserva.estado = this.constantes.ESTADOS_RESERVA.EJECUTANDO;
          }
        }

        let grupo = moment(reserva.fechaInicio).startOf('hours').format('h:mm a');;
        if (grupos[grupo] === undefined) {
          grupos[grupo] = [];
        }
        grupos[grupo].push(reserva);

        this.horario.push(reserva);
        fechaInicio = moment(reserva.fechaFin);
      }

      for (let grupo in grupos) {
        this.horarios.push({ grupo: grupo, disponibilidad: grupos[grupo] });
      }

      let horaAhora = ahora.getHours();

      if (horaAhora >= this.horaInicio && horaAhora <= this.horaFin && moment(ahora).diff(fechaInicio, 'days') === 0) {
        setTimeout(() => {
          this.scrollTo(this.constantes.EVENTOS.ACTUAL)
        }, 1);
      }
      this.actual = new Date();
    });
  }

  scrollTo(element: string) {
    if (!this.terms) {
      let yOffset = document.getElementById(element).offsetTop;
      this.content.scrollTo(0, yOffset - 50, 1000);
    }
  }

  reservar(reserva: ReservaOptions) {
    let usuario = this.usuario;
    if (!usuario) {
      this.genericAlert('Error de usuario', 'Usuario no existe');
    } else {
      let perfiles = usuario.perfiles;
      if (!perfiles || perfiles.length === 0) {
        this.genericAlert('Error de perfil de usuario', 'El usuario no tiene ningún perfil asignado');
      } else {
        let cantservicios: number = perfiles.map(perfil => perfil.servicios ? perfil.servicios.length : 0).reduce((a, b) => a + b);

        if (!cantservicios || cantservicios === 0) {
          this.genericAlert('Error de servicios de usuario', 'El usuario no tiene ningún servicio asignado');
        } else {
          this.navCtrl.push('ReservaPage', {
            disponibilidad: reserva,
            horario: this.horario,
            usuario: this.usuario
          });
        }
      }
    }
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  private eliminar(reserva: ReservaOptions) {
    let fechaInicio = moment(reserva.fechaInicio).locale("es").format("dddd, DD [de] MMMM [de] YYYY");
    let horaInicio = moment(reserva.fechaInicio).format("hh:mm a");
    let nombreCliente = reserva.cliente.nombre;
    let cancelarAlert = this.alertCtrl.create({
      title: 'Cancelar cita',
      message: 'Desea cancelar la cita el día: ' + fechaInicio + ' a las ' + horaInicio,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Si',
          handler: () => {
            let batch = this.afs.firestore.batch();
            let canceladoDoc: AngularFirestoreDocument<ReservaOptions> = this.disponibilidadDoc.collection('cancelados').doc(new Date().getTime().toString());
            reserva.estado = DataProvider.ESTADOS_RESERVA.CANCELADO;
            batch.set(canceladoDoc.ref, reserva);

            let disponibilidadCancelarDoc: AngularFirestoreDocument = this.disponibilidadDoc.collection('disponibilidades').doc(reserva.fechaInicio.getTime().toString());

            batch.delete(disponibilidadCancelarDoc.ref);

            let mesServicio = moment(reserva.fechaInicio).startOf('month');

            let totalesServiciosDoc = this.afs.doc(this.filePathEmpresa + '/totalesservicios/' + mesServicio);

            let totalServiciosReserva = reserva.servicio.map(servicioReserva => Number(servicioReserva.valor)).reduce((a, b) => a + b);

            this.disponibilidadDoc.ref.get().then(datosDiarios => {
              let totalDiarioActual = datosDiarios.get('totalServicios');
              let cantidadDiarioActual = datosDiarios.get('cantidadServicios');
              let totalDiario = Number(totalDiarioActual) - totalServiciosReserva;
              let cantidadDiario = Number(cantidadDiarioActual) - 1;
              batch.update(this.disponibilidadDoc.ref, { totalServicios: totalDiario, cantidadServicios: cantidadDiario, fecha: new Date() });

              totalesServiciosDoc.ref.get().then(() => {
                batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: new Date() });

                let totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(this.usuario.id);

                totalesServiciosUsuarioDoc.ref.get().then(datos => {
                  let totalActual = datos.get('totalServicios');
                  let cantidadActual = datos.get('cantidadServicios');
                  batch.update(totalesServiciosUsuarioDoc.ref, { totalServicios: Number(totalActual) - totalServiciosReserva, cantidadServicios: Number(cantidadActual) - 1, fecha: new Date() });

                  batch.commit().then(() => {
                    this.genericAlert('Cita cancelada', 'La cita con ' + nombreCliente + ' ha sido cancelada');
                  }).catch(err => this.genericAlert('Error', err));
                });
              });
            });
          }
        }
      ],
    });
    cancelarAlert.present();
  }

  cancelar(slidingItem: ItemSliding, reserva: ReservaOptions) {
    this.eliminar(reserva);
    slidingItem.close();
  }

  configActionSheet(title: string, filtros) {
    let actionSheet = this.actionSheetCtrl.create({
      title: title,
      buttons: filtros
    });
    actionSheet.present();
  }

  filtroUsuarios(usuarios: UsuarioOptions[]) {
    let filtros: any = [];
    usuarios.forEach(usuario => {
      filtros.push({
        text: usuario.nombre, handler: () => {
          this.usuario = usuario;
          this.updateUsuario(usuario.id);
        }
      });
    });

    this.configActionSheet('Selecciona usuario', filtros);
  }

  filtroPerfiles() {
    let filtros: any = [];
    let todosPerfiles: PerfilOptions = { id: '', nombre: 'Todos los perfiles', imagen: null, servicios: null, activo: null, grupo: null }
    filtros.push({
      text: todosPerfiles.nombre, handler: () => {
        this.filtroUsuarios(this.usuarios);
      }
    });

    this.perfiles.forEach(perfil => {
      filtros.push({
        text: perfil.nombre,
        handler: () => {
          let usuarios = this.usuarios.filter(usuario => usuario.perfiles.some(item => item.id === perfil.id));
          this.filtroUsuarios(usuarios);
        }
      });
    });

    this.configActionSheet('Selecciona perfil', filtros);
  }

  presentPopover(myEvent) {
    let popover = this.popoverCtrl.create('PendientePagoPage');
    popover.present({
      ev: myEvent
    });
  }

}