import moment from 'moment';
import { Component } from '@angular/core';
import { AlertController, IonicPage, ModalController, NavParams, PopoverController, ViewController, NavController, ToastController, LoadingController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { IndiceOptions } from '../../interfaces/indice-options';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import { PaqueteOptions } from '../../interfaces/paquete-options';

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
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  disponibilidadDoc: AngularFirestoreDocument;
  horaSeleccionada: string;
  tiempoDisponibilidad: number;
  filePathEmpresa: string;
  carritoPaquete: any[] = [];

  public cliente: ClienteOptions = {} as ClienteOptions;

  constructor(
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    private navCtrl: NavController,
    private navParams: NavParams,
    public popoverCtrl: PopoverController,
    public viewCtrl: ViewController,
    private afs: AngularFirestore,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController
  ) {
    this.disponibilidadSeleccionada = this.navParams.get('disponibilidad');
    this.horario = this.navParams.get('horario');
    this.usuario = this.navParams.get('usuario');
    this.filePathEmpresa = 'negocios/' + this.usuario.idempresa;
    this.horaSeleccionada = moment(this.disponibilidadSeleccionada.fechaInicio).locale("es").format("dddd, DD [de] MMMM [de] YYYY [a las] h:mm a");
    this.ultimoHorario = this.disponibilidadSeleccionada.fechaInicio;
    this.usuarioDoc = this.afs.doc(this.filePathEmpresa + '/usuarios/' + this.usuario.id);
    let fecha = moment(this.ultimoHorario).startOf('day').toDate();
    this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    let datos: DisponibilidadOptions = {
      dia: fecha.getDate(),
      mes: fecha.getMonth() + 1,
      año: fecha.getFullYear(),
      id: fecha.getTime(),
      cantidadServicios: 0,
      totalServicios: 0,
      idusuario: this.usuario.id,
      imagenusuario: this.usuario.imagen,
      usuario: this.usuario.nombre
    };
    this.updateServicios();
    this.disponibilidadDoc.ref.get().then(datosDisp => {
      if (!datosDisp.exists) {
        this.disponibilidadDoc.set(datos);
      }
    });
  }

  updateServicios() {
    this.usuarioDoc.valueChanges().subscribe(data => {
      this.servicios = [];
      if (data) {
        this.tiempoDisponibilidad = data.configuracion ? data.configuracion.tiempoDisponibilidad : 30;
        data.perfiles.forEach(perfil => {
          this.servicios.push.apply(this.servicios, perfil.servicios);
        });
      }
    });
  }

  ionViewDidLoad() {
    let clienteModal = this.modalCtrl.create('ClientePage');
    clienteModal.onDidDismiss(data => {
      if (data) {
        this.cliente = data;
        this.updateCarrito();
      } else {
        this.viewCtrl.dismiss();
      }
    });
    clienteModal.present();
  }

  loadIdCarrito() {
    const indiceCarritoDoc = this.afs.doc<IndiceOptions>(this.filePathEmpresa + '/indices/idcarrito');
    return new Promise(resolve => {
      indiceCarritoDoc.ref.get().then(data => {
        this.idcarrito = data.exists ? data.get('id') : 1;
        indiceCarritoDoc.set({ id: this.idcarrito + 1 });
        resolve('ok');
      });
    })
  }

  updateCarrito() {
    if (!this.idcarrito && (!this.disponibilidadSeleccionada || !this.disponibilidadSeleccionada.idcarrito)) {
      this.loadIdCarrito().then(() => {
        this.updateServiciosCliente();
      });
    } else {
      this.updateServiciosCliente();
    }
  }

  updateServiciosCliente() {
    const filePathClienteServicio = this.filePathEmpresa + '/clientes/' + this.cliente.id + '/paquetes';
    const paquetesCollection = this.afs.collection<PaqueteOptions>(filePathClienteServicio, ref => ref.where('estado', '==', this.constantes.ESTADOS_PAQUETE.PENDIENTE));
    paquetesCollection.valueChanges().subscribe(paquetes => {
      if (paquetes) {
        this.carritoPaquete = paquetes.map(paquete => {
          return {
            idcarrito: paquete.idcarrito,
            servicio: paquete.servicio
          };
        });
      }
      this.updatePaquetes();
    });
  }

  updatePaquetes() {
    const grupos = [];
    this.grupoServicios = [];
    this.carritoPaquete.forEach(paquete => {
      const servicio = this.servicios.find(servicio => servicio.id === paquete.servicio.id);
      servicio.grupo = 'Paquetes activos';
    });

    this.servicios.forEach(servicio => {
      const grupo = servicio.grupo;
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

  validarReservaDisponible(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.carrito.forEach(reservaNueva => {
        let reservaDoc: AngularFirestoreDocument<ReservaOptions> = this.disponibilidadDoc.collection('disponibilidades').doc(reservaNueva.fechaInicio.getTime().toString());
        let read = reservaDoc.valueChanges().subscribe(data => {
          if (data) {
            reject('La disponibilidad ' + moment(reservaNueva.fechaInicio).locale('es').format('h:mm a') + ' fue reservada.');
          }
        });
        read.unsubscribe();
        resolve('ok');
      });
    });
  }

  guardar() {
    const batch = this.afs.firestore.batch();
    this.loadingCtrl.create({
      content: 'Procesando la reserva',
      dismissOnPageChange: true,
    }).present();
    this.validarReservaDisponible().then(() => {
      const fecha = new Date();
      this.carrito.forEach(reservaNueva => {
        const reservaDoc: AngularFirestoreDocument<ReservaOptions> = this.disponibilidadDoc.collection('disponibilidades').doc(reservaNueva.fechaInicio.getTime().toString());
        const mesServicio = moment(reservaNueva.fechaInicio).startOf('month');
        const totalesServiciosDoc = this.afs.doc(this.filePathEmpresa + '/totalesservicios/' + mesServicio);

        batch.set(reservaDoc.ref, reservaNueva);

        this.disponibilidadDoc.ref.get().then(datosDiarios => {
          if (datosDiarios.exists) {
            const pendientesDiarioActual = datosDiarios.get('pendientes');
            const pendientesDiario = Number(pendientesDiarioActual) + 1;
            batch.update(this.disponibilidadDoc.ref, {
              fecha: fecha,
              pendientes: pendientesDiario
            });
          } else {
            batch.set(this.disponibilidadDoc.ref, {
              totalServicios: 0,
              cantidadServicios: 0,
              pendientes: 1,
              fecha: fecha
            });
          }

          totalesServiciosDoc.ref.get().then(() => {
            batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: fecha });

            const totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(this.usuario.id);

            totalesServiciosUsuarioDoc.ref.get().then(datos => {
              if (datos.exists) {
                const pendientesActual = datos.get('pendientes');
                batch.update(totalesServiciosUsuarioDoc.ref, {
                  pendientes: Number(pendientesActual) + 1,
                  fecha: fecha
                });
              } else {
                const totalServicioUsuario: TotalesServiciosOptions = {
                  idusuario: this.usuario.id,
                  usuario: reservaNueva.nombreusuario,
                  imagenusuario: this.usuario.imagen,
                  totalServicios: 0,
                  cantidadServicios: 0,
                  pendientes: 1,
                  fecha: fecha
                }
                batch.set(totalesServiciosUsuarioDoc.ref, totalServicioUsuario);
              }

              batch.commit().then(() => {
                this.toastCtrl.create({
                  message: 'Se ha registrado la reserva',
                  duration: 3000
                }).present();
                this.navCtrl.pop();
              }).catch(err => {
                this.genericAlert('Error', err);
                this.navCtrl.pop();
              });
            });
          });
        });
      });
    }).catch(err => {
      this.genericAlert('Error reserva', err);
      this.navCtrl.pop();
    });
  }

  agregar(servicio: ServicioOptions) {
    let disponibilidadBloquear: ReservaOptions[] = [];
    let disponibilidadEncontrada: ReservaOptions;
    let disponible: boolean = true;
    let contador = 0;
    const paquete = this.carritoPaquete.find(paquete => paquete.servicio.id === servicio.id);
    const idcarrito = paquete ? paquete.idcarrito : this.idcarrito;

    for (let i = 0; i <= Number(Math.ceil(servicio.duracion_MIN / this.tiempoDisponibilidad) - 1); i++) {
      contador = i;
      let horaInicio = moment(this.ultimoHorario).add(i * this.tiempoDisponibilidad, 'minutes').toDate();

      disponibilidadEncontrada = this.horario.find(disponibilidad =>
        disponibilidad.fechaInicio.getTime() === horaInicio.getTime()
      );

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
      this.carrito.push({
        servicio: servicio,
        fechaInicio: disponibilidadBloquear[0].fechaInicio,
        fechaFin: disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin,
        cliente: this.cliente,
        estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
        evento: this.constantes.EVENTOS.OTRO,
        idcarrito: idcarrito,
        idusuario: this.usuario.id,
        nombreusuario: this.usuario.nombre,
        fechaActualizacion: null,
        id: null,
        leido: null,
        pago: null
      });
      this.ultimoHorario = disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin;
      this.totalServicios += Number(servicio.valor);
      this.guardar();
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
              this.carrito.push({
                servicio: servicio,
                fechaInicio: disponibilidadBloquear[0].fechaInicio,
                fechaFin: disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin,
                cliente: this.cliente,
                estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
                evento: this.constantes.EVENTOS.OTRO,
                idcarrito: idcarrito,
                idusuario: this.usuario.id,
                nombreusuario: this.usuario.nombre,
                fechaActualizacion: null,
                id: null,
                leido: null,
                pago: null
              });
              this.cantidad++;
              this.ultimoHorario = disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin;
              this.totalServicios += Number(servicio.valor);
            }
          }
        ],
      });
      cruceAlert.present();
    }
  }

}
