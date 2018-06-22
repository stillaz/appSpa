import moment from 'moment';
import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ItemSliding, NavController, Events, ActionSheetController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { ReservaProvider } from '../../providers/reserva';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import { PerfilOptions } from '../../interfaces/perfil-options';

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

  horaInicio = 7;
  horaFin = 24;
  tiempoServicio = 10;
  actual: Date;
  initDate: Date = new Date();
  initDate2: Date = new Date();
  disabledDates: Date[] = [];
  maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 30));
  min: Date = new Date();
  constantes = DataProvider;
  usuario = {} as UsuarioOptions;
  usuarioLogueado: UsuarioOptions;
  horario: ReservaOptions[];
  horarios: any[];
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  cliente = {} as ClienteOptions;
  servicio = {} as ServicioOptions;
  administrador: boolean;
  usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;
  perfiles: PerfilOptions[];
  usuarios: UsuarioOptions[];

  constructor(
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public events: Events,
    public navCtrl: NavController,
    private reservaCtrl: ReservaProvider,
    private afs: AngularFirestore,
    private afa: AngularFireAuth
  ) {
    this.usuariosCollection = this.afs.collection<UsuarioOptions>('usuarios');
    this.updateUsuario();
    this.updateUsuarios();
    this.updatePerfiles();
  }

  ionViewDidLoad() {
    this.updateHorariosInicial();
    Observable.interval(60000).subscribe(ex => {
      this.updateHorarios();
    });
  }

  ionViewDidEnter() {
    if (new Date().getHours() >= this.horaInicio) {
      this.scrollTo(this.constantes.EVENTOS.ACTUAL);
    }
    this.actual = new Date();
  }

  updateUsuarios() {
    this.usuariosCollection.valueChanges().subscribe(data => {
      if (data) {
        this.usuarios = data;
      }
    });
  }

  updatePerfiles() {
    let perfilesCollection: AngularFirestoreCollection<PerfilOptions>;
    perfilesCollection = this.afs.collection<PerfilOptions>('perfiles');
    perfilesCollection.valueChanges().subscribe(data => {
      if (data) {
        this.perfiles = data;
      }
    });
  }

  updateUsuario() {
    let user = this.afa.auth.currentUser;
    this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
    this.usuarioDoc.valueChanges().subscribe(data => {
      if (data) {
        this.usuarioLogueado = data;
        this.usuario = data;
        this.administrador = this.usuarioLogueado.perfiles.some(perfil => perfil.id === 0);
      } else{
        this.genericAlert('Error usuario', 'Usuario no encontrado');
      }
    });
  }

  setDate(date: Date) {
    this.initDate = date;
    this.updateHorariosInicial();
  }

  updateHorariosInicial() {
    this.horario = [];
    this.horarios = [];
    let grupos = [];
    let fechaInicio = moment(this.initDate).startOf('day').hours(this.horaInicio);
    let fechaFin = moment(this.initDate).hours(this.horaFin);
    while (fechaInicio.isSameOrBefore(fechaFin.toDate())) {
      let fechaInicioReserva = fechaInicio.toDate();
      let fechaFinReserva = moment(fechaInicio).add(this.tiempoServicio, 'minutes').toDate();
      let eventoActual = moment(new Date()).isBetween(fechaInicioReserva, fechaFinReserva);
      let reserva: ReservaOptions = {
        fechaInicio: fechaInicioReserva,
        fechaFin: fechaFinReserva,
        estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
        evento: this.constantes.EVENTOS.OTRO,
        idcarrito: null,
        cliente: this.cliente,
        usuario: this.usuario,
        servicio: this.servicio
      };

      if (eventoActual) {
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
  }

  scrollTo(element: string) {
    let yOffset = document.getElementById(element).offsetTop;
    this.content.scrollTo(0, yOffset - 50, 1000)
  }

  updateHorarios() {
    this.horarios = [];
    let grupos = [];
    this.horario.forEach(reserva => {
      let eventoActual = moment(new Date()).isBetween(reserva.fechaInicio, reserva.fechaFin);

      if (eventoActual) {
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
    });

    for (let grupo in grupos) {
      this.horarios.push({ grupo: grupo, disponibilidad: grupos[grupo] });
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
        perfiles.forEach(perfil => {
          let servicios = perfil.servicios;
          if (!servicios || servicios.length === 0) {
            this.genericAlert('Error de servicios de usuario', 'El usuario no tiene ningún servicio asignado');
          } else {
            this.navCtrl.push('ReservaPage', {
              disponibilidad: reserva,
              horario: this.horario,
              usuario: this.usuario,
              servicios: servicios
            });
          }
        });
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

  eliminar(reserva: ReservaOptions) {
    let ultimoHorario = reserva.fechaInicio;
    for (let i = 0; i <= reserva.servicio.duracion_MIN / 10 - 1; i++) {
      let disponibilidad: ReservaOptions = {
        fechaInicio: ultimoHorario,
        fechaFin: moment(ultimoHorario).add(this.tiempoServicio, 'minutes').toDate(),
        estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
        evento: this.constantes.EVENTOS.OTRO,
        cliente: this.cliente,
        servicio: this.servicio,
        usuario: this.usuario,
        idcarrito: null
      }

      this.horario.push(disponibilidad);

      ultimoHorario = disponibilidad.fechaFin;
    }

    let item = this.horario.indexOf(reserva);
    this.horario.splice(item, 1);

    this.horario.sort(function (a, b) {
      if (a.fechaInicio > b.fechaInicio) {
        return 1;
      }
      if (a.fechaInicio < b.fechaInicio) {
        return -1;
      }
      return 0;
    });
  }

  cancelar(slidingItem: ItemSliding, reserva: ReservaOptions) {
    let fechaInicio = moment(reserva.fechaInicio).locale("es").format("dddd, DD [de] MMMM [de] YYYY");
    let horaInicio = moment(reserva.fechaInicio).format("hh:mm a");
    let nombreCliente = reserva.cliente.nombre;
    let cancelarAlert = this.alertCtrl.create({
      title: 'Cancelar cita',
      message: 'Desea cancelar la cita el día: ' + fechaInicio + ' a las ' + horaInicio,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: () => {
            this.eliminar(reserva);

            let otrasreservas = this.reservaCtrl.getOtrasReservasByIdServicioAndNotFinalizado(this.horario, reserva);

            otrasreservas.forEach(otrareserva => {
              this.eliminar(otrareserva);
            });

            this.updateHorarios();

            this.genericAlert('Cita cancelada', 'La cita con ' + nombreCliente + ' ha sido cancelada');
          }
        }
      ],
    });
    cancelarAlert.present();
    slidingItem.close();
  }

  terminar(reserva: ReservaOptions) {
    let reservado = this.constantes.ESTADOS_RESERVA.RESERVADO;
    let tiempoSiguiente = null;
    let siguiente = this.horario.find(function (disponiblidad) {
      return disponiblidad.fechaInicio >= reserva.fechaFin && disponiblidad.estado === reservado;
    });

    if (siguiente) {
      tiempoSiguiente = moment(siguiente.fechaInicio).diff(new Date(), 'minutes');
    }

    reserva.estado = this.constantes.ESTADOS_RESERVA.FINALIZADO;

    let serviciosFinalizados = this.reservaCtrl.getReservasByIdServicioAndFinalizado(this.horario, reserva);

    let total = serviciosFinalizados.map(a => a ? a.servicio.valor : 0).reduce((a, b) => a + b);

    let mensaje = tiempoSiguiente ? 'El próximo servicio empieza en: ' + tiempoSiguiente + ' minutos' : 'No hay más citas asignadas';
    this.genericAlert('Servicio finalizado', 'El servicio ha terminado satisfactoriamente. ' + mensaje);

    this.genericAlert('Servicio finalizado', 'Valor servicios: ' + total);
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
        text: usuario.nombre + ': ' + usuario.perfiles.map(perfil => perfil.nombre).join(" - "), handler: () => {
          this.usuario = usuario;
          this.updateHorariosInicial();
        }
      });
    });

    this.configActionSheet('Selecciona usuario', filtros);
  }

  filtroPerfiles() {
    let filtros: any = [];
    let todosPerfiles: PerfilOptions = { id: 0, nombre: 'Todos los perfiles', imagen: null, servicios: null, activo: null }
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

}
