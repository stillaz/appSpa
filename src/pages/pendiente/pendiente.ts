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

  private disponibilidadCollection: AngularFirestoreCollection;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  public usuarioLogueado: UsuarioOptions;
  private constantes = DataProvider;
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

        const mesServicio = moment(reserva.fechaInicio.toDate()).startOf('month').toDate().getTime().toString();
        const totalesServiciosDoc = this.totalesCollection.doc(mesServicio);

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

  private procesarPaquete(reserva: ReservaOptions, batch: firebase.firestore.WriteBatch) {

    console.log(reserva);
    const clienteNegocioDoc: AngularFirestoreDocument<ClienteOptions> = this.clienteNegocioCollection.doc(reserva.cliente.id);
    const paqueteClienteDoc: AngularFirestoreDocument<PaqueteClienteOptions> = clienteNegocioDoc.collection('paquetes').doc(reserva.paquete.paquete.id);
    return new Promise<any>(resolve => {
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
              this.loading.present();
              const sesionPaqueteClienteDoc = paqueteClienteDoc.collection('sesiones').doc<SesionPaqueteClienteOptions>(paquete.sesion.toString());
              this.actualizarSesionPaqueteCliente(batch, sesionPaqueteClienteDoc, pago, reserva).then(sesion => {
                const correoCliente = paquete.cliente.correoelectronico;
                if (paquete.estado === this.constantes.ESTADOS_PAQUETE.FINALIZADO) {
                  this.actualizarPendientesCliente(batch, clienteNegocioDoc).then(() => {
                    this.actualizarPaqueteCliente(batch, paquete, paqueteClienteDoc, pago, resta);
                    if (correoCliente) {
                      this.actualizarPaqueteClienteExpress(batch, correoCliente, paquete, sesion).then(() => {
                        resolve('ok');
                      });
                    } else {
                      resolve('ok');
                    }
                  });
                } else {
                  this.actualizarPaqueteCliente(batch, paquete, paqueteClienteDoc, pago, resta);
                  if (correoCliente) {
                    this.actualizarPaqueteClienteExpress(batch, correoCliente, paquete, sesion).then(() => {
                      resolve('ok');
                    });
                  } else {
                    resolve('ok');
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
    paquete.estado = this.loadEstado(cantidadSesiones, paquete.sesion, resta, pagado);
    paquete.actualizacion = new Date();
    paquete.pago = pagado;
    batch.update(paqueteClienteDoc.ref, paquete);
  }

  private actualizarSesionPaqueteCliente(batch: firebase.firestore.WriteBatch, sesionPaqueteClienteDoc: AngularFirestoreDocument<SesionPaqueteClienteOptions>, pago: number, reserva: ReservaOptions) {
    return new Promise<SesionPaqueteClienteOptions>(resolve => {
      sesionPaqueteClienteDoc.valueChanges().subscribe(sesion => {
        sesion.pago = pago;
        sesion.actualizacion = new Date();
        sesion.reserva = reserva;
        sesion.estado = DataProvider.ESTADOS_SESION.FINALIZADO;

        batch.update(sesionPaqueteClienteDoc.ref, sesion);
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
    const batch = this.afs.firestore.batch();
    const fecha = new Date();

    this.procesarPaquete(reserva, batch).then(pago => {
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
    /*else {
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
