import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, LoadingController, ViewController } from 'ionic-angular';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import { UsuarioProvider } from '../../providers/usuario';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { ServicioPaqueteOptions } from '../../interfaces/servicio-paquete-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { SesionPaqueteOptions } from '../../interfaces/sesion-paquete-options';

/**
 * Generated class for the DetalleServicioPaquetePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-detalle-servicio-paquete',
  templateUrl: 'detalle-servicio-paquete.html',
})
export class DetalleServicioPaquetePage {

  public paquete: PaqueteOptions;
  private filePathPaquete: string;
  private filePathServicios: string;
  private paqueteDocument: AngularFirestoreDocument<PaqueteOptions>;
  private serviciosPaqueteCollection: AngularFirestoreCollection<ServicioPaqueteOptions>;
  private servicioCollection: AngularFirestoreCollection<ServicioOptions>;
  private serviciosPaquete: ServicioPaqueteOptions[];
  private servicios: ServicioOptions[];
  public continuar: boolean;
  private sesiones: SesionPaqueteOptions[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private usuarioServicio: UsuarioProvider,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public viewCtrl: ViewController) {
    const idpaquete = navParams.get('idpaquete');
    this.sesiones = navParams.get('sesiones');
    const filePathEmpresa = this.usuarioServicio.getFilePathEmpresa();
    this.filePathServicios = filePathEmpresa + '/servicios/';
    this.filePathPaquete = filePathEmpresa + '/paquetes/' + idpaquete;
    this.updatePaquete();
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
        this.updateServicios().then(() => {
          const filePathServiciosPaquete = this.filePathPaquete + '/servicios';
          this.serviciosPaqueteCollection = this.afs.collection<ServicioPaqueteOptions>(filePathServiciosPaquete);
          this.updateServiciosPaquete();
        });
      }
    });
  }

  private updateServicios() {
    this.servicioCollection = this.afs.collection<ServicioOptions>(this.filePathServicios, ref => ref.where('grupo.id', '==', this.paquete.grupo.id));
    return new Promise(resolve => {
      this.servicioCollection.valueChanges().subscribe(servicios => {
        this.servicios = servicios;
        resolve('ok');
      });
    });
  }

  private updateServiciosPaquete() {
    this.serviciosPaqueteCollection.valueChanges().subscribe((serviciosPaquete) => {
      this.serviciosPaquete = [];
      if (serviciosPaquete[0] && !this.sesiones) {
        this.servicios.forEach(servicio => {
          const encontrado = serviciosPaquete.find(servicioPaquete => servicioPaquete.servicio.id === servicio.id);
          if (encontrado) {
            this.serviciosPaquete.push(encontrado);
          } else {
            this.serviciosPaquete.push({
              activo: false,
              servicio: servicio,
              sesiones: 0
            });
          }
        });

        this.updateContinuar();
      } else if (serviciosPaquete[0] && this.sesiones) {
        if (serviciosPaquete[0]) {
          this.serviciosPaquete = serviciosPaquete.filter(servicioPaquete => {
            const sesionesServicio = this.sesiones.filter(sesion => sesion.servicios.some(servicio => servicio.id === servicioPaquete.servicio.id)).length;
            return servicioPaquete.activo && sesionesServicio < servicioPaquete.sesiones
          });
          this.serviciosPaquete.forEach(servicioPaquete => {
            servicioPaquete.activo = false;
          });
        } else {
          this.alertCtrl.create({
            title: 'Sin servicios',
            message: 'Este paquete no tiene servicios agrega al menos un servicio',
            buttons: [{
              text: 'Ok',
              handler: () => {
                this.navCtrl.popTo('DetallePaquetePage');
              }
            }]
          }).present();
        }
      } else {
        this.servicios.forEach(servicio => {
          this.serviciosPaquete.push({
            activo: false,
            servicio: servicio,
            sesiones: 0
          });
        });
      }
    });
  }

  public agregar(servicioPaquete: ServicioPaqueteOptions) {
    if (!this.sesiones && servicioPaquete.activo) {
      this.alertCtrl.create({
        title: 'Sesiones',
        message: 'Número de sesiones de ' + servicioPaquete.servicio.nombre,
        inputs: [{
          type: 'number',
          min: 1,
          max: 5,
          name: 'sesiones',
          value: '1'
        }],
        buttons: [{
          text: 'Ok',
          handler: data => {
            servicioPaquete.sesiones = Number(data.sesiones);
          }
        }]
      }).present();
    } else if(!this.sesiones){
      servicioPaquete.sesiones = null;
    }
    this.updateContinuar();
  }

  updateContinuar() {
    this.continuar = this.serviciosPaquete.some(servicio => servicio.activo);
  }

  public guardar() {
    const loaging = this.loadingCtrl.create({
      content: 'Procesando...',
      dismissOnPageChange: true
    });
    loaging.present();
    const batch = this.afs.firestore.batch();
    this.serviciosPaquete.forEach(servicioPaquete => {
      const idservicio = servicioPaquete.servicio.id;
      const servicioPaqueteDocument = this.serviciosPaqueteCollection.doc(idservicio);
      batch.set(servicioPaqueteDocument.ref, servicioPaquete);
    });

    batch.commit().then(() => {
      this.navCtrl.push('DetalleSesionesPaquetePage', {
        idpaquete: this.paquete.id
      });
    }).catch(err => {
      this.alertCtrl.create({
        title: 'Ha ocurrido un error',
        message: 'Se presentó un error al guardar los servicios del paquete, Error: ' + err,
        buttons: [{
          text: 'Ok',
          handler: () => {
            loaging.dismiss();
          }
        }]
      }).present();
    });
  }

  public cancelar() {
    this.navCtrl.pop();
  }

  public sesion() {
    const servicios = this.serviciosPaquete.filter(servicioPaquete => servicioPaquete.activo).map(servicioPaquete => servicioPaquete.servicio);
    this.viewCtrl.dismiss({
      servicios: servicios
    });
  }

}
