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
import { PaqueteClienteOptions } from '../../interfaces/paquete-cliente-options';
import { SesionPaqueteClienteOptions } from '../../interfaces/sesion-paquete-cliente-options';

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

  public constantes = DataProvider;
  private disponibilidadCollection: AngularFirestoreCollection;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  public usuarioLogueado: UsuarioOptions;
  public reservas: ReservaOptions[] = [];
  private usuario: UsuarioOptions;
  public actual: Date;
  public terms: string = 'pendiente';
  private loading: Loading;
  public paquetes: PaqueteOptions[];
  private empresaDoc: AngularFirestoreDocument;
  private clienteNegocioCollection: AngularFirestoreCollection;
  private clientesPendientesCollection: AngularFirestoreCollection;
  private totalesCollection: AngularFirestoreCollection;

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
    const filePathEmpresa = 'negocios/' + this.usuarioLogueado.idempresa;
    this.empresaDoc = this.afs.doc(filePathEmpresa);
    this.usuarioDoc = this.empresaDoc.collection('usuarios').doc(this.usuarioLogueado.id);
    this.clienteNegocioCollection = this.empresaDoc.collection('clientes');
    this.clientesPendientesCollection = this.empresaDoc.collection<ClienteOptions>('clientes', ref => ref.where('pendientes', '>=', 1));
    this.disponibilidadCollection = this.usuarioDoc.collection('disponibilidades', ref => ref.where('pendientes', '>=', 1));
    this.totalesCollection = this.empresaDoc.collection('totalesservicios');
    this.usuario = this.usuarioService.getUsuario();
  }

  ionViewDidEnter() {
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

  public loadReservaPendienteDia(iddisponibilidad: string) {
    let reservaCollection = this.disponibilidadCollection.doc(iddisponibilidad).collection<ReservaOptions>('disponibilidades', ref => ref.where('estado', '==', DataProvider.ESTADOS_RESERVA.RESERVADO));
    return new Promise<ReservaOptions[]>(resolve => {
      reservaCollection.valueChanges().subscribe(dataReservas => {
        resolve(dataReservas);
      });
    });
  }

  public updateReservasPendientes() {
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

  public updateReservas() {
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

  public updatePaquetesPendientes(estado: string) {
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

  private mensaje(mensaje: string) {
    this.toastCtrl.create({
      message: mensaje,
      duration: 3000
    }).present();
  }

  public cancelar(slidingItem: ItemSliding, reserva: ReservaOptions) {
    const fechaServicio = reserva.fechaInicio.toDate();
    const fechaInicio = moment(fechaServicio).locale("es").format("dddd, DD [de] MMMM [de] YYYY");
    const horaInicio = moment(fechaServicio).format("hh:mm a");
    const batch = this.afs.firestore.batch();
    this.alertCtrl.create({
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
            if (reserva.paquete) {
              this.eliminarSesionPaquete(batch, reserva, fechaServicio);
            } else {
              this.eliminar(batch, reserva, fechaServicio);
            }
          }
        }],
    });
    slidingItem.close();
  }

  private eliminarSesionPaquete(batch: firebase.firestore.WriteBatch, reserva: ReservaOptions, fechaServicio: Date) {
    const idpaquete = reserva.idcarrito.toString();
    const idsesion = reserva.paquete.sesion;
    const clienteDoc = this.empresaDoc.collection('clientes').doc(reserva.cliente.id);
    const paqueteClienteDoc = clienteDoc.collection('paquetes').doc(idpaquete);
    const sesionPaqueteClienteDoc = paqueteClienteDoc.collection('sesiones').doc(idsesion.toString());

    batch.delete(sesionPaqueteClienteDoc.ref);

    if(idsesion === 1){
      batch.delete(paqueteClienteDoc.ref);
    } else {
      batch.update(paqueteClienteDoc.ref, { sesion: idsesion - 1 });
    }

    this.eliminar(batch, reserva, fechaServicio);
  }

  private eliminar(batch: firebase.firestore.WriteBatch, reserva: ReservaOptions, fechaServicio: Date) {
    const fecha = new Date();
    const dia = moment(fechaServicio).startOf('day').toDate().getTime().toString();
    const disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(dia);
    const nombreCliente = reserva.cliente.nombre;
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
          estado: DataProvider.ESTADOS_RESERVA.CANCELADO,
          fechaActualizacion: fecha,
          imagenusuario: this.usuario.imagen,
          empresa: this.usuarioService.getEmpresa(),
          actualiza: 'usuario'
        });

        const serviciosClienteDoc = this.afs.doc('clientes/' + reserva.cliente.correoelectronico + '/servicios/' + fechaServicio.getTime().toString());

        batch.update(serviciosClienteDoc.ref, { estado: DataProvider.ESTADOS_RESERVA.CANCELADO });
      }

      batch.commit().then(() => {
        this.mensaje('La cita con ' + nombreCliente + ' ha sido cancelada');
        this.updateReservas();
      }).catch(err => alert(err));
    });
  }

  public terminar(reserva: ReservaOptions) {
    const batch = this.afs.firestore.batch();
    const fecha = new Date();
    reserva.fechaActualizacion = new Date();
    reserva.estado = DataProvider.ESTADOS_RESERVA.FINALIZADO;

    if (reserva.paquete) {
      this.procesarPaquete(reserva, batch).then(() => {
        this.procesarServicio(reserva, fecha, batch).then(() => {
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
      reserva.pago = reserva.servicio[0].valor;
      this.procesarServicio(reserva, fecha, batch).then(() => {
        batch.commit().then(() => {
          this.loading.dismiss();
          this.mensaje('Se ha procesado el servicio');
          this.updateReservas();
        });
      });
    }
  }

  private procesarServicio(reserva: ReservaOptions, fecha: Date, batch: firebase.firestore.WriteBatch) {
    const pago = reserva.pago;
    const fechaServicio: Date = reserva.fechaInicio.toDate();
    const dia = moment(fechaServicio).startOf('day').toDate().getTime().toString();
    const disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(dia);
    const disponibilidadFinalizarDoc: AngularFirestoreDocument = disponibilidadDoc.collection('disponibilidades').doc(fechaServicio.getTime().toString());
    batch.update(disponibilidadFinalizarDoc.ref, reserva);

    return new Promise(resolve => {
      disponibilidadDoc.ref.get().then(datosDiarios => {
        const totalDiarioActual = datosDiarios.get('totalServicios') || 0;
        const cantidadDiarioActual = datosDiarios.get('cantidadServicios') || 0;
        const pendientesDiarioActual = datosDiarios.get('pendientes') || 0;
        const totalDiario = Number(totalDiarioActual) + Number(pago);
        const cantidadDiario = Number(cantidadDiarioActual) + 1;
        const pendientesDiario = Number(pendientesDiarioActual) - 1;
        batch.update(disponibilidadDoc.ref, {
          pendientes: pendientesDiario,
          totalServicios: totalDiario,
          cantidadServicios: cantidadDiario,
          fecha: fecha
        });

        const mesServicio = moment(reserva.fechaInicio.toDate()).startOf('month').toDate().getTime().toString();
        const totalesServiciosDoc = this.totalesCollection.doc(mesServicio);

        totalesServiciosDoc.ref.get().then(() => {
          batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: fecha });

          const totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(this.usuario.id);

          totalesServiciosUsuarioDoc.ref.get().then(datos => {
            const totalActual = datos.get('totalServicios') || 0;
            const cantidadActual = datos.get('cantidadServicios') || 0;
            const pendientesActual = datos.get('pendientes') || 0;
            const total = Number(totalActual) + Number(pago);
            const cantidad = Number(cantidadActual) + 1;
            const pendientes = Number(pendientesActual) - 1;
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
                estado: DataProvider.ESTADOS_RESERVA.FINALIZADO,
                fechaActualizacion: new Date(),
                imagenusuario: this.usuario.imagen,
                empresa: this.usuarioService.getEmpresa(),
                actualiza: 'usuario'
              });

              const serviciosClienteDoc = this.afs.doc('clientes/' + reserva.cliente.correoelectronico + '/servicios/' + fechaServicio.getTime().toString());

              batch.update(serviciosClienteDoc.ref, { estado: DataProvider.ESTADOS_RESERVA.FINALIZADO });

              resolve('ok');
            }

            resolve('ok');
          });
        });
      });
    });
  }

  private procesarPaquete(reserva: ReservaOptions, batch: firebase.firestore.WriteBatch) {
    const clienteNegocioDoc: AngularFirestoreDocument<ClienteOptions> = this.clienteNegocioCollection.doc(reserva.cliente.id);
    const paqueteClienteDoc: AngularFirestoreDocument<PaqueteClienteOptions> = clienteNegocioDoc.collection('paquetes').doc(reserva.idcarrito.toString());
    return new Promise<number>(resolve => {
      this.loadPaqueteReserva(paqueteClienteDoc).then(paquete => {
        const valorPaquete = paquete.valor;
        const pagadoActual = paquete.pago;
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
              const pago = Number(data.pago);
              reserva.pago = pago;
              this.loading.present();
              const sesionPaqueteClienteDoc = paqueteClienteDoc.collection('sesiones').doc<SesionPaqueteClienteOptions>(paquete.sesion.toString());
              this.actualizarSesionPaqueteCliente(batch, sesionPaqueteClienteDoc, pago, reserva).then(sesion => {
                const correoCliente = paquete.cliente.correoelectronico;
                if (paquete.estado === DataProvider.ESTADOS_PAQUETE.FINALIZADO) {
                  this.actualizarPendientesCliente(batch, clienteNegocioDoc).then(() => {
                    this.actualizarPaqueteCliente(batch, paquete, paqueteClienteDoc, pago, resta);
                    if (correoCliente) {
                      this.actualizarPaqueteClienteExpress(batch, correoCliente, paquete, sesion).then(() => {
                        resolve(pago);
                      });
                    } else {
                      resolve(pago);
                    }
                  });
                } else {
                  this.actualizarPaqueteCliente(batch, paquete, paqueteClienteDoc, pago, resta);
                  if (correoCliente) {
                    this.actualizarPaqueteClienteExpress(batch, correoCliente, paquete, sesion).then(() => {
                      resolve(pago);
                    });
                  } else {
                    resolve(pago);
                  }
                }
              });
            }
          }]
        }).present();
      });
    });
  }

  private actualizarPaqueteClienteExpress(batch: firebase.firestore.WriteBatch, correoCliente: string, paquete: PaqueteClienteOptions, sesion: SesionPaqueteClienteOptions) {
    const filePathCliente = 'clientes/' + correoCliente;
    const clienteDoc: AngularFirestoreDocument<ClienteOptions> = this.afs.doc<ClienteOptions>(filePathCliente);
    return new Promise(resolve => {
      clienteDoc.get().subscribe(cliente => {
        if (cliente.exists) {
          const filePathClientePaquete = filePathCliente + '/negocios/' + this.usuario.idempresa + '/paquetes/' + paquete.id;
          const paqueteClienteDoc: AngularFirestoreDocument = this.afs.doc(filePathClientePaquete);
          batch.set(paqueteClienteDoc.ref, paquete);

          const sesionPaqueteClienteDoc = paqueteClienteDoc.collection('sesiones').doc(sesion.id.toString());

          batch.set(sesionPaqueteClienteDoc.ref, sesion);

          resolve('ok');
        }
      });
    });
  }

  private actualizarPaqueteCliente(batch: firebase.firestore.WriteBatch, paquete: PaqueteClienteOptions, paqueteClienteDoc: AngularFirestoreDocument, pago: number, resta: number) {
    const pagado = paquete.pago + pago;
    const cantidadSesiones = paquete.sesiones.length;
    paquete.estado = this.loadEstado(cantidadSesiones, paquete.sesion, resta);
    paquete.actualizacion = new Date();
    paquete.pago = pagado;
    batch.update(paqueteClienteDoc.ref, paquete);
  }

  private loadEstado(sesiones: number, realizados: number, resta: number): string {
    let estado: string;
    const terminado = sesiones === realizados;
    if (terminado && resta === 0) {
      estado = DataProvider.ESTADOS_PAQUETE.FINALIZADO;
    } else if (terminado) {
      estado = DataProvider.ESTADOS_PAQUETE.PENDIENTEPAGO;
    } else {
      estado = DataProvider.ESTADOS_PAQUETE.PENDIENTE;
    }
    return estado;
  }

  private actualizarSesionPaqueteCliente(batch: firebase.firestore.WriteBatch, sesionPaqueteClienteDoc: AngularFirestoreDocument<SesionPaqueteClienteOptions>, pago: number, reserva: ReservaOptions) {
    return new Promise<SesionPaqueteClienteOptions>(resolve => {
      this.loadSesionPaqueteCliente(sesionPaqueteClienteDoc).then(sesion => {
        sesion.pago = pago;
        sesion.actualizacion = new Date();
        sesion.reserva = reserva;
        sesion.estado = DataProvider.ESTADOS_SESION.FINALIZADO;

        batch.update(sesionPaqueteClienteDoc.ref, sesion);
        resolve(sesion);
      });
    });
  }

  private loadSesionPaqueteCliente(sesionPaqueteClienteDoc: AngularFirestoreDocument<SesionPaqueteClienteOptions>) {
    return new Promise<SesionPaqueteClienteOptions>(resolve => {
      sesionPaqueteClienteDoc.valueChanges().subscribe(sesion => {
        resolve(sesion);
      });
    });
  }

  private actualizarPendientesCliente(batch: firebase.firestore.WriteBatch, clienteDoc: AngularFirestoreDocument<ClienteOptions>) {
    return new Promise(resolve => {
      clienteDoc.valueChanges().subscribe(cliente => {
        cliente.pendientes--;
        batch.update(clienteDoc.ref, cliente);
        resolve('ok');
      });
    });
  }

  loadPaqueteReserva(paqueteClienteDoc: AngularFirestoreDocument<PaqueteClienteOptions>) {
    return new Promise<PaqueteClienteOptions>(resolve => {
      paqueteClienteDoc.valueChanges().subscribe(paquete => {
        resolve(paquete);
      });
    });
  }

  updateServiciosPendientes() {
    switch (this.terms) {
      case 'pendiente':
        this.updateReservas();
        break;

      case 'activo':
        //this.updatePaquetes();
        break;

      case 'sinpago':
        //this.updatePaquetes();
        break;
    }
  }

}
