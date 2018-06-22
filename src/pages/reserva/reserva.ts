import moment from 'moment';
import { Component } from '@angular/core';
import { AlertController, IonicPage, ModalController, NavParams, PopoverController, ViewController, NavController, Events } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { IndiceOptions } from '../../interfaces/indice-options';

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

  cantidad = 0;
  totalServicios: number = 0;
  ultimoHorario: Date;
  carrito: ReservaOptions[] = [];
  disponibilidadSeleccionada: ReservaOptions;
  disponibilidadBloquear: ReservaOptions[] = [];
  horario: ReservaOptions[];
  servicios: ServicioOptions[];
  usuario: UsuarioOptions;
  constantes = DataProvider;
  grupoServicios: any[];
  idcarrito: number;

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
    public viewCtrl: ViewController,
    private afs: AngularFirestore
  ) {
    this.disponibilidadSeleccionada = this.navParams.get('disponibilidad');
    this.horario = this.navParams.get('horario');
    this.ultimoHorario = this.disponibilidadSeleccionada.fechaInicio;
    this.usuario = this.navParams.get('usuario');
    this.servicios = this.navParams.get('servicios');
    this.updateCarrito();
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

  updateCarrito() {
    if (!this.disponibilidadSeleccionada || !this.disponibilidadSeleccionada.idcarrito) {
      let indiceCarritoDoc = this.afs.doc<IndiceOptions>('indices/idcarrito');

      if (!this.idcarrito) {
        indiceCarritoDoc.ref.get().then(data => {
          if (data.exists) {
            this.idcarrito = data.get('id');
            indiceCarritoDoc.set({ id: this.idcarrito + 1 });
          } else {
            this.idcarrito = 0;
            indiceCarritoDoc.set({ id: 1 });
          }
        });
      }
    }
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

    let promises = [];
    this.carrito.forEach(reservaNueva => {
      let reservaDoc: AngularFirestoreDocument<ReservaOptions> = this.afs.doc<ReservaOptions>('disponibilidades/' + this.disponibilidadSeleccionada.fechaInicio.getTime());
      promises.push(
        reservaDoc.ref.get().then(data => {
          if (!data.exists) {
            data.ref.set(reservaNueva);
            this.horario.push(reservaNueva);
          } else if (data.get('estado') !== DataProvider.ESTADOS_RESERVA.DISPONIBLE) {
            throw new Error('La disponibilidad para el horario ' + reservaNueva.fechaInicio + ' no se encuentra disponible');
          }
        }).catch(err => {
          return Promise.reject(err);
        })
      );
    });

    Promise.all(promises).then(() => {
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
    }).catch(err => {
      this.alertCtrl.create({
        title: 'Error procesando reserva',
        message: err,
        buttons: [{
          text: 'OK',
          handler: () => {
            this.navCtrl.pop();
          }
        }]
      }).present();
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
