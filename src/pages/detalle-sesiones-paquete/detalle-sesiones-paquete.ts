import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController, ModalController, ToastController } from 'ionic-angular';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import { AngularFirestoreDocument, AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { ServicioPaqueteOptions } from '../../interfaces/servicio-paquete-options';
import { SesionPaqueteOptions } from '../../interfaces/sesion-paquete-options';
import { UsuarioProvider } from '../../providers/usuario';

/**
 * Generated class for the DetalleSesionesPaquetePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-detalle-sesiones-paquete',
  templateUrl: 'detalle-sesiones-paquete.html',
})
export class DetalleSesionesPaquetePage {

  public paquete: PaqueteOptions;
  private filePathPaquete: string;
  private paqueteDocument: AngularFirestoreDocument<PaqueteOptions>;
  private serviciosPaqueteCollection: AngularFirestoreCollection<ServicioPaqueteOptions>;
  private serviciosPaquete: ServicioPaqueteOptions[];
  private sesionesPaqueteCollection: AngularFirestoreCollection<SesionPaqueteOptions>;
  public sesionesPaquete: any[];
  public advertencia: boolean;
  public continuar: boolean;
  public editar: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private usuarioServicio: UsuarioProvider,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController) {
    const idsesion = navParams.get('idsesion');
    const sesiones = navParams.get('sesiones');
    this.editar = !sesiones;

    if (!sesiones) {
      const idpaquete = navParams.get('idpaquete');
      const filePathEmpresa = this.usuarioServicio.getFilePathEmpresa();
      this.filePathPaquete = filePathEmpresa + '/paquetes/' + idpaquete;
      this.updatePaquete();
    } else {
      this.sesionesPaquete = sesiones.sort((a, b) => {
        if (Number(a.id) > Number(b.id)) {
          return 1;
        } else if (Number(a.id) < Number(b.id)) {
          return -1;
        } else {
          return 0;
        }
      });

      if (!this.editar) {
        const sesionactivo = this.sesionesPaquete.find(sesion => sesion.id === idsesion);
        sesionactivo.activo = true;
      }
    }
  }

  private updatePaquete() {
    this.paqueteDocument = this.afs.doc<PaqueteOptions>(this.filePathPaquete);
    this.paqueteDocument.valueChanges().subscribe(paquete => {
      if (!paquete) {
        this.alertCtrl.create({
          title: 'Error al obtener el paquete',
          message: 'No hay datos del paquete',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.navCtrl.pop();
            }
          }]
        }).present();
      } else {
        this.paquete = paquete;
        this.updateServiciosPaquete();
        this.updateSesionesPaquete();
      }
    });
  }

  private updateServiciosPaquete() {
    const filePathServiciosPaquete = this.filePathPaquete + '/servicios';
    this.serviciosPaqueteCollection = this.afs.collection<ServicioPaqueteOptions>(filePathServiciosPaquete, ref => ref.where('activo', '==', true));
    this.serviciosPaqueteCollection.valueChanges().subscribe((serviciosPaquete) => {
      this.serviciosPaquete = serviciosPaquete;
    });
  }

  private updateSesionesPaquete() {
    const filePathSesiones = this.filePathPaquete + '/sesiones';
    this.sesionesPaqueteCollection = this.afs.collection<SesionPaqueteOptions>(filePathSesiones);
    this.sesionesPaqueteCollection.valueChanges().subscribe(sesionesPaquete => {
      this.sesionesPaquete = sesionesPaquete.sort((a, b) => {
        if (Number(a.id) > Number(b.id)) {
          return 1;
        } else if (Number(a.id) < Number(b.id)) {
          return -1;
        } else {
          return 0;
        }
      });

      this.updateAdvertencia();
      this.updateContinuar();
    });
  }

  private updateContinuar() {
    this.continuar = this.sesionesPaquete !== null && this.sesionesPaquete[0] !== undefined;
  }

  private updateAdvertencia() {
    this.advertencia = this.serviciosPaquete.some(servicio => {
      const sesionesServicio = this.sesionesPaquete.filter(sesion => sesion.servicios.some(servicioSesion => servicioSesion.id === servicio.servicio.id));
      return sesionesServicio.length !== servicio.sesiones;
    });
  }

  public agregar() {
    const modal = this.modalCtrl.create('DetalleServicioPaquetePage', {
      idpaquete: this.paquete.id,
      sesiones: this.sesionesPaquete
    });
    modal.onDidDismiss(data => {
      if (data && data.servicios[0]) {
        const sesion: SesionPaqueteOptions = {
          id: null,
          servicios: data.servicios
        };

        this.sesionesPaquete.push(sesion);
      }

      this.updateSesiones();
      this.updateAdvertencia();
      this.updateContinuar();
    });
    modal.present();
  }

  private updateSesiones() {
    this.sesionesPaquete.forEach((sesion, index) => {
      const id = index + 1;
      sesion.id = id.toString();
    });
  }

  public eliminar(sesion: SesionPaqueteOptions) {
    const index = this.sesionesPaquete.indexOf(sesion);
    this.sesionesPaquete.splice(index, 1);
    this.updateSesiones();
    this.updateAdvertencia();
    this.updateContinuar();
  }

  public guardar() {
    if (this.advertencia) {
      this.alertCtrl.create({
        title: 'Sesiones incompletas',
        subTitle: 'Existen servicios que faltan para asignar',
        message: '¿Desea continuar?',
        buttons: [{
          text: 'Si',
          handler: () => {
            this.registrarSesiones();
          }
        }, {
          text: 'No',
          role: 'cancel'
        }]
      }).present();
    } else {
      this.registrarSesiones();
    }
  }

  private registrarSesiones() {
    const loaging = this.loadingCtrl.create({
      content: 'Procesando...',
      dismissOnPageChange: true
    });
    loaging.present();
    const batch = this.afs.firestore.batch();
    this.sesionesPaquete.forEach(sesion => {
      const sesionPaqueteDocument = this.sesionesPaqueteCollection.doc(sesion.id);
      batch.set(sesionPaqueteDocument.ref, sesion);
    });

    batch.commit().then(() => {
      this.toastCtrl.create({
        message: 'Se ha configurado las sesiones del paquete',
        duration: 3000
      }).present();
      this.navCtrl.popTo('PaquetePage');
    }).catch(err => {
      this.alertCtrl.create({
        title: 'Ha ocurrido un error',
        message: 'Se presentó un error al guardar las sesiones del paquete, Error: ' + err,
        buttons: [{
          text: 'Ok',
          handler: () => {
            loaging.dismiss();
          }
        }]
      }).present();
    });
  }

  public showAdvertencia() {
    this.alertCtrl.create({
      title: 'Servicios',
      message: 'Existen servicios que faltan para asignar',
      buttons: [{
        text: 'Ok'
      }]
    }).present();
  }

  public reorderItems(indexes) {
    const element = this.sesionesPaquete[indexes.from];
    this.sesionesPaquete.splice(indexes.from, 1);
    this.sesionesPaquete.splice(indexes.to, 0, element);
    this.updateSesiones();
  }

  public cancelar() {
    this.navCtrl.popTo('PaquetePage');
  }

  public cerrar() {
    this.navCtrl.pop();
  }

}
