import moment from 'moment';
import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ItemSliding, NavController, Events, ActionSheetController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { UsuarioProvider } from '../../providers/usuario';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { PerfilProvider } from '../../providers/perfil';

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

  public horaInicio = 7;
  public horaFin = 24;
  public tiempoServicio = 10;
  public actual: Date;
  public initDate: Date = new Date();
  public initDate2: Date = new Date();
  public disabledDates: Date[] = [];
  public maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 30));
  public min: Date = new Date();
  public constantes = DataProvider;
  public usuario: UsuarioOptions;
  public usuarioLogueado: UsuarioOptions;
  public horario: ReservaOptions[];
  public horarios: any[];

  public cliente: ClienteOptions = {
    identificacion: null,
    nombre: null,
    telefono: null,
    correoelectronico: null
  };

  public servicio: ServicioOptions = {
    id: null,
    nombre: null,
    descripcion: null,
    grupo: null,
    valor: null,
    duracion_MIN: null,
    activo: null,
    imagen: null
  }

  constructor(
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public events: Events,
    public navCtrl: NavController,
    private perfilCtrl: PerfilProvider,
    private usuarioCtrl: UsuarioProvider
  ) {
    this.usuarioLogueado = this.usuarioCtrl.getUsuarios()[0];
    this.usuario = this.usuarioLogueado;
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
    let serviciosUsuario = this.usuarioCtrl.getServicios(this.usuario);
    if (!serviciosUsuario || serviciosUsuario.length === 0) {
      this.genericAlert('Error', 'El usuario no tiene servicios');
    } else {
      this.events.subscribe('actualizar-agenda', data => {
        this.horario = data;
        this.updateHorarios();
        this.genericAlert('Reserva registrada', 'Se ha registrado la reserva');
        this.events.unsubscribe('actualizar-agenda');
      });

      this.navCtrl.push('ReservaPage', {
        disponibilidad: reserva,
        horario: this.horario,
        usuario: this.usuario,
        servicios: serviciosUsuario
      });
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
            let ultimoHorario = reserva.fechaInicio;
            for (let i = 0; i <= reserva.servicio.duracion_MIN / 10 - 1; i++) {
              let disponibilidad: ReservaOptions = {
                fechaInicio: ultimoHorario,
                fechaFin: moment(ultimoHorario).add(this.tiempoServicio, 'minutes').toDate(),
                estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
                evento: this.constantes.EVENTOS.OTRO,
                cliente: this.cliente,
                servicio: this.servicio,
                usuario: this.usuario
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
    let mensaje = tiempoSiguiente ? 'El próximo servicio empieza en: ' + tiempoSiguiente + ' minutos' : 'No hay más citas asignadas';
    this.genericAlert('Servicio finalizado', 'El servicio ha terminado satisfactoriamente. ' + mensaje);
  }

  isAdministrador(): boolean {
    return this.usuarioCtrl.isAdministrador(this.usuarioLogueado);
  }

  configActionSheet(title: string, filtros){
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
    let usuarios: UsuarioOptions[];
    filtros.push({
      text: 'Todos los perfiles', handler: () => {
        usuarios = this.usuarioCtrl.getUsuarios();
        this.filtroUsuarios(usuarios);
      }
    });

    this.perfilCtrl.getPerfiles().forEach(perfil => {
      filtros.push({
        text: perfil.nombre, handler: () => {
          usuarios = this.usuarioCtrl.getUsuariosByPerfil(perfil);
          this.filtroUsuarios(usuarios);
        }
      });
    });
    
    this.configActionSheet('Selecciona perfil', filtros);
  }

}
