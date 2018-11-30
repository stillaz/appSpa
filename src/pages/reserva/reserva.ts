import moment from 'moment';
import { Component } from '@angular/core';
import { AlertController, IonicPage, ModalController, NavParams, PopoverController, ViewController, NavController, ToastController, LoadingController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { IndiceOptions } from '../../interfaces/indice-options';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import { GrupoOptions } from '../../interfaces/grupo-options';
import { PaqueteClienteOptions } from '../../interfaces/paquete-cliente-options';
import { SesionPaqueteOptions } from '../../interfaces/sesion-paquete-options';

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
  private ultimoHorario: Date;
  private carrito: ReservaOptions[] = [];
  private disponibilidadSeleccionada: ReservaOptions;
  private horario: ReservaOptions[];
  private servicios: ServicioOptions[];
  private usuario: UsuarioOptions;
  private constantes = DataProvider;
  public grupoServicios: any[];
  public idcarrito: number;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  private disponibilidadDoc: AngularFirestoreDocument;
  private tiempoDisponibilidad: number;
  private filePathEmpresa: string;
  private carritoPaquete: any[] = [];
  public terms = 'paquetes';
  public paquetes: PaqueteOptions[];
  private filePathPaquete: string;
  private paqueteCollection: AngularFirestoreCollection<PaqueteOptions>;
  private filePathServicio: string;
  private servicioCollection: AngularFirestoreCollection<ServicioOptions>;
  public grupoPaquetes: any[];
  public cliente: ClienteOptions = {} as ClienteOptions;
  private empresaDoc: AngularFirestoreDocument;

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
    this.empresaDoc = this.afs.doc(this.filePathEmpresa);
    this.ultimoHorario = this.disponibilidadSeleccionada.fechaInicio;
    this.usuarioDoc = this.empresaDoc.collection('usuarios').doc(this.usuario.id);
    let fecha = moment(this.ultimoHorario).startOf('day').toDate();
    this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    let datos: DisponibilidadOptions = {
      dia: fecha.getDate(),
      mes: fecha.getMonth() + 1,
      año: fecha.getFullYear(),
      id: fecha.getTime(),
      cantidadServicios: 0,
      totalServicios: 0,
      usuario: this.usuario
    };
    this.filePathServicio = this.filePathEmpresa + '/servicios/';
    this.servicioCollection = this.afs.collection(this.filePathServicio);

    this.filePathPaquete = this.filePathEmpresa + '/paquetes/';
    this.paqueteCollection = this.afs.collection(this.filePathPaquete);
    this.updateUsuario();
    this.disponibilidadDoc.ref.get().then(datosDisp => {
      if (!datosDisp.exists) {
        this.disponibilidadDoc.set(datos);
      }
    });
  }

  updateUsuario() {
    this.usuarioDoc.valueChanges().subscribe(usuario => {
      const gruposPerfil: GrupoOptions[] = usuario.perfiles.filter(perfil => perfil.grupo).map(perfil => perfil.grupo.reduce(grupos => grupos));
      this.updateServicios(gruposPerfil);
      this.updatePaquetes(gruposPerfil);
    });
  }

  updateServicios(gruposPerfil: GrupoOptions[]) {
    this.servicioCollection.valueChanges().subscribe(servicios => {
      this.servicios = servicios.filter(servicio => gruposPerfil.some(grupoPerfil => grupoPerfil.id === servicio.grupo.id));
      this.updateGrupoServicios();
    });
  }

  updatePaquetes(gruposPerfil: GrupoOptions[]) {
    this.paqueteCollection.valueChanges().subscribe(paquetes => {
      this.paquetes = paquetes.filter(paquete => gruposPerfil.some(grupoPerfil => grupoPerfil.id === paquete.grupo.id));
      this.updateGrupoPaquetes();
    });
  }

  updateGrupoServicios() {
    const grupos = [];
    this.grupoServicios = [];
    this.servicios.forEach(servicio => {
      const grupo = servicio.grupo;
      if (grupos[grupo.id] === undefined) {
        grupos[grupo.id] = [];
      }
      grupos[grupo.id].push(servicio);
    });

    for (let grupo in grupos) {
      this.grupoServicios.push({ grupo: grupo, servicios: grupos[grupo] });
    }
  }

  updateGrupoPaquetes() {
    const grupos = [];
    this.grupoPaquetes = [];
    this.carritoPaquete.forEach(paquete => {
      const servicio = this.servicios.find(servicio => servicio.id === paquete.servicio.id);
      servicio.grupo = {
        id: '0',
        imagen: null,
        nombre: 'Paquetes activos'
      }
    });

    this.paquetes.forEach(paquete => {
      const grupo = paquete.grupo;
      if (grupos[grupo.id] === undefined) {
        grupos[grupo.id] = [];
      }
      grupos[grupo.id].push(paquete);
    });

    for (let grupo in grupos) {
      this.grupoPaquetes.push({ grupo: grupo, servicios: grupos[grupo] });
    }
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
            //idcarrito: paquete.idcarrito,
            //servicio: paquete.servicio
          };
        });
      }
      //this.updatePaquetes();
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

  guardar(batch: firebase.firestore.WriteBatch) {
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
            const pendientesDiario = pendientesDiarioActual === undefined ? 1 : Number(pendientesDiarioActual) + 1;
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
                  usuario: reservaNueva.usuario,
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

  agregarServicio(servicio: ServicioOptions) {
    const horaInicio = moment(this.ultimoHorario).add(this.tiempoDisponibilidad, 'minutes').toDate();
    const disponibilidadEncontrada = this.horario.find(disponibilidad =>
      disponibilidad.fechaInicio.getTime() === horaInicio.getTime()
    );

    if (!disponibilidadEncontrada || disponibilidadEncontrada.estado !== this.constantes.ESTADOS_RESERVA.DISPONIBLE) {
      this.genericAlert('Error al reservar', 'La hora de reserva no se encuentra disponible');
    } else {
      this.carrito.push({
        servicio: [servicio],
        fechaInicio: disponibilidadEncontrada.fechaInicio,
        fechaFin: disponibilidadEncontrada.fechaFin,
        cliente: this.cliente,
        estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
        evento: this.constantes.EVENTOS.OTRO,
        idcarrito: this.idcarrito,
        usuario: this.usuario,
        fechaActualizacion: null,
        id: null,
        leido: null,
        pago: null,
        paquete: null
      });
      const batch = this.afs.firestore.batch();
      this.guardar(batch);
    }
  }

  loadServiciosPaquete(paqueteDoc: AngularFirestoreDocument) {
    const servicioCollection = paqueteDoc.collection<ServicioOptions>('servicios');
    return new Promise<ServicioOptions[]>((resolve, reject) => {
      servicioCollection.valueChanges().subscribe(servicios => {
        if (servicios[0]) {
          resolve(servicios);
        } else {
          reject('El paquete no tiene servicios');
        }
      }, err => reject(err));
    });
  }

  loadSesionesPaquete(paqueteDoc: AngularFirestoreDocument) {
    const servicioCollection = paqueteDoc.collection<SesionPaqueteOptions>('sesiones');
    return new Promise<SesionPaqueteOptions[]>((resolve, reject) => {
      servicioCollection.valueChanges().subscribe(sesiones => {
        if (sesiones[0]) {
          resolve(sesiones);
        } else {
          reject('El paquete no tiene sesiones');
        }
      }, err => reject(err));
    });
  }

  loadPaqueteCliente(paquete: PaqueteOptions, batch: firebase.firestore.WriteBatch) {
    const idsesion = 1;
    const paqueteCliente: PaqueteClienteOptions = {
      actualizacion: new Date(),
      cliente: this.cliente,
      estado: this.constantes.ESTADOS_PAQUETE.PENDIENTE,
      id: this.idcarrito.toString(),
      idcarrito: this.idcarrito,
      pago: 0,
      paquete: paquete,
      registro: new Date(),
      servicios: null,
      sesion: idsesion,
      sesiones: null,
      valor: paquete.valor,
      serviciosActual: null
    }
    const paqueteDoc = this.paqueteCollection.doc(paquete.id);
    return new Promise<PaqueteClienteOptions>((resolve, reject) => {
      this.loadServiciosPaquete(paqueteDoc).then(servicios => {
        paqueteCliente.servicios = servicios;
        this.loadSesionesPaquete(paqueteDoc).then(sesiones => {
          paqueteCliente.sesiones = sesiones;
          const sesionActual = sesiones.find(sesion => sesion.id === idsesion.toString());
          paqueteCliente.serviciosActual = sesionActual.servicios;
          this.guardarPaqueteCliente(paqueteCliente, batch);
          resolve(paqueteCliente);
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  guardarPaqueteCliente(paqueteCliente: PaqueteClienteOptions, batch: firebase.firestore.WriteBatch) {
    const clienteDoc = this.empresaDoc.collection('clientes').doc(this.cliente.id);
    const paqueteClienteDoc = clienteDoc.collection('paquetes').doc(paqueteCliente.id);
    batch.set(paqueteClienteDoc.ref, paqueteCliente);
  }

  agregarServiciosPaquete(paquete: any) {
    const batch = this.afs.firestore.batch();
    if (!paquete.sesion) {
      this.loadPaqueteCliente(paquete, batch).then(paqueteCliente => {
        this.llenarCarrito(paqueteCliente, batch);
      }).catch(err => {
        this.alertCtrl.create({
          buttons: [{
            text: 'Ok'
          }],
          message: 'Error: ' + err,
          subTitle: 'Se presentó error al procesar el paquete',
          title: 'Ha ocurrido un error'
        }).present();
      });
    } else {
      this.llenarCarrito(paquete, batch);
    }
  }

  private llenarCarrito(paqueteCliente: PaqueteClienteOptions, batch: firebase.firestore.WriteBatch) {
    const horaInicio = moment(this.ultimoHorario).add(this.tiempoDisponibilidad, 'minutes').toDate();
    const disponibilidadEncontrada = this.horario.find(disponibilidad =>
      disponibilidad.fechaInicio.getTime() === horaInicio.getTime()
    );
    if (!disponibilidadEncontrada || disponibilidadEncontrada.estado !== this.constantes.ESTADOS_RESERVA.DISPONIBLE) {
      this.genericAlert('Error al reservar', 'La hora de reserva no se encuentra disponible');
    } else {
      this.carrito.push({
        servicio: paqueteCliente.serviciosActual,
        fechaInicio: disponibilidadEncontrada.fechaInicio,
        fechaFin: disponibilidadEncontrada.fechaFin,
        cliente: this.cliente,
        estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
        evento: this.constantes.EVENTOS.OTRO,
        idcarrito: this.idcarrito,
        usuario: this.usuario,
        fechaActualizacion: null,
        id: null,
        leido: null,
        pago: null,
        paquete: {
          paquete: paqueteCliente.paquete,
          sesion: paqueteCliente.sesion
        }
      });
      this.guardar(batch);
    }
  }

}
