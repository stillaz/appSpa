import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, ItemSliding, LoadingController, Loading } from 'ionic-angular';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { UsuarioProvider } from '../../providers/usuario';
import * as DataProvider from '../../providers/constants';
import { ReservaOptions } from '../../interfaces/reserva-options';
import moment from 'moment';
import { interval, Observable } from 'rxjs';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import { ServicioOptions } from '../../interfaces/servicio-options';

/**
 * Generated class for the PendientePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-pendiente',
  templateUrl: 'pendiente.html',
})
export class PendientePage {

  private disponibilidadCollection: AngularFirestoreCollection;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuarioLogueado: UsuarioOptions;
  private filePathEmpresa: string;
  constantes = DataProvider;
  reservas: ReservaOptions[] = [];
  usuario: UsuarioOptions;
  actual: Date;
  terms: string = 'pendiente';
  private loading: Loading;
  paquetes: PaqueteOptions[];
  private clientesPendientesCollection: AngularFirestoreCollection<ClienteOptions>;
  private servicios: ServicioOptions[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private usuarioService: UsuarioProvider,
    private afs: AngularFirestore,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {
    this.loading = loadingCtrl.create({
      content: 'Procesando'
    });
    this.usuarioLogueado = this.usuarioService.getUsuario();
    this.filePathEmpresa = 'negocios/' + this.usuarioLogueado.idempresa;
    this.usuarioDoc = this.afs.doc<UsuarioOptions>(this.filePathEmpresa + '/usuarios/' + this.usuarioLogueado.id);
    this.disponibilidadCollection = this.usuarioDoc.collection('disponibilidades', ref => ref.where('pendientes', '>=', 1));
    this.usuario = this.usuarioService.getUsuario();
    this.clientesPendientesCollection = this.afs.doc(this.filePathEmpresa).collection<ClienteOptions>('clientes', ref => ref.where('pendientes', '>=', 1));
  }

  ionViewDidEnter() {
    this.updateServicios();
    this.actual = new Date();
    this.terms = 'pendiente';
    this.updateServiciosPendientes();
  }

  ionViewDidLoad() {
    interval(60000).subscribe(() => {
      this.actual = new Date();
      this.updateServiciosPendientes();
    });
  }

  loadReservaPendienteDia(iddisponibilidad: string) {
    let reservaCollection = this.disponibilidadCollection.doc(iddisponibilidad).collection<ReservaOptions>('disponibilidades', ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.RESERVADO));
    return new Promise<ReservaOptions[]>(resolve => {
      reservaCollection.valueChanges().subscribe(dataReservas => {
        resolve(dataReservas);
      });
    });
  }

  updateReservasPendientes() {
    return new Observable<ReservaOptions[]>((observer) => {
      this.disponibilidadCollection.valueChanges().subscribe(dataDisponibilidad => {
        let disponible: ReservaOptions[] = [];
        dataDisponibilidad.forEach(disponibilidad => {
          this.loadReservaPendienteDia(disponibilidad.id.toString())
            .then(data => {
              disponible.push.apply(disponible, data);
            });
        });

        observer.next(disponible);
        observer.complete();
      });

      return { unsubscribe() { } };
    });
  }

  updateReservas() {
    this.updateReservasPendientes().subscribe(data => {
      this.reservas = data;
    });
  }

  /*updatePaquetes() {
    const estado = this.terms === 'activo' ? this.constantes.ESTADOS_PAQUETE.PENDIENTE : this.constantes.ESTADOS_PAQUETE.PENDIENTEPAGO;
    this.updatePaquetesPendientes(estado).subscribe(data => {
      this.paquetes = data.sort((a, b) => {
        const registroA = a.registro.toDate();
        const registroB = b.registro.toDate();
        if (registroA > registroB) {
          return 1;
        } else if (a.registro.toDate() < b.registro.toDate()) {
          return -1;
        } else {
          return 0;
        }
      });
    });
  }*/

  updatePaquetesPendientes(estado: string) {
    return new Observable<PaqueteOptions[]>((observer) => {
      this.clientesPendientesCollection.valueChanges().subscribe(dataClientes => {
        const paquetes: PaqueteOptions[] = [];
        dataClientes.forEach(cliente => {
          this.loadPaquetesClientes(cliente.id, estado)
            .then(data => {
              paquetes.push.apply(paquetes, data);
            });
        });

        observer.next(paquetes);
        observer.complete();
      });

      return { unsubscribe() { } };
    });
  }

  private loadPaquetesClientes(idcliente: string, estado: string) {
    const paqueteCollection = this.clientesPendientesCollection.doc(idcliente).collection<PaqueteOptions>('paquetes', ref => ref.where('estado', '==', estado));
    return new Promise<PaqueteOptions[]>(resolve => {
      paqueteCollection.valueChanges().subscribe(dataPaquetes => {
        const paquetes = dataPaquetes.filter(paquete => {
          //return this.servicios.some(servicio => servicio.id === paquete.servicio.id);
        });
        resolve(paquetes);
      });
    });
  }

  mensaje(mensaje: string) {
    this.toastCtrl.create({
      message: mensaje,
      duration: 3000
    }).present();
  }

  private eliminar(reserva: ReservaOptions) {
    const fecha = new Date();
    const fechaServicio: Date = reserva.fechaInicio.toDate();
    const dia = moment(fechaServicio).startOf('day').toDate().getTime().toString();
    const disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(dia);
    const fechaInicio = moment(fechaServicio).locale("es").format("dddd, DD [de] MMMM [de] YYYY");
    const horaInicio = moment(fechaServicio).format("hh:mm a");
    const nombreCliente = reserva.cliente.nombre;
    const cancelarAlert = this.alertCtrl.create({
      title: 'Cancelar cita',
      message: 'Desea cancelar la cita de ' + fechaInicio + ' a las ' + horaInicio,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Si',
          handler: () => {
            const batch = this.afs.firestore.batch();
            const canceladoDoc: AngularFirestoreDocument<ReservaOptions> = disponibilidadDoc.collection('cancelados').doc(fecha.getTime().toString());
            reserva.estado = DataProvider.ESTADOS_RESERVA.CANCELADO;
            batch.set(canceladoDoc.ref, reserva);

            const disponibilidadCancelarDoc: AngularFirestoreDocument = disponibilidadDoc.collection('disponibilidades').doc(fechaServicio.getTime().toString());

            batch.delete(disponibilidadCancelarDoc.ref);

            disponibilidadDoc.ref.get().then(datosDiarios => {
              const pendientesDiarioActual = datosDiarios.get('pendientes');
              const pendientesDiario = Number(pendientesDiarioActual) - 1;
              batch.update(disponibilidadDoc.ref, {
                pendientes: pendientesDiario,
                fecha: fecha
              });

              const idreserva = reserva.id;
              if (idreserva) {
                const serviciosDoc = this.afs.doc('servicioscliente/' + idreserva);

                batch.update(serviciosDoc.ref, {
                  estado: this.constantes.ESTADOS_RESERVA.CANCELADO,
                  fechaActualizacion: fecha,
                  imagenusuario: this.usuario.imagen,
                  empresa: this.usuarioService.getEmpresa(),
                  actualiza: 'usuario'
                });

                const serviciosClienteDoc = this.afs.doc('clientes/' + reserva.cliente.correoelectronico + '/servicios/' + fechaServicio.getTime().toString());

                batch.update(serviciosClienteDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.CANCELADO });
              }

              batch.commit().then(() => {
                this.mensaje('La cita con ' + nombreCliente + ' ha sido cancelada');
                this.updateReservas();
              }).catch(err => alert(err));
            });
          }
        }],
    });
    cancelarAlert.present();
  }

  cancelar(slidingItem: ItemSliding, reserva: ReservaOptions) {
    this.eliminar(reserva);
    slidingItem.close();
  }

  procesarServicio(reserva: ReservaOptions, pago: number, fecha: Date, batch: firebase.firestore.WriteBatch) {
    const fechaServicio: Date = reserva.fechaInicio.toDate();
    const dia = moment(fechaServicio).startOf('day').toDate().getTime().toString();
    const disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(dia);
    const disponibilidadFinalizarDoc: AngularFirestoreDocument = disponibilidadDoc.collection('disponibilidades').doc(fechaServicio.getTime().toString());
    batch.update(disponibilidadFinalizarDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.FINALIZADO, pago: pago });

    return new Promise(resolve => {
      disponibilidadDoc.ref.get().then(datosDiarios => {
        const totalDiarioActual = datosDiarios.get('totalServicios');
        const cantidadDiarioActual = datosDiarios.get('cantidadServicios');
        const pendientesDiarioActual = datosDiarios.get('pendientes');
        const totalDiario = Number(totalDiarioActual) + pago;
        const cantidadDiario = Number(cantidadDiarioActual) + 1;
        const pendientesDiario = Number(pendientesDiarioActual) - 1;
        batch.update(disponibilidadDoc.ref, {
          pendientes: pendientesDiario,
          totalServicios: totalDiario,
          cantidadServicios: cantidadDiario,
          fecha: fecha
        });

        const mesServicio = moment(reserva.fechaInicio.toDate()).startOf('month').toDate().getTime();
        const totalesServiciosDoc = this.afs.doc(this.filePathEmpresa + '/totalesservicios/' + mesServicio);

        totalesServiciosDoc.ref.get().then(() => {
          batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: fecha });

          const totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(this.usuario.id);

          totalesServiciosUsuarioDoc.ref.get().then(datos => {
            const totalActual = Number(datos.get('totalServicios'));
            const cantidadActual = Number(datos.get('cantidadServicios'));
            const pendientesActual = Number(datos.get('pendientes'));
            const total = totalActual + pago;
            const cantidad = cantidadActual + 1;
            const pendientes = pendientesActual - 1;
            batch.update(totalesServiciosUsuarioDoc.ref, {
              totalServicios: total,
              cantidadServicios: cantidad,
              pendientes: pendientes,
              fecha: fecha
            });

            const idreserva = reserva.id;
            if (idreserva) {
              const serviciosDoc = this.afs.doc('servicioscliente/' + idreserva);

              batch.update(serviciosDoc.ref, {
                estado: this.constantes.ESTADOS_RESERVA.FINALIZADO,
                fechaActualizacion: new Date(),
                imagenusuario: this.usuario.imagen,
                empresa: this.usuarioService.getEmpresa(),
                actualiza: 'usuario'
              });

              const serviciosClienteDoc = this.afs.doc('clientes/' + reserva.cliente.correoelectronico + '/servicios/' + fechaServicio.getTime().toString());

              batch.update(serviciosClienteDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.FINALIZADO });

              resolve('ok');
            }

            resolve('ok');
          });
        });
      });
    });
  }

  loadResta(reserva: ReservaOptions) {
    const filePathClientePaquete = this.filePathEmpresa + '/clientes/' + reserva.cliente.telefono + '/paquetes/' + reserva.idcarrito;
    const paqueteClienteDoc: AngularFirestoreDocument<PaqueteOptions> = this.afs.doc<PaqueteOptions>(filePathClientePaquete);
    return new Promise<number>(resolve => {
      paqueteClienteDoc.valueChanges().subscribe(data => {
        if (data) {
          //resolve(Number(data.pagado));
        } else {
          resolve(0);
        }
      });
    });
  }

  private procesarPaquete(reserva: ReservaOptions, fecha: Date, batch: firebase.firestore.WriteBatch) {
    const idcarrito = reserva.idcarrito;
    const servicio = reserva.servicio;
    //const sesiones = servicio.sesiones;

    const valorPaquete = servicio.valor;
    return new Promise<number>(resolve => {
      this.loadResta(reserva).then(pagadoActual => {
        const resta = valorPaquete - pagadoActual;
        this.alertCtrl.create({
          title: 'Servicio finalizado',
          subTitle: 'Pago del paquete de servicios',
          message: 'Resta: ' + resta,
          inputs: [{
            type: 'number',
            min: 0,
            max: resta,
            placeholder: '0',
            name: 'pago'
          }],
          buttons: [{
            text: 'Cancelar',
            role: 'cancel'
          }, {
            text: 'OK',
            handler: data => {
              const pago: number = data.pago ? Number(data.pago) : 0;
              const filePathPaquete = '/paquetes/' + idcarrito;
              const pagado = pagadoActual + pago;
              const cliente = reserva.cliente;
              const filePathClienteNegocio = this.filePathEmpresa + '/clientes/' + cliente.id;
              const clienteNegocioDoc = this.afs.doc<ClienteOptions>(filePathClienteNegocio);
              this.loading.present();
              clienteNegocioDoc.get().subscribe(clienteNegocio => {
                if (!clienteNegocio.exists) {
                  batch.set(clienteNegocioDoc.ref, cliente);
                }

                const filePathClienteNegocioPaquete = filePathClienteNegocio + filePathPaquete;
                const paqueteNegocioClienteDoc: AngularFirestoreDocument<PaqueteOptions> = this.afs.doc<PaqueteOptions>(filePathClienteNegocioPaquete);
                const idempresa = this.usuarioService.getUsuario().idempresa;
                paqueteNegocioClienteDoc.get().subscribe(paqueteClienteNegocio => {
                  let paqueteNuevo;
                  /*let paqueteNuevo: PaqueteOptions = {
                    actualizacion: fecha,
                    estado: this.constantes.ESTADOS_PAQUETE.PENDIENTE,
                    idcarrito: idcarrito,
                    idempresa: idempresa,
                    pagado: pagado,
                    realizados: 1,
                    servicio: servicio,
                    sesiones: sesiones,
                    valorPaquete: valorPaquete,
                    registro: new Date(),
                    cliente: reserva.cliente
                  };*/

                  if (paqueteClienteNegocio.exists) {
                    const realizadosClienteNegocioActual = paqueteClienteNegocio.data().realizados;
                    //const estado = this.loadEstado(servicio.sesiones, realizadosClienteNegocioActual, resta, data.pago);
                    const realizadosClienteNegocio = realizadosClienteNegocioActual + 1;

                    paqueteNuevo.realizados = realizadosClienteNegocio;
                    paqueteNuevo.pagado = pagado;
                    //paqueteNuevo.estado = estado;
                    /*if (estado === this.constantes.ESTADOS_PAQUETE.FINALIZADO) {
                      const pendientesActualClienteNegocio = Number(clienteNegocio.data().pendientes);
                      const pendientesClienteNegocio = pendientesActualClienteNegocio - 1;
                      batch.update(clienteNegocioDoc.ref, { pendientes: pendientesClienteNegocio });
                    }*/
                  } else {
                    batch.update(clienteNegocioDoc.ref, { pendientes: 1 });
                  }
                  batch.set(paqueteNegocioClienteDoc.ref, paqueteNuevo);

                  if (pago > 0) {
                    const idhistorico = fecha.getTime().toString();
                    const filePathHistorico = this.filePathEmpresa + '/clientes/' + cliente.id + '/historicos/' + idhistorico;
                    const historicoDoc = this.afs.doc(filePathHistorico);

                    batch.set(historicoDoc.ref, {
                      id: idhistorico,
                      paga: pago,
                      fecha: fecha,
                      idempresa: idempresa,
                      usuario: this.usuarioService.getUsuario().id,
                      servicio: servicio
                    });
                  }

                  if (cliente.correoelectronico) {
                    const filePathCliente = 'clientes/' + cliente.correoelectronico;
                    const clienteDoc: AngularFirestoreDocument<ClienteOptions> = this.afs.doc<ClienteOptions>(filePathCliente);
                    clienteDoc.get().subscribe(cliente => {
                      if (cliente.exists) {
                        const filePathClientePaquete = filePathCliente + '/negocios/' + this.usuario.idempresa + filePathPaquete;
                        const paqueteClienteDoc: AngularFirestoreDocument<PaqueteOptions> = this.afs.doc<PaqueteOptions>(filePathClientePaquete);
                        batch.set(paqueteClienteDoc.ref, paqueteNuevo);
                      }
                      resolve(pago);
                    });
                  } else {
                    resolve(pago);
                  }
                });
              });
            }
          }]
        }).present();
      });
    });
  }

  private loadEstado(sesiones: number, realizados: number, resta: number, paga: number): string {
    let estado: string;
    const terminado: boolean = Number(sesiones) === realizados + 1;
    const pagado: boolean = resta - paga === 0;
    if (terminado && pagado) {
      estado = this.constantes.ESTADOS_PAQUETE.FINALIZADO;
    } else if (terminado) {
      estado = this.constantes.ESTADOS_PAQUETE.PENDIENTEPAGO;
    } else {
      estado = this.constantes.ESTADOS_PAQUETE.PENDIENTE;
    }
    return estado;
  }

  terminar(reserva: ReservaOptions) {
    //const modoPagoServicio = reserva.servicio.pago;
    const batch = this.afs.firestore.batch();
    const fecha = new Date();

    /*if (modoPagoServicio === this.constantes.MODO_PAGO.PARTES) {
      this.procesarPaquete(reserva, fecha, batch).then(pago => {
        this.procesarServicio(reserva, pago, fecha, batch).then(() => {
          batch.commit().then(() => {
            this.loading.dismiss();
            this.mensaje('Se ha procesado el servicio');
            this.updateReservas();
          });
        });
      }).catch(err => {
        this.loading.dismiss();
        alert(err);
      });
    } else {
      this.loading.present();
      const totalServiciosReserva = reserva.servicio.valor;
      this.procesarServicio(reserva, totalServiciosReserva, fecha, batch).then(() => {
        batch.commit().then(() => {
          this.loading.dismiss();
          this.mensaje('Se ha procesado el servicio');
          this.updateReservas();
        }).catch(err => {
          this.loading.dismiss();
          alert(err);
        });
      });
    }*/
  }

  updateServiciosPendientes() {
    /*switch (this.terms) {
      case 'pendiente':
        this.updateReservas();
        break;

      case 'activo':
        this.updatePaquetes();
        break;

      case 'sinpago':
        this.updatePaquetes();
        break;
    }*/
  }

  updateServicios() {
    this.usuarioDoc.valueChanges().subscribe(data => {
      this.servicios = [];
      if (data) {
        data.perfiles.forEach(perfil => {
          this.servicios.push.apply(this.servicios, perfil.servicios);
        });
      }
    });
  }

}
