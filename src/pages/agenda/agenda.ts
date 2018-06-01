import { Component, ViewChild } from '@angular/core';
import { Content, IonicPage, NavController } from 'ionic-angular';
import moment from 'moment';

import { ReservaOptions } from '../../interfaces/reserva-options';

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
    weekdays: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  };

  public evento: any = ['actual', 'otro'];

  public localDate: Date = new Date();
  public initDate: Date = new Date();
  public initDate2: Date = new Date();
  public disabledDates: Date[] = [];
  public maxDate: Date = new Date(new Date().setDate(new Date().getDate() + 30));
  public min: Date = new Date();

  public horaInicio = 7;
  public horaFin = 19;
  public tiempoServicio = 40;

  public horario: ReservaOptions[];

  private estadoDisponibilidad: String[] = ['Disponible', 'Reservado', 'Finalizado', 'Ejecutando'];

  constructor(public navCtrl: NavController) {
  }

  ionViewDidLoad() {
    this.updateHorarios();
  }

  ionViewDidEnter() {
    this.scrollTo(this.evento[0]);
  }

  public Log(stuff): void {
    console.log(stuff);
  }

  public event(data: Date): void {
    this.localDate = data;
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
      let eventoActual = moment(new Date()).isBetween(fechaInicioReserva, fechaFinReserva);
      let alet = Math.round(Math.random() * 1);
      let reserva: ReservaOptions = {
        fechaInicio: fechaInicioReserva,
        fechaFin: fechaFinReserva,
        estado: this.estadoDisponibilidad[alet],
        evento: this.evento[1],
        cliente: { id: null, nombre: null, telefono: null },
        usuario: null
      };

      let esReserva = reserva.estado === this.estadoDisponibilidad[1];
      if (esReserva) {
        reserva.cliente = { id: 123, nombre: 'Pedro Perez', telefono: '4527474' };
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
    this.content.scrollTo(0, yOffset, 500)
  }

}
