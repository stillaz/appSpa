import moment from 'moment';
import { Component, ViewChild } from '@angular/core';
import { AlertController, Content, IonicPage, ItemSliding, NavController, ActionSheetController, PopoverController, ToastController, Loading, LoadingController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ClienteOptions } from '../../interfaces/cliente-options';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { interval } from 'rxjs';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { PerfilOptions } from '../../interfaces/perfil-options';
import { UsuarioProvider } from '../../providers/usuario';
import { GrupoOptions } from '../../interfaces/grupo-options';

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

    public horaInicio = 0;
    public horaFin = 24;
    public tiempoServicio = 30;
    public initDate: Date = new Date();
    public initDate2: Date = new Date();
    public disabledDates: Date[] = [];
    public maxDate: Date = moment(new Date()).add(30, 'days').toDate();
    public min: Date = new Date();
    public constantes = DataProvider;
    public usuario = {} as UsuarioOptions;
    public usuarioLogueado: UsuarioOptions;
    public horario: ReservaOptions[];
    public horarios: any[];
    private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
    public perfiles: PerfilOptions[];
    public usuarios: UsuarioOptions[];
    private disponibilidadDoc: AngularFirestoreDocument;
    public terms: string = '';
    private indisponibles: any;
    private filePathEmpresa: string;
    public administrador: boolean;
    public actual: Date = new Date();
    private loading: Loading;
    private empresaDoc: AngularFirestoreDocument;

    public opciones: any[] = [{
        title: 'Configuración',
        component: 'ConfiguracionAgendaPage',
        icon: 'stats'
    }];

    constructor(
        public alertCtrl: AlertController,
        public actionSheetCtrl: ActionSheetController,
        public navCtrl: NavController,
        private afs: AngularFirestore,
        public popoverCtrl: PopoverController,
        private usuarioService: UsuarioProvider,
        public toastCtrl: ToastController,
        public loadingCtrl: LoadingController
    ) {
        this.loading = loadingCtrl.create({
            content: 'Procesando'
        });
        this.usuarioLogueado = this.usuarioService.getUsuario();
        this.filePathEmpresa = 'negocios/' + this.usuarioLogueado.idempresa;
        this.empresaDoc = this.afs.doc(this.filePathEmpresa);
        this.administrador = this.usuarioService.isAdministrador();
        if (this.administrador) {
            this.updateUsuarios();
            this.updatePerfiles();
        }
    }

    ionViewDidLoad() {
        interval(60000).subscribe(() => {
            this.actual = new Date();
            this.initDate = new Date();
            this.initDate2 = new Date();
            this.updateHorariosInicial();
        });
    }

    ionViewDidEnter() {
        this.updateUsuario(this.usuarioLogueado.id);
    }

    updateUsuarios() {
        let filePathUsuarios = this.filePathEmpresa + '/usuarios';
        let usuariosCollection = this.afs.collection<UsuarioOptions>(filePathUsuarios);
        usuariosCollection.valueChanges().subscribe(data => {
            this.usuarios = data;
        });
    }

    private updatePerfiles() {
        let filePathPerfiles = this.filePathEmpresa + '/perfiles';
        let perfilesCollection = this.afs.collection<PerfilOptions>(filePathPerfiles);
        perfilesCollection.valueChanges().subscribe(data => {
            this.perfiles = data;
        });
    }

    setDate(date: Date) {
        this.initDate = date;
        let fecha: Date = moment(date).startOf('day').toDate();
        this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
        this.updateHorariosInicial();
    }

    updateUsuario(id: string) {
        this.usuarioDoc = this.afs.doc<UsuarioOptions>(this.filePathEmpresa + '/usuarios/' + id);
        this.usuarioDoc.valueChanges().subscribe(data => {
            if (data) {
                this.usuario = data;
                const configuracion = this.usuario.configuracion;
                if (configuracion) {
                    this.horaInicio = configuracion.horaInicio;
                    this.horaFin = configuracion.horaFin;
                    this.tiempoServicio = configuracion.tiempoDisponibilidad;
                }
                let fecha = moment(this.initDate).startOf('days').toDate().getTime().toString();
                this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha);
                this.updateHorarioNoDisponible();
            }
        });
    }

    loadHorarioNoDisponible(fecha: Date): ServicioOptions {
        const encontrado = this.indisponibles.find(item => {
            if (item.repetir.id === -1 || item.repetir.id === 10 || fecha.getDay() === item.repetir.id + 1) {
                let fechaDesde: Date = moment(new Date(item.fechaDesde)).startOf('day').toDate();
                let fechaFin: Date = item.indefinido ? moment(fecha).endOf('day').toDate() : moment(new Date(item.fechaHasta)).endOf('day').toDate();
                if (moment(fecha).isBetween(fechaDesde, fechaFin)) {
                    let horaInicio = item.todoDia ? this.horaInicio : moment(item.horaDesde, 'HH:mm').toDate().getHours();
                    let horaFin = item.todoDia ? this.horaFin : moment(item.horaHasta, 'HH:mm').toDate().getHours() - 1;
                    let horaReserva = fecha.getHours();
                    if (horaReserva >= horaInicio && horaReserva <= horaFin) {
                        return item;
                    }
                }
            }
        });

        let servicio: ServicioOptions;

        if (encontrado) {
            servicio = {} as ServicioOptions;
            servicio.nombre = encontrado.descripcion;
        }

        return servicio;
    }

    updateHorarioNoDisponible() {
        const indisponibilidadCollection = this.usuarioDoc.collection('indisponibilidades');
        indisponibilidadCollection.valueChanges().subscribe(indisponibilidades => {
            this.indisponibles = indisponibilidades;
            this.updateHorariosInicial();
        });
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
                let noDisponible = this.loadHorarioNoDisponible(fechaInicioReserva);
                let reserva: ReservaOptions;
                if (noDisponible) {
                    reserva = {
                        fechaInicio: fechaInicioReserva,
                        fechaFin: fechaFinReserva,
                        estado: this.constantes.ESTADOS_RESERVA.NO_DISPONIBLE,
                        evento: this.constantes.EVENTOS.OTRO,
                        idcarrito: null,
                        cliente: {} as ClienteOptions,
                        servicio: [noDisponible],
                        usuario: this.usuario,
                        id: null,
                        fechaActualizacion: new Date(),
                        leido: null,
                        pago: null,
                        paquete: null
                    };
                } else {
                    let reservaEnc = reservas.find(item => item.fechaInicio.toDate().getTime() === fechaInicioReserva.getTime());
                    if (!reservaEnc) {
                        reserva = {
                            fechaInicio: fechaInicioReserva,
                            fechaFin: fechaFinReserva,
                            estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
                            evento: this.constantes.EVENTOS.OTRO,
                            idcarrito: null,
                            cliente: {} as ClienteOptions,
                            servicio: [],
                            usuario: this.usuario,
                            id: null,
                            fechaActualizacion: new Date(),
                            leido: null,
                            pago: null,
                            paquete: null
                        };
                    } else {
                        reserva = {
                            fechaInicio: reservaEnc.fechaInicio.toDate(),
                            fechaFin: reservaEnc.fechaFin.toDate(),
                            estado: reservaEnc.estado,
                            evento: null,
                            idcarrito: reservaEnc.idcarrito,
                            cliente: reservaEnc.cliente,
                            servicio: reservaEnc.servicio,
                            usuario: reservaEnc.usuario,
                            id: reservaEnc.id,
                            fechaActualizacion: new Date(),
                            leido: null,
                            pago: null,
                            paquete: null
                        };
                    }
                }

                if (moment(ahora).isBetween(reserva.fechaInicio, reserva.fechaFin)) {
                    reserva.evento = this.constantes.EVENTOS.ACTUAL;
                    if (reserva.estado === this.constantes.ESTADOS_RESERVA.RESERVADO) {
                        reserva.estado = this.constantes.ESTADOS_RESERVA.EJECUTANDO;
                    }
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
        });
    }

    scrollTo(element: string) {
        if (!this.terms) {
            let yOffset = document.getElementById(element).offsetTop;
            this.content.scrollTo(0, yOffset - 50, 1000);
        }
    }

    hayServicios() {
        const gruposPerfil: GrupoOptions[] = this.usuario.perfiles.filter(perfil => perfil.grupo).map(perfil => perfil.grupo.reduce(grupos => grupos));
        const filePathServicios = this.filePathEmpresa + '/servicios/';
        const serviciosCollection: AngularFirestoreCollection<ServicioOptions> = this.afs.collection<ServicioOptions>(filePathServicios);
        return new Promise<boolean>(resolve => {
            serviciosCollection.valueChanges().subscribe(servicios => {
                resolve(servicios.some(servicio => gruposPerfil.some(grupoPerfil => grupoPerfil.id === servicio.grupo.id)));
            });
        });
    }

    reservar(reserva: ReservaOptions) {
        const usuario = this.usuario;
        if (!usuario) {
            this.genericAlert('Error de usuario', 'Usuario no existe');
        } else {
            const perfiles = usuario.perfiles;
            if (!perfiles || perfiles.length === 0) {
                this.genericAlert('Error de perfil de usuario', 'El usuario no tiene ningún perfil asignado');
            } else {
                this.hayServicios().then(data => {
                    if (data) {
                        this.navCtrl.push('ReservaPage', {
                            disponibilidad: reserva,
                            horario: this.horario,
                            usuario: this.usuario
                        });
                    } else {
                        this.genericAlert('Error de servicios de usuario', 'El usuario no tiene ningún servicio asignado');
                    }
                });
            }
        }
    }

    public cancelar(slidingItem: ItemSliding, reserva: ReservaOptions) {
        const fechaServicio = reserva.fechaInicio;
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
        }).present();
        slidingItem.close();
    }

    private eliminarSesionPaquete(batch: firebase.firestore.WriteBatch, reserva: ReservaOptions, fechaServicio: Date) {
        const idpaquete = reserva.idcarrito.toString();
        const idsesion = reserva.paquete.sesion;
        const clienteDoc = this.empresaDoc.collection('clientes').doc(reserva.cliente.id);
        const paqueteClienteDoc = clienteDoc.collection('paquetes').doc(idpaquete);
        const sesionPaqueteClienteDoc = paqueteClienteDoc.collection('sesiones').doc(idsesion.toString());

        batch.delete(sesionPaqueteClienteDoc.ref);

        if (idsesion === 1) {
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

        this.loading.present();

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
                this.loading.dismiss();
            }).catch(err => {
                this.loading.dismiss();
                this.alertCtrl.create({
                    buttons: [{
                        text: 'Ok',
                        role: 'cancel'
                    }],
                    message: 'Error: ' + err,
                    subTitle: 'Ha ocurrido un error al cancelar la reserva',
                    title: 'Se presentó un error'
                }).present();
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
                text: usuario.nombre, handler: () => {
                    this.usuario = usuario;
                    this.updateUsuario(usuario.id);
                }
            });
        });

        this.configActionSheet('Selecciona usuario', filtros);
    }

    filtroPerfiles() {
        let filtros: any = [];
        let todosPerfiles: PerfilOptions = {
            id: '',
            nombre: 'Todos los perfiles',
            imagen: null,
            grupo: null
        }
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

    presentPopover(myEvent) {
        let popover = this.popoverCtrl.create('PendientePagoPage');
        popover.present({
            ev: myEvent
        });
    }

    mensaje(mensaje: string) {
        this.toastCtrl.create({
            message: mensaje,
            duration: 3000
        }).present();
    }

    genericAlert(titulo: string, mensaje: string) {
        let mensajeAlert = this.alertCtrl.create({
            title: titulo,
            message: mensaje,
            buttons: ['OK']
        });

        mensajeAlert.present();
    }

}