import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ItemSliding, NavController } from 'ionic-angular';
import moment from 'moment';

import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';

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

  public localeStrings: any = {
    monday: false,
    weekdays: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };

  public evento: any = ['actual', 'otro'];
  public usuario: UsuarioOptions = { id: 123, nombre: 'El Barbero' };
  public actual: Date = new Date();
  public initDate: Date = new Date();
  public initDate2: Date = new Date();
  public disabledDates: Date[] = [];
  public maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 30));
  public min: Date = new Date();

  public horaInicio = 7;
  public horaFin = 24;
  public tiempoServicio = 10;

  public horarios: any[];

  public horario: ReservaOptions[];

  private estadoDisponibilidad: string[] = ['Disponible', 'Reservado', 'Finalizado', 'Ejecutando'];

  constructor(public navCtrl: NavController, public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    this.updateHorarios();
  }

  ionViewDidEnter() {
    this.scrollTo(this.evento[0]);
  }

  setDate(date: Date) {
    this.initDate = date;
    this.updateHorarios();
  }

  updateHorarios() {
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
        cliente: { identificacion: null, nombre: null, telefono: null, correoelectronico: null },
        usuario: this.usuario,
        servicio: { id: null, nombre: null, descripcion: null, grupo: null, valor: null, duracion_MIN: null, activo: null, imagen: null }
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

  reservar(reserva: ReservaOptions) {
    this.navCtrl.push('ReservaPage', {
      disponibilidad: reserva,
      horario: this.horario
    });

    return this.navCtrl.viewDidLeave.subscribe(data => {
      this.horario = data.horario;
      return this.horario;
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
            reserva.cliente = { identificacion: null, nombre: null, telefono: null, correoelectronico: null };
            reserva.estado = this.estadoDisponibilidad[0];
            this.genericAlert('Cita cancelada', 'La cita con ' + nombreCliente + ' ha sido cancelada');
          }
        }
      ],
    });
    cancelarAlert.present();
    slidingItem.close();
  }

}
