import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ModalController, NavController } from 'ionic-angular';
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
  public horaFin = 19;
  public tiempoServicio = 10;

  public horario: ReservaOptions[];

  private estadoDisponibilidad: string[] = ['Disponible', 'Reservado', 'Finalizado', 'Ejecutando'];

  constructor(public navCtrl: NavController, public modalCtrl: ModalController, public alertCtrl: AlertController) {
  }

  ionViewDidLoad() {
    this.updateHorarios();
  }

  ionViewDidEnter() {
    //this.scrollTo(this.evento[0]);
  }

  setDate(date: Date) {
    this.initDate = date;
    this.updateHorarios();
  }

  updateHorarios() {
    this.horario = [];
    let fechaInicio = moment(this.initDate).startOf('day').hours(this.horaInicio);
    let fechaFin = moment(this.initDate).hours(this.horaFin);
    while (fechaInicio.isBefore(fechaFin.toDate())) {
      let fechaInicioReserva = fechaInicio.toDate();
      let fechaFinReserva = moment(fechaInicio).add(this.tiempoServicio, 'minutes').toDate();
      let eventoActual = moment(this.actual).isBetween(fechaInicioReserva, fechaFinReserva);
      let alet = Math.round(Math.random() * 1);
      let reserva: ReservaOptions = {
        fechaInicio: fechaInicioReserva,
        fechaFin: fechaFinReserva,
        estado: this.estadoDisponibilidad[alet],
        evento: this.evento[1],
        cliente: { identificacion: null, nombre: null, telefono: null, correoelectronico: null },
        usuario: this.usuario
      };

      let esReserva = reserva.estado === this.estadoDisponibilidad[1];
      if (esReserva) {
        reserva.cliente = { identificacion: 123, nombre: 'Pedro Perez', telefono: '4527474', correoelectronico: null };
      }

      if (eventoActual) {
        reserva.evento = this.evento[0];
        if (esReserva) {
          reserva.estado = this.estadoDisponibilidad[3];
        }
      }

      this.horario.push(reserva);
      fechaInicio = moment(reserva.fechaFin);
    }
  }

  scrollTo(element: string) {
    let yOffset = document.getElementById(element).offsetTop;
    this.content.scrollTo(0, yOffset - 10, 1000)
  }

  reservar(reserva: ReservaOptions) {
    let clienteModal = this.modalCtrl.create('DetallePersonaPage');
    clienteModal.onDidDismiss(data => {
      if (moment(new Date()).isBefore(reserva.fechaFin) && data) {
        reserva.cliente = data;
        reserva.estado = this.estadoDisponibilidad[1];
        this.navCtrl.push('ReservaPage');
      }
    });
    clienteModal.present();
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  cancelar(reserva: ReservaOptions) {
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
            this.genericAlert('Cita cancelada', 'La cita con '+ nombreCliente +' ha sido cancelada');
          }
        }
      ],
    });

    cancelarAlert.present();
  }

}
