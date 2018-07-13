import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestoreCollection, AngularFirestore, AngularFirestoreDocument } from '../../../node_modules/angularfire2/firestore';
import { ReservaOptions } from '../../interfaces/reserva-options';
import * as DataProvider from '../../providers/constants';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import firebase from 'firebase';
import moment from 'moment';
import { AngularFireAuth } from '../../../node_modules/angularfire2/auth';

/**
 * Generated class for the PagoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-pago',
  templateUrl: 'pago.html',
})
export class PagoPage {

  pendientesPago: any[];
  private constantes = DataProvider;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  private usuarioLogueado: UsuarioOptions;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    private afa: AngularFireAuth,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {
    this.updateUsuario(this.afa.auth.currentUser.uid);
    this.updateServiciosUsuarios();
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  updateUsuario(id: string) {
    this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + id);
    this.usuarioDoc.valueChanges().subscribe(data => {
      if (data) {
        this.usuarioLogueado = data;
        if (!this.usuarioLogueado.perfiles.some(perfil => perfil.nombre === 'Administrador')) {
          this.genericAlert('Usuario no válido', 'Su usuario no es un administrador');
          this.navCtrl.setRoot('LogueoPage');
        }
      } else {
        this.genericAlert('Error usuario', 'Usuario no encontrado');
        this.navCtrl.setRoot('LogueoPage');
      }
    });
  }

  private updateServiciosUsuarios() {
    this.afs.collection<UsuarioOptions>('usuarios').valueChanges().subscribe(data => {
      console.log('entro aqui1');
      this.pendientesPago = [];
      data.forEach(usuario => {
        console.log('entro aqui2');
        this.updatePendientesPago(usuario);
      });
    });
  }

  private updatePendientesPago(usuario: UsuarioOptions) {
    let pendientesCollection: AngularFirestoreCollection<ReservaOptions> = this.afs.doc('usuarios/' + usuario.id).collection<ReservaOptions>('pendientes', ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.PENDIENTE_PAGO));
    return new Promise(resolve => {
      let read = pendientesCollection.valueChanges().subscribe(pendientes => {
        console.log('entro aqui');
        let pendientesMap = [];
        let contador = -1;
        let contadoranterior = contador;
        if (pendientes.length > 0) {
          pendientes.forEach(pendiente => {
            let id = 'id' + pendiente.idcarrito;
            if (!pendientesMap[id]) {
              contador++;
              pendientesMap[id] = [];
              this.pendientesPago[contador] = {
                total: 0,
                idcarrito: pendiente.idcarrito,
                nombrecliente: pendiente.cliente.nombre,
                nombreusuario: pendiente.nombreusuario,
                idusuario: pendiente.idusuario,
                nombreservicios: '',
                servicios: 0,
                reservas: []
              };
            }

            let servicios = pendiente.servicio;

            let total: number;
            let nombreservicios: string;

            if (servicios.length > 1) {
              total = servicios.map(servicio => Number(servicio.valor)).reduce((a, b) => a + b);
              nombreservicios = servicios.map(servicio => Number(servicio.nombre)).join(' - ');
            } else {
              total = Number(servicios[0].valor);
              nombreservicios = servicios[0].nombre;
              if (contador === contadoranterior) {
                nombreservicios = ' - ' + nombreservicios;
              }
            }

            this.pendientesPago[contador].total += total;
            this.pendientesPago[contador].servicios += servicios.length;
            this.pendientesPago[contador].nombreservicios += nombreservicios;
            this.pendientesPago[contador].reservas.push(pendiente);

            contadoranterior = contador;
          });
          read.unsubscribe();
          resolve('ok');
        }
      });
    });
  }

  private pagarServicio(reserva: ReservaOptions, usuario: UsuarioOptions) {
    let fechainicio = reserva.fechaInicio.toDate();

    let iddisponibilidad = moment(fechainicio).startOf('day').toDate().getTime().toString();
    let disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(iddisponibilidad);

    reserva.estado = this.constantes.ESTADOS_RESERVA.FINALIZADO;

    let id = fechainicio.getTime().toString();

    let batch = this.afs.firestore.batch();

    batch.update(disponibilidadDoc.collection('disponibilidades').doc(id).ref, reserva);

    batch.set(disponibilidadDoc.collection('finalizados').doc(id).ref, reserva);

    batch.delete(this.usuarioDoc.collection('pendientes').doc(id).ref);

    let mesServicio = moment(reserva.fechaInicio).startOf('month');

    let totalesServiciosDoc = this.afs.doc('totalesservicios/' + mesServicio);

    let totalServiciosReserva = reserva.servicio.map(servicioReserva => Number(servicioReserva.valor)).reduce((a, b) => a + b);

    return new Promise<firebase.firestore.WriteBatch>(resolve => {
      disponibilidadDoc.ref.get().then(datosDiarios => {
        if (datosDiarios.exists) {
          let totalDiarioActual = datosDiarios.get('totalServicios');
          let cantidadDiarioActual = datosDiarios.get('cantidadServicios');
          let totalDiario = totalDiarioActual ? Number(totalDiarioActual) + totalServiciosReserva : totalServiciosReserva;
          let cantidadDiario = cantidadDiarioActual ? Number(cantidadDiarioActual) + 1 : 1;
          batch.update(disponibilidadDoc.ref, { totalServicios: totalDiario, cantidadServicios: cantidadDiario, fecha: new Date() });
        }

        totalesServiciosDoc.ref.get().then(() => {
          batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: new Date() });

          let totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(usuario.id);

          totalesServiciosUsuarioDoc.ref.get().then(datos => {
            if (datos.exists) {
              let totalActual = datos.get('totalServicios');
              let cantidadActual = datos.get('cantidadServicios');
              batch.update(totalesServiciosUsuarioDoc.ref, { totalServicios: Number(totalActual) + totalServiciosReserva, cantidadServicios: Number(cantidadActual) + 1, fecha: new Date() });
            } else {
              let totalServicioUsuario: TotalesServiciosOptions = {
                idusuario: usuario.id,
                usuario: usuario.nombre,
                imagenusuario: usuario.imagen,
                totalServicios: totalServiciosReserva,
                cantidadServicios: 1,
                fecha: new Date()
              }

              batch.set(totalesServiciosUsuarioDoc.ref, totalServicioUsuario);
            }

            resolve(batch);
          });
        });
      });
    });
  }

  private pagarReservas(reservas: ReservaOptions[], usuario: UsuarioOptions) {
    return new Promise((resolve, reject) => {
      reservas.forEach(reserva => {
        this.pagarServicio(reserva, usuario).then(batch => {
          batch.commit().then(() => {
            resolve('ok');
          }).catch(err => reject(err));
        });
      });
    });
  }

  updateUsuarioServicio(id: string) {
    return new Promise<UsuarioOptions>(resolve => {
      this.afs.doc<UsuarioOptions>('usuarios/' + id).valueChanges().subscribe(data => {
        resolve(data);
      });
    });
  }

  pagar(pendientesPago) {
    this.updateUsuarioServicio(pendientesPago.idusuario).then(data => {
      this.pagarReservas(pendientesPago.reservas, data).then(() => {
        let loading = this.loadingCtrl.create({
          spinner: 'crescent',
          content: 'Procesando'
        });

        loading.present();
        let total = pendientesPago.total;

        this.genericAlert('Servicio finalizado', 'El servicio ha sido pagado satisfactoriamente.');

        this.genericAlert('Servicio finalizado', 'Valor servicios: ' + total);

        loading.dismiss();
      }).catch(err => this.genericAlert('Error al pagar', err));
    });
  }

}
