import moment from 'moment';
import { Component } from '@angular/core';
import { AlertController, IonicPage, ModalController, NavParams, PopoverController, ViewController, NavController, ToastController, LoadingController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import { GrupoOptions } from '../../interfaces/grupo-options';
import { PaqueteClienteOptions } from '../../interfaces/paquete-cliente-options';
import { SesionPaqueteOptions } from '../../interfaces/sesion-paquete-options';
import { ServicioPaqueteOptions } from '../../interfaces/servicio-paquete-options';
import { SesionPaqueteClienteOptions } from '../../interfaces/sesion-paquete-cliente-options';

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
  public grupoServicios: any[];
  public idcarrito: number;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  private disponibilidadDoc: AngularFirestoreDocument;
  private tiempoDisponibilidad: number;
  private carritoPaquete: PaqueteClienteOptions[] = [];
  public terms = 'paquetes';
  public paquetes: PaqueteOptions[];
  private paqueteCollection: AngularFirestoreCollection<PaqueteOptions>;
  private servicioCollection: AngularFirestoreCollection<ServicioOptions>;
  public grupoPaquetes: any[];
  public cliente: ClienteOptions = {} as ClienteOptions;
  private empresaDoc: AngularFirestoreDocument;
  private grupos: GrupoOptions[];
  private gruposCollection: AngularFirestoreCollection<GrupoOptions>;
  private carritoDoc: AngularFirestoreDocument<any>;
  private clienteDoc: AngularFirestoreDocument;
  private clienteCollection: AngularFirestoreCollection;
  private totalesServicioCollection: AngularFirestoreCollection;
  private grupoActivo = {
    id: '0',
    nombre: 'Paquetes activos',
  } as GrupoOptions;

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
    const filePathEmpresa = 'negocios/' + this.usuario.idempresa;
    this.empresaDoc = this.afs.doc(filePathEmpresa);
    this.ultimoHorario = this.disponibilidadSeleccionada.fechaInicio;
    this.usuarioDoc = this.empresaDoc.collection('usuarios').doc(this.usuario.id);
    let fecha = moment(this.ultimoHorario).startOf('day').toDate();
    this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    const datos: DisponibilidadOptions = {
      dia: fecha.getDate(),
      mes: fecha.getMonth() + 1,
      año: fecha.getFullYear(),
      id: fecha.getTime(),
      cantidadServicios: 0,
      totalServicios: 0,
      usuario: this.usuario
    };

    const empresaDoc = this.afs.doc(filePathEmpresa);
    this.carritoDoc = empresaDoc.collection('indices').doc('idcarrito');
    this.clienteCollection = empresaDoc.collection('clientes');
    this.gruposCollection = empresaDoc.collection('grupos');
    this.servicioCollection = empresaDoc.collection('servicios');
    this.paqueteCollection = empresaDoc.collection('paquetes');
    this.totalesServicioCollection = empresaDoc.collection('totalesservicios');

    this.updateGrupos();
    this.updateUsuario();
    this.disponibilidadDoc.ref.get().then(datosDisp => {
      if (!datosDisp.exists) {
        this.disponibilidadDoc.set(datos);
      }
    });
  }

  updateGrupos() {
    this.gruposCollection.valueChanges().subscribe(grupos => {
      this.grupos = grupos;
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
    const paquetesCliente: any[] = [];
    this.paquetes.forEach(paquete => {
      let paqueteCliente: any;
      const paqueteEncontrado = this.carritoPaquete.find(paqueteCarrito => paqueteCarrito.paquete.id === paquete.id);
      if (!paqueteEncontrado) {
        paqueteCliente = {
          actualizacion: null,
          cliente: this.cliente,
          estado: null,
          id: null,
          idcarrito: this.idcarrito,
          pago: null,
          paquete: paquete,
          registro: null,
          servicios: null,
          serviciosActual: null,
          sesion: 1,
          sesiones: null,
          valor: paquete.valor,
          grupo: paquete.grupo,
          nuevo: true
        }

        const paqueteDoc = this.paqueteCollection.doc(paquete.id);

        this.loadServiciosPaquete(paqueteDoc).then(servicios => {
          paqueteCliente.servicios = servicios;
          this.loadSesionesPaquete(paqueteDoc).then(sesiones => {
            paqueteCliente.sesiones = sesiones;
            const sesionActual = sesiones.find(sesion => sesion.id === paqueteCliente.sesion.toString());
            paqueteCliente.serviciosActual = sesionActual;
          }).catch(err => {
            this.alertCtrl.create({
              title: 'Ha ocurrido un error',
              subTitle: 'Se presentó un error al obtener la información de las sesiones del paquete',
              message: 'Error: ' + err
            });
          });
        }).catch(err => {
          this.alertCtrl.create({
            title: 'Ha ocurrido un error',
            subTitle: 'Se presentó un error al obtener la información de las servicios del paquete',
            message: 'Error: ' + err
          });
        });
      } else {
        paqueteCliente = paqueteEncontrado;
        paqueteCliente.sesion++;
        const idsesion = paqueteCliente.sesion.toString();
        const sesion = paqueteCliente.sesiones.find(sesionPaqueteCliente => sesionPaqueteCliente.id == idsesion);
        paqueteCliente.serviciosActual = sesion;
        paqueteCliente.grupo = this.grupoActivo;
        paqueteCliente.nuevo = false;
      }

      paquetesCliente.push(paqueteCliente);
    });

    paquetesCliente.forEach(paquete => {
      const grupo = paquete.grupo;
      if (grupos[grupo.id] === undefined) {
        grupos[grupo.id] = [];
      }
      grupos[grupo.id].push(paquete);
    });

    for (let grupo in grupos) {
      let grupoEncontrado = this.grupos.find(grupoGeneral => grupoGeneral.id === grupo);
      if (!grupoEncontrado) {
        grupoEncontrado = this.grupoActivo;
      }
      this.grupoPaquetes.push({ grupo: grupoEncontrado, paquetes: grupos[grupo] });
    }
  }

  ionViewDidLoad() {
    const clienteModal = this.modalCtrl.create('ClientePage');
    clienteModal.onDidDismiss(data => {
      if (data) {
        this.cliente = data;
        this.clienteDoc = this.clienteCollection.doc(this.cliente.id);
        this.updateCarrito();
      } else {
        this.viewCtrl.dismiss();
      }
    });
    clienteModal.present();
  }

  loadIdCarrito() {
    return new Promise(resolve => {
      this.carritoDoc.ref.get().then(data => {
        this.idcarrito = data.exists ? data.get('id') : 1;
        this.carritoDoc.set({ id: this.idcarrito + 1 });
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
    const paquetesCollection: AngularFirestoreCollection<PaqueteClienteOptions> = this.clienteDoc.collection('paquetes', ref => ref.where('estado', '==', DataProvider.ESTADOS_PAQUETE.PENDIENTE));
    paquetesCollection.valueChanges().subscribe(paquetes => {
      this.carritoPaquete = paquetes;
      this.updateGrupoPaquetes();
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
        const mesServicio = moment(reservaNueva.fechaInicio).startOf('month').toDate().getTime().toString();
        const totalesServiciosDoc = this.totalesServicioCollection.doc(mesServicio);

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

    if (!disponibilidadEncontrada || disponibilidadEncontrada.estado !== DataProvider.ESTADOS_RESERVA.DISPONIBLE) {
      this.genericAlert('Error al reservar', 'La hora de reserva no se encuentra disponible');
    } else {
      this.carrito.push({
        servicio: [servicio],
        fechaInicio: disponibilidadEncontrada.fechaInicio,
        fechaFin: disponibilidadEncontrada.fechaFin,
        cliente: this.cliente,
        estado: DataProvider.ESTADOS_RESERVA.RESERVADO,
        evento: DataProvider.EVENTOS.OTRO,
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
    const servicioCollection = paqueteDoc.collection<ServicioPaqueteOptions>('servicios');
    return new Promise<ServicioPaqueteOptions[]>((resolve, reject) => {
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

  loadPaqueteCliente(paquete: any, batch: firebase.firestore.WriteBatch) {
    const paqueteCliente: PaqueteClienteOptions = {
      actualizacion: new Date(),
      cliente: this.cliente,
      estado: DataProvider.ESTADOS_PAQUETE.PENDIENTE,
      id: paquete.nuevo ? this.idcarrito.toString() : paquete.id,
      idcarrito: paquete.nuevo ? this.idcarrito : paquete.idcarrito,
      pago: paquete.nuevo ? 0 : paquete.pago,
      paquete: paquete.paquete,
      registro: paquete.nuevo ? new Date() : paquete.registro,
      servicios: paquete.servicios,
      sesion: paquete.sesion,
      sesiones: paquete.sesiones,
      valor: paquete.valor,
      serviciosActual: paquete.serviciosActual
    }

    return new Promise<PaqueteClienteOptions>(resolve => {
      this.guardarPaqueteCliente(paqueteCliente, batch).then(() => {
        resolve(paqueteCliente);
      });
    });
  }

  guardarPaqueteCliente(paqueteCliente: PaqueteClienteOptions, batch: firebase.firestore.WriteBatch) {
    const idsesion = paqueteCliente.sesion;
    const sesionPaqueteCliente: SesionPaqueteClienteOptions = {
      actualizacion: new Date(),
      estado: DataProvider.ESTADOS_SESION.PENDIENTE,
      id: idsesion,
      pago: null,
      registro: new Date(),
      reserva: null
    }
    const clienteDoc = this.empresaDoc.collection('clientes').doc(this.cliente.id);
    const paqueteClienteDoc = clienteDoc.collection('paquetes').doc(paqueteCliente.id);
    const sesionesPaqueteClienteCollection: AngularFirestoreCollection<SesionPaqueteClienteOptions> = paqueteClienteDoc.collection('sesiones', ref => ref.where('estado', '==', DataProvider.ESTADOS_SESION.PENDIENTE));
    return new Promise(resolve => {
      this.loadSesionesPaqueteCliente(sesionesPaqueteClienteCollection).then(sesiones => {
        if (sesiones[0]) {
          this.alertCtrl.create({
            buttons: [{
              handler: () => {
                this.navCtrl.pop();
              },
              text: 'Ok'
            }],
            message: 'Por favor canelar o finalizar la reserva pendiente.',
            subTitle: 'El cliente tiene una sesión pendiente.',
            title: 'No fue posible asignar la reserva'
          }).present();
        } else {
          const sesionPaqueteClienteDoc = sesionesPaqueteClienteCollection.doc<SesionPaqueteClienteOptions>(idsesion.toString());
          batch.set(paqueteClienteDoc.ref, paqueteCliente);
          batch.set(sesionPaqueteClienteDoc.ref, sesionPaqueteCliente);
          resolve('ok');
        }
      });
    });
  }

  loadSesionesPaqueteCliente(sesionesPaqueteClienteCollection: AngularFirestoreCollection<SesionPaqueteClienteOptions>) {
    return new Promise<SesionPaqueteClienteOptions[]>(resolve => {
      sesionesPaqueteClienteCollection.valueChanges().subscribe(sesiones => {
        resolve(sesiones);
      });
    });
  }

  agregarServiciosPaquete(paquete: any) {
    const batch = this.afs.firestore.batch();
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
  }

  private llenarCarrito(paqueteCliente: PaqueteClienteOptions, batch: firebase.firestore.WriteBatch) {
    const horaInicio = moment(this.ultimoHorario).add(this.tiempoDisponibilidad, 'minutes').toDate();
    const disponibilidadEncontrada = this.horario.find(disponibilidad =>
      disponibilidad.fechaInicio.getTime() === horaInicio.getTime()
    );
    if (!disponibilidadEncontrada || disponibilidadEncontrada.estado !== DataProvider.ESTADOS_RESERVA.DISPONIBLE) {
      this.genericAlert('Error al reservar', 'La hora de reserva no se encuentra disponible');
    } else {
      this.carrito.push({
        servicio: paqueteCliente.serviciosActual.servicios,
        fechaInicio: disponibilidadEncontrada.fechaInicio,
        fechaFin: disponibilidadEncontrada.fechaFin,
        cliente: this.cliente,
        estado: DataProvider.ESTADOS_RESERVA.RESERVADO,
        evento: DataProvider.EVENTOS.OTRO,
        idcarrito: paqueteCliente.idcarrito,
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

  sesiones(paquete: PaqueteClienteOptions) {
    this.modalCtrl.create('DetalleSesionesPaquetePage', {
      idsesion: paquete.sesion.toString(),
      sesiones: paquete.sesiones
    }).present();
  }

}
