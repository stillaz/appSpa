import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ToastController, AlertController, ItemSliding } from 'ionic-angular';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { UsuarioProvider } from '../../providers/usuario';
import * as DataProvider from '../../providers/constants';
import { ReservaOptions } from '../../interfaces/reserva-options';
import moment from 'moment';
import { Observable } from 'rxjs';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';

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

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private usuarioService: UsuarioProvider,
    private afs: AngularFirestore,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController
  ) {
    this.usuarioLogueado = this.usuarioService.getUsuario();
    this.filePathEmpresa = 'negocios/' + this.usuarioLogueado.idempresa;
    this.usuarioDoc = this.afs.doc<UsuarioOptions>(this.filePathEmpresa + '/usuarios/' + this.usuarioLogueado.id);
    this.disponibilidadCollection = this.usuarioDoc.collection('disponibilidades', ref => ref.where('pendientes', '>=', 1));
  }

  ionViewDidEnter() {
    //resetear badge
    this.updateReservas();
  }

  loadReservaPendienteDia(disponibilidad) {
    let reservaCollection = this.disponibilidadCollection.doc(disponibilidad.id.toString()).collection<ReservaOptions>('disponibilidades', ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.RESERVADO));
    return new Promise<ReservaOptions[]>(resolve => {
      reservaCollection.valueChanges().subscribe(dataReservas => {
        let reservasVencidas: ReservaOptions[] = dataReservas.filter(reserva => (reserva.estado === this.constantes.ESTADOS_RESERVA.RESERVADO || reserva.estado === this.constantes.ESTADOS_RESERVA.EJECUTANDO) && moment(reserva.fechaFin.toDate()).isBefore(new Date()));
        resolve(reservasVencidas);
      });
    });
  }

  loadReservasPendientes() {
    return new Observable<ReservaOptions[]>((observer) => {
      this.disponibilidadCollection.valueChanges().subscribe(dataDisponibilidad => {
        let disponible: ReservaOptions[] = [];
        let disponibilidadesPendientes = dataDisponibilidad.filter(disponibilidad => Number(disponibilidad.id) <= new Date().getTime());
        disponibilidadesPendientes.forEach(disponibilidad => {
          this.loadReservaPendienteDia(disponibilidad)
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
    this.loadReservasPendientes().subscribe(data => {
      this.reservas = data;
    });
  }

  mensaje(mensaje: string) {
    this.toastCtrl.create({
      message: mensaje,
      duration: 3000
    }).present();
  }

  private eliminar(reserva: ReservaOptions) {
    const fecha: Date = reserva.fechaInicio.toDate();
    const dia = moment(fecha).startOf('day').toDate().getTime().toString();
    const disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(dia);
    const fechaInicio = moment(fecha).locale("es").format("dddd, DD [de] MMMM [de] YYYY");
    const horaInicio = moment(fecha).format("hh:mm a");
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
            const canceladoDoc: AngularFirestoreDocument<ReservaOptions> = disponibilidadDoc.collection('cancelados').doc(new Date().getTime().toString());
            reserva.estado = DataProvider.ESTADOS_RESERVA.CANCELADO;
            batch.set(canceladoDoc.ref, reserva);

            const disponibilidadCancelarDoc: AngularFirestoreDocument = disponibilidadDoc.collection('disponibilidades').doc(fecha.getTime().toString());

            batch.delete(disponibilidadCancelarDoc.ref);

            const mesServicio = moment(fecha).startOf('month');

            const totalesServiciosDoc = this.afs.doc(this.filePathEmpresa + '/totalesservicios/' + mesServicio);

            let totalServiciosReserva = reserva.servicio.map(servicioReserva => Number(servicioReserva.valor)).reduce((a, b) => a + b);

            disponibilidadDoc.ref.get().then(datosDiarios => {
              let totalDiarioActual = datosDiarios.get('totalServicios');
              let cantidadDiarioActual = datosDiarios.get('cantidadServicios');
              let pendientesDiarioActual = datosDiarios.get('pendientes');
              let totalDiario = Number(totalDiarioActual) - totalServiciosReserva;
              let cantidadDiario = Number(cantidadDiarioActual) - 1;
              let pendientesDiario = Number(pendientesDiarioActual) - 1;
              batch.update(disponibilidadDoc.ref, { totalServicios: totalDiario, cantidadServicios: cantidadDiario, pendientes: pendientesDiario, fecha: new Date() });

              totalesServiciosDoc.ref.get().then(() => {
                batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: new Date() });

                let totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(reserva.idusuario);

                totalesServiciosUsuarioDoc.ref.get().then(datos => {
                  let totalActual = datos.get('totalServicios');
                  let cantidadActual = datos.get('cantidadServicios');
                  batch.update(totalesServiciosUsuarioDoc.ref, { totalServicios: Number(totalActual) - totalServiciosReserva, cantidadServicios: Number(cantidadActual) - 1, fecha: new Date() });

                  let idreserva = reserva.id;
                  if (idreserva) {
                    const serviciosDoc = this.afs.doc('servicioscliente/' + idreserva);

                    batch.update(serviciosDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.CANCELADO, fechaActualizacion: new Date(), actualiza: 'usuario' });

                    const serviciosClienteDoc = this.afs.doc('clientes/' + reserva.cliente.correoelectronico + '/servicios/' + fecha.getTime().toString());

                    batch.update(serviciosClienteDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.CANCELADO });
                  }

                  batch.commit().then(() => {
                    this.mensaje('La cita con ' + nombreCliente + ' ha sido cancelada');
                    this.updateReservas();
                  }).catch(err => alert(err));
                });
              });
            });
          }
        }
      ],
    });
    cancelarAlert.present();
  }

  cancelar(slidingItem: ItemSliding, reserva: ReservaOptions) {
    this.eliminar(reserva);
    slidingItem.close();
  }

  terminar(reserva: ReservaOptions) {
    const fecha: Date = reserva.fechaInicio.toDate();
    let dia = moment(fecha).startOf('day').toDate().getTime().toString();
    let disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(dia);
    let batch = this.afs.firestore.batch();
    let disponibilidadFinalizarDoc: AngularFirestoreDocument = disponibilidadDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    batch.update(disponibilidadFinalizarDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.FINALIZADO });

    disponibilidadDoc.ref.get().then(datosDiarios => {
      const pendientesDiarioActual = datosDiarios.get('pendientes');
      const pendientesDiario = Number(pendientesDiarioActual) - 1;
      batch.update(disponibilidadDoc.ref, { pendientes: pendientesDiario, fecha: new Date() });

      let idreserva = reserva.id;
      if (idreserva) {
        const serviciosDoc = this.afs.doc('servicioscliente/' + idreserva);

        batch.update(serviciosDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.CANCELADO, fechaActualizacion: new Date(), actualiza: 'usuario' });

        const serviciosClienteDoc = this.afs.doc('clientes/' + reserva.cliente.correoelectronico + '/servicios/' + fecha.getTime().toString());

        batch.update(serviciosClienteDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.CANCELADO });
      }

      batch.commit().then(() => {
        this.mensaje('Se ha terminado el servicio');
        this.updateReservas();
      }).catch(err => alert(err));
    });
  }

}
