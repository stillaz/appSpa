import moment from 'moment';
import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ItemSliding, NavController, ActionSheetController, PopoverController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/interval';
import { ReservaProvider } from '../../providers/reserva';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import { PerfilOptions } from '../../interfaces/perfil-options';
import { PaginaOptions } from '../../interfaces/pagina-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';

/**
 * Generated class for the AgendaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-agenda',
  templateUrl: 'agenda.html',
})
export class AgendaPage {

  @ViewChild(Content) content: Content;

  horaInicio = 0;
  horaFin = 24;
  tiempoServicio = 30;
  actual: Date;
  initDate: Date = new Date();
  initDate2: Date = new Date();
  disabledDates: Date[] = [];
  maxDate: Date = moment(new Date()).add(30, 'days').toDate();
  min: Date = new Date();
  constantes = DataProvider;
  usuario = {} as UsuarioOptions;
  usuarioLogueado: UsuarioOptions;
  horario: ReservaOptions[];
  horarios: any[];
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  cliente = {} as ClienteOptions;
  servicio = {} as ServicioOptions;
  administrador: boolean;
  private usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;
  perfiles: PerfilOptions[];
  usuarios: UsuarioOptions[];
  private disponibilidadDoc: AngularFirestoreDocument;
  terms: string;

  opciones: any[] = [
    { title: 'Configuración', component: 'ConfiguracionAgendaPage', icon: 'stats' }
  ];


  constructor(
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public navCtrl: NavController,
    private reservaCtrl: ReservaProvider,
    private afs: AngularFirestore,
    private afa: AngularFireAuth,
    public popoverCtrl: PopoverController
  ) {
    this.usuariosCollection = this.afs.collection<UsuarioOptions>('usuarios');
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    }

    this.updateUsuarios();
    this.updatePerfiles();
  }

  ionViewDidLoad() {
    Observable.interval(60000).subscribe(() => {
      this.initDate = new Date();
      this.initDate2 = new Date();
      this.updateHorariosInicial();
      if (this.usuario.id === this.afa.auth.currentUser.uid) {
        this.updatePendientes();
      }
    });
  }

  ionViewDidEnter() {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      this.updateUsuario(user.uid);
      this.updatePendientes();
    }
  }

  updateUsuario(id: string) {
    this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + id);
    this.usuarioDoc.valueChanges().subscribe(data => {
      if (data) {
        this.usuarioLogueado = data;
        this.usuario = data;
        let configuracion = this.usuario.configuracion;
        if (configuracion) {
          this.horaInicio = configuracion.horaInicio;
          this.horaFin = configuracion.horaFin;
          this.tiempoServicio = configuracion.tiempoDisponibilidad;
        }
        this.administrador = this.usuarioLogueado.perfiles.some(perfil => perfil.nombre === 'Administrador');
        let fecha = moment(this.initDate).startOf('days').toDate().getTime().toString();
        this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha);
        this.updateHorariosInicial();
      } else {
        this.genericAlert('Error usuario', 'Usuario no encontrado');
        this.navCtrl.setRoot('LogueoPage');
      }
    });
  }

  updateUsuarios() {
    this.usuariosCollection.valueChanges().subscribe(data => {
      if (data) {
        this.usuarios = data;
      }
    });
  }

  updatePerfiles() {
    let perfilesCollection: AngularFirestoreCollection<PerfilOptions>;
    perfilesCollection = this.afs.collection<PerfilOptions>('perfiles');
    perfilesCollection.valueChanges().subscribe(data => {
      if (data) {
        this.perfiles = data;
      }
    });
  }

  setDate(date: Date) {
    this.initDate = date;
    let fecha: Date = moment(date).startOf('day').toDate();
    this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    this.updateHorariosInicial();
  }

  updateHorariosInicial() {
    this.disponibilidadDoc.collection<ReservaOptions>('disponibilidades').valueChanges().subscribe(data => {
      this.horario = [];
      this.horarios = [];
      let grupos = [];
      let reservas: ReservaOptions[] = data;
      let fechaInicio = moment(this.initDate).startOf('day').hours(this.horaInicio);
      let fechaFin = moment(this.initDate).hours(this.horaFin);
      let ahora = new Date();
      while (fechaInicio.isSameOrBefore(fechaFin.toDate())) {
        let fechaInicioReserva = fechaInicio.toDate();
        let fechaFinReserva = moment(fechaInicio).add(this.tiempoServicio, 'minutes').toDate();
        let reservaEnc = reservas.find(item => item.fechaInicio.toDate().getTime() === fechaInicioReserva.getTime());
        let reserva: ReservaOptions;
        if (!reservaEnc) {
          reserva = {
            fechaInicio: fechaInicioReserva,
            fechaFin: fechaFinReserva,
            estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
            evento: this.constantes.EVENTOS.OTRO,
            idcarrito: null,
            cliente: this.cliente,
            servicio: this.servicio
          };
        } else {
          reserva = {
            fechaInicio: reservaEnc.fechaInicio.toDate(),
            fechaFin: reservaEnc.fechaFin.toDate(),
            estado: reservaEnc.estado,
            evento: null,
            idcarrito: reservaEnc.idcarrito,
            cliente: reservaEnc.cliente,
            servicio: reservaEnc.servicio
          };
        }

        if (moment(new Date()).isBetween(reserva.fechaInicio, reserva.fechaFin)) {
          reserva.evento = this.constantes.EVENTOS.ACTUAL;
          if (reserva.estado === this.constantes.ESTADOS_RESERVA.RESERVADO) {
            reserva.estado = this.constantes.ESTADOS_RESERVA.EJECUTANDO;
          }
        } else if (reserva.estado == this.constantes.ESTADOS_RESERVA.RESERVADO && moment(ahora).isAfter(reserva.fechaInicio)) {
          reserva.estado = this.constantes.ESTADOS_RESERVA.EJECUTANDO;
        }

        let grupo = moment(reserva.fechaInicio).startOf('hours').format('h:mm a');;
        if (grupos[grupo] === undefined) {
          grupos[grupo] = [];
        }
        grupos[grupo].push(reserva);

        this.horario.push(reserva);
        fechaInicio = moment(reserva.fechaFin);
      }

      for (let grupo in grupos) {
        this.horarios.push({ grupo: grupo, disponibilidad: grupos[grupo] });
      }

      let horaAhora = ahora.getHours();

      if (horaAhora >= this.horaInicio && horaAhora <= this.horaFin && moment(ahora).diff(fechaInicio, 'days') === 0) {
        setTimeout(() => {
          this.scrollTo(this.constantes.EVENTOS.ACTUAL)
        }, 1);
      }
      this.actual = new Date();
    });
  }

  scrollTo(element: string) {
    let yOffset = document.getElementById(element).offsetTop;
    this.content.scrollTo(0, yOffset - 50, 1000)
  }

  reservar(reserva: ReservaOptions) {
    let usuario = this.usuario;
    if (!usuario) {
      this.genericAlert('Error de usuario', 'Usuario no existe');
    } else {
      let perfiles = usuario.perfiles;
      if (!perfiles || perfiles.length === 0) {
        this.genericAlert('Error de perfil de usuario', 'El usuario no tiene ningún perfil asignado');
      } else {
        let cantservicios: number = perfiles.map(perfil => perfil.servicios ? perfil.servicios.length : 0).reduce((a, b) => a + b);

        if (!cantservicios || cantservicios === 0) {
          this.genericAlert('Error de servicios de usuario', 'El usuario no tiene ningún servicio asignado');
        } else {
          this.navCtrl.push('ReservaPage', {
            disponibilidad: reserva,
            horario: this.horario,
            usuario: this.usuario
          });
        }
      }
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

  private eliminar(reserva: ReservaOptions) {
    let fechaInicio = moment(reserva.fechaInicio).locale("es").format("dddd, DD [de] MMMM [de] YYYY");
    let horaInicio = moment(reserva.fechaInicio).format("hh:mm a");
    let nombreCliente = reserva.cliente.nombre;
    let cancelarAlert = this.alertCtrl.create({
      title: 'Cancelar cita',
      message: 'Desea cancelar la cita el día: ' + fechaInicio + ' a las ' + horaInicio,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'OK',
          handler: () => {
            let batch = this.afs.firestore.batch();
            let canceladoDoc: AngularFirestoreDocument<ReservaOptions> = this.disponibilidadDoc.collection('cancelados').doc(new Date().getTime().toString());
            reserva.estado = DataProvider.ESTADOS_RESERVA.CANCELADO;
            batch.set(canceladoDoc.ref, reserva);

            let disponibilidadCancelarDoc: AngularFirestoreDocument = this.disponibilidadDoc.collection('disponibilidades').doc(reserva.fechaInicio.getTime().toString());

            batch.delete(disponibilidadCancelarDoc.ref);

            let pendienteDoc: AngularFirestoreDocument = this.usuarioDoc.collection('pendientes').doc(reserva.fechaInicio.getTime().toString());

            batch.delete(pendienteDoc.ref);

            batch.commit().then(() => {
              this.genericAlert('Cita cancelada', 'La cita con ' + nombreCliente + ' ha sido cancelada');
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
    let reservado = this.constantes.ESTADOS_RESERVA.RESERVADO;
    let tiempoSiguiente = null;
    let siguiente = this.horario.find(function (disponiblidad) {
      return disponiblidad.fechaInicio >= reserva.fechaFin && disponiblidad.estado === reservado;
    });

    if (siguiente) {
      tiempoSiguiente = moment(siguiente.fechaInicio).diff(new Date(), 'minutes');
    }

    reserva.estado = this.constantes.ESTADOS_RESERVA.FINALIZADO;

    let id = reserva.fechaInicio.getTime().toString();

    let batch = this.afs.firestore.batch();

    batch.set(this.disponibilidadDoc.collection('disponibilidades').doc(id).ref, reserva);

    batch.set(this.disponibilidadDoc.collection('finalizados').doc(id).ref, reserva);

    batch.delete(this.usuarioDoc.collection('pendientes').doc(id).ref);

    let mesServicio = moment(reserva.fechaInicio).startOf('month');

    let totalesServiciosDoc = this.afs.doc('totalesservicios/' + mesServicio);

    this.disponibilidadDoc.ref.get().then(datosDiarios => {
      console.log('entra');
      if (datosDiarios.exists) {
        let totalDiarioActual = datosDiarios.get('totalServicios');
        let cantidadDiarioActual = datosDiarios.get('cantidadServicios');
        console.log('total ' + totalDiarioActual);
        console.log('cantidad ' + cantidadDiarioActual);
        let totalDiario = totalDiarioActual ? Number(totalDiarioActual) + Number(reserva.servicio.valor) : reserva.servicio.valor;
        let cantidadDiario = cantidadDiarioActual ? Number(cantidadDiarioActual) + 1 : 1;
        batch.update(this.disponibilidadDoc.ref, { totalServicios: totalDiario, cantidadServicios: cantidadDiario, fecha: new Date() });
      }

      totalesServiciosDoc.ref.get().then(() => {
        batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: new Date() });

        let totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(this.usuario.id);

        totalesServiciosUsuarioDoc.ref.get().then(datos => {
          if (datos.exists) {
            let totalActual = datos.get('totalServicios');
            let cantidadActual = datos.get('cantidadServicios');
            batch.update(totalesServiciosUsuarioDoc.ref, { totalServicios: Number(totalActual) + Number(reserva.servicio.valor), cantidadServicios: Number(cantidadActual) + 1, fecha: new Date() });
          } else {
            let totalServicioUsuario: TotalesServiciosOptions = {
              idusuario: this.usuario.id,
              usuario: this.usuario.nombre,
              imagenusuario: this.usuario.imagen,
              totalServicios: reserva.servicio.valor,
              cantidadServicios: 1,
              fecha: new Date()
            }

            batch.set(totalesServiciosUsuarioDoc.ref, totalServicioUsuario);
          }

          batch.commit().then(() => {
            let serviciosFinalizados = this.reservaCtrl.getReservasByIdServicioAndFinalizado(this.horario, reserva);

            let total = serviciosFinalizados && serviciosFinalizados.length > 0 ? serviciosFinalizados.map(a => a ? a.servicio.valor : 0).reduce((a, b) => a + b) : reserva.servicio.valor;

            let mensaje = tiempoSiguiente ? 'El próximo servicio empieza en: ' + tiempoSiguiente + ' minutos' : 'No hay más citas asignadas';
            this.genericAlert('Servicio finalizado', 'El servicio ha terminado satisfactoriamente. ' + mensaje);

            this.genericAlert('Servicio finalizado', 'Valor servicios: ' + total);
          });
        });
      });
    });
  }

  configActionSheet(title: string, filtros) {
    let actionSheet = this.actionSheetCtrl.create({
      title: title,
      buttons: filtros
    });
    actionSheet.present();
  }

  filtroUsuarios(usuarios: UsuarioOptions[]) {
    let filtros: any = [];
    usuarios.forEach(usuario => {
      filtros.push({
        text: usuario.nombre + ': ' + usuario.perfiles.map(perfil => perfil.nombre).join(" - "), handler: () => {
          this.usuario = usuario;
          this.updateUsuario(usuario.id);
        }
      });
    });

    this.configActionSheet('Selecciona usuario', filtros);
  }

  filtroPerfiles() {
    let filtros: any = [];
    let todosPerfiles: PerfilOptions = { id: '', nombre: 'Todos los perfiles', imagen: null, servicios: null, activo: null }
    filtros.push({
      text: todosPerfiles.nombre, handler: () => {
        this.filtroUsuarios(this.usuarios);
      }
    });

    this.perfiles.forEach(perfil => {
      filtros.push({
        text: perfil.nombre,
        handler: () => {
          let usuarios = this.usuarios.filter(usuario => usuario.perfiles.some(item => item.id === perfil.id));
          this.filtroUsuarios(usuarios);
        }
      });
    });

    this.configActionSheet('Selecciona perfil', filtros);
  }

  ir(pagina: PaginaOptions) {
    this.navCtrl.push(pagina.component);
  }

  updatePendientes() {
    let limite = moment(new Date()).add(-1, 'minute').toDate();
    this.usuarioDoc.collection<ReservaOptions>('pendientes').valueChanges().subscribe(pendientes => {
      if (pendientes && pendientes.length > 0) {
        let pendiente = pendientes[0];
        pendiente.fechaInicio = pendiente.fechaInicio.toDate();
        pendiente.fechaFin = pendiente.fechaFin.toDate();
        if (pendiente.fechaFin < limite.getTime()) {
          this.alertCtrl.create({
            title: 'Reservas pendientes',
            subTitle: 'Tienes una reserva el día ' + moment(pendiente.fechaInicio).locale('es').format('DD/MM/YYYY') + 'a las ' + moment(pendiente.fechaInicio).locale('es').format('h:mm a') + ' con ' + pendiente.cliente.nombre + ' que no ha sido finalizado',
            message: '¿El servicio finalizó?',
            buttons: [{
              text: 'Si',
              handler: () => {
                this.terminar(pendiente);
              }
            }, {
              text: 'No',
              handler: () => {
                this.eliminar(pendiente);
              }
            }]
          }).present();
        }
      }
    });
  }

}