import moment from 'moment';
import { Component } from '@angular/core';
import { AlertController, IonicPage, ModalController, NavParams, PopoverController, ViewController, NavController, Events } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';

/**
 * Generated class for the ReservaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-reserva',
  templateUrl: 'reserva.html',
})

export class ReservaPage {

  public cantidad = 0;
  public totalServicios: number = 0;
  public ultimoHorario: Date;
  public carrito: ReservaOptions[] = [];
  public disponibilidadSeleccionada: ReservaOptions;
  public disponibilidadBloquear: ReservaOptions[] = [];
  public horario: ReservaOptions[];
  public servicios: ServicioOptions[];
  public usuario: UsuarioOptions;
  public constantes = DataProvider;
  public grupoServicios: any[];
  public idcarrito = 1;

  public cliente: ClienteOptions = {
    identificacion: null,
    nombre: null,
    telefono: null,
    correoelectronico: null
  };

  constructor(
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    private events: Events,
    private navCtrl: NavController,
    private navParams: NavParams,
    public popoverCtrl: PopoverController,
    public viewCtrl: ViewController) {
    this.disponibilidadSeleccionada = this.navParams.get('disponibilidad');
    this.horario = this.navParams.get('horario');
    this.ultimoHorario = this.disponibilidadSeleccionada.fechaInicio;
    this.usuario = this.navParams.get('usuario');
    this.servicios = this.navParams.get('servicios');
  }

  ionViewDidLoad() {
    let clienteModal = this.modalCtrl.create('ClientePage');
    clienteModal.onDidDismiss(data => {
      if (data) {
        this.cliente = data;
      } else {
        this.viewCtrl.dismiss();
      }
    });
    clienteModal.present();
    this.updateServicios();
  }

  updateServicios() {
    let grupos = [];
    this.grupoServicios = [];
    this.servicios.forEach(servicio => {
      let grupo = servicio.grupo;
      if (grupos[grupo] === undefined) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(servicio);
    });

    for (let grupo in grupos) {
      this.grupoServicios.push({ grupo: grupo, servicios: grupos[grupo] });
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

  agregar(servicio: ServicioOptions) {
    let disponibilidadBloquear: ReservaOptions[] = [];
    let disponibilidadEncontrada: ReservaOptions;
    let disponible: boolean = true;
    let contador = 0;
    for (let i = 0; i <= servicio.duracion_MIN / 10 - 1; i++) {
      contador = i;
      let horaInicio = moment(this.ultimoHorario).add(i * 10, 'minutes').toDate();

      disponibilidadEncontrada = this.horario.filter(disponibilidad =>
        disponibilidad.fechaInicio.getTime() === horaInicio.getTime()
      )[0];

      if (!disponibilidadEncontrada || disponibilidadEncontrada.estado !== this.constantes.ESTADOS_RESERVA.DISPONIBLE) {
        disponible = false;
        break;
      } else {
        disponibilidadEncontrada.servicio = servicio;
        disponibilidadBloquear.push(disponibilidadEncontrada);
      }
    }

    if (disponible || (!disponibilidadEncontrada && contador > 0)) {
      this.disponibilidadBloquear.push.apply(this.disponibilidadBloquear, disponibilidadBloquear);
      this.cantidad++;
      servicio.activo = false;
      this.carrito.push({
        servicio: servicio,
        fechaInicio: disponibilidadBloquear[0].fechaInicio,
        fechaFin: disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin,
        cliente: this.cliente,
        estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
        evento: this.constantes.EVENTOS.OTRO,
        usuario: this.usuario,
        idcarrito: this.idcarrito
      });
      this.ultimoHorario = disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin;
      this.totalServicios += servicio.valor;
    } else if (contador === 0) {
      this.genericAlert('Error al reservar', 'La cita se cruza con ' + disponibilidadEncontrada.cliente.nombre + ', la reserva ha sido cancelada');
    } else {
      let fechaInicio = moment(disponibilidadEncontrada.fechaInicio).locale("es").format("dddd, DD [de] MMMM [de] YYYY");
      let horaInicio = moment(disponibilidadEncontrada.fechaInicio).format("hh:mm a");
      let cruceAlert = this.alertCtrl.create({
        title: 'Cruce de cita',
        message: 'La cita ' + fechaInicio + ' a las ' + horaInicio + ' se cruza con la cita de ' + disponibilidadEncontrada.cliente.nombre + '\n ¿Desea continuar con esta reserva?',
        buttons: [
          {
            text: 'NO',
            handler: () => {
              disponibilidadBloquear = [];
              this.genericAlert('Reserva cancelada', 'La reserva con ' + this.cliente.nombre + ' ha sido cancelada');
            }
          },
          {
            text: 'SI',
            handler: () => {
              this.disponibilidadBloquear.push.apply(this.disponibilidadBloquear, disponibilidadBloquear);
              servicio.activo = false;
              this.carrito.push({
                servicio: servicio,
                fechaInicio: disponibilidadBloquear[0].fechaInicio,
                fechaFin: disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin,
                cliente: this.cliente,
                estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
                evento: this.constantes.EVENTOS.OTRO,
                usuario: this.usuario,
                idcarrito: this.idcarrito
              });
              this.cantidad++;
              this.ultimoHorario = disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin;
              this.totalServicios += servicio.valor;
            }
          }
        ],
      });
      cruceAlert.present();
    }
  }

  eliminar(servicio: ReservaOptions) {
    this.disponibilidadBloquear = [];
    let item = this.carrito.indexOf(servicio);
    let carrito = this.carrito;
    carrito.splice(item, 1);

    this.carrito = [];
    this.cantidad = 0;
    this.totalServicios = 0;
    this.ultimoHorario = this.disponibilidadSeleccionada.fechaInicio;

    carrito.forEach(servicioAdquirido => {
      this.agregar(servicioAdquirido.servicio);
    });

    servicio.servicio.activo = true;
  }

  guardar() {
    this.servicios.map(a => a.activo = true);
    this.carrito.forEach(reservaNueva => {
      this.horario.push(reservaNueva);
    });

    this.disponibilidadBloquear.forEach((bloquear, index) => {
      let item = this.horario.indexOf(bloquear);
      this.horario.splice(item, 1);
    });

    this.horario.sort(function (a, b) {
      if (a.fechaInicio > b.fechaInicio) {
        return 1;
      }
      if (a.fechaInicio < b.fechaInicio) {
        return -1;
      }
      return 0;
    });

    this.navCtrl.pop().then(() => {
      this.events.publish('actualizar-agenda', this.horario);
    });
  }

  ver(event) {
    let carritoOptions = this.popoverCtrl.create('CarritoPage', {
      servicios: this.carrito,
      total: this.totalServicios
    });

    carritoOptions.present({
      ev: event
    });

    carritoOptions.onDidDismiss(data => {
      if (data && data.metodo === 'eliminar') {
        this.eliminar(data.servicio);
      } else if (data && data.metodo === 'guardar') {
        this.guardar();
      }
    });
  }

}
