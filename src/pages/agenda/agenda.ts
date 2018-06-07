import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ItemSliding, NavController, Events } from 'ionic-angular';
import moment from 'moment';

import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ServicioOptions } from '../../interfaces/servicio-options';

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

  public actual: Date = new Date();
  public initDate: Date = new Date();
  public initDate2: Date = new Date();
  public disabledDates: Date[] = [];
  public maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 30));
  public min: Date = new Date();

  public evento = ['actual', 'otro'];

  public localeStrings = {
    monday: false,
    weekdays: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };

  public cliente: ClienteOptions = { identificacion: null, nombre: null, telefono: null, correoelectronico: null };
  public servicio: ServicioOptions = { id: null, nombre: null, descripcion: null, grupo: null, valor: null, duracion_MIN: null, activo: null, imagen: null }
  public usuario: UsuarioOptions = { id: 123, nombre: 'El Barbero' };

  public horarios: any[];

  public horario: ReservaOptions[];

  private estadoDisponibilidad: string[] = ['Disponible', 'Reservado', 'Finalizado', 'Ejecutando'];

  constructor(public navCtrl: NavController, public alertCtrl: AlertController, public events: Events) {
  }

  ionViewDidLoad() {
    this.updateHorariosInicial();
  }

  ionViewDidEnter() {
    if (new Date().getHours() >= this.horaInicio) {
      this.scrollTo(this.evento[0]);
    }
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
      let eventoActual = moment(this.actual).isBetween(fechaInicioReserva, fechaFinReserva);
      let reserva: ReservaOptions = {
        fechaInicio: fechaInicioReserva,
        fechaFin: fechaFinReserva,
        estado: this.estadoDisponibilidad[0],
        evento: this.evento[1],
        cliente: this.cliente,
        usuario: this.usuario,
        servicio: this.servicio
      };

      if (eventoActual) {
        reserva.evento = this.evento[0];
        if (reserva.estado === this.estadoDisponibilidad[1]) {
          reserva.estado = this.estadoDisponibilidad[3];
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
      let eventoActual = moment(this.actual).isBetween(reserva.fechaInicio, reserva.fechaFin);

      if (eventoActual) {
        reserva.evento = this.evento[0];
        if (reserva.estado === this.estadoDisponibilidad[1]) {
          reserva.estado = this.estadoDisponibilidad[3];
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
    this.events.subscribe('actualizar-agenda', (data) => {
      this.horario = data;
      this.updateHorarios();
      this.events.unsubscribe('actualizar-agenda'); // unsubscribe this event
    })

    this.navCtrl.push('ReservaPage', {
      disponibilidad: reserva,
      horario: this.horario
    });
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
              let inicio = moment(ultimoHorario).add(i * this.tiempoServicio, 'minutes').toDate();
              let fin = moment(horaInicio).add(this.tiempoServicio, 'minutes').toDate();
              let disponibilidad: ReservaOptions = {
                fechaInicio: inicio,
                fechaFin: fin,
                estado: this.estadoDisponibilidad[0],
                evento: this.evento[1],
                cliente: this.cliente,
                servicio: this.servicio,
                usuario: this.usuario
              }

              this.horario.push(disponibilidad);

              ultimoHorario = fin;
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

}
