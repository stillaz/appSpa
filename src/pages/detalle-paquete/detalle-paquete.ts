import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Loading, AlertController, ViewController, ModalController, Platform, LoadingController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import { GrupoOptions } from '../../interfaces/grupo-options';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { UsuarioProvider } from '../../providers/usuario';
import { finalize } from 'rxjs/operators';
import firebase from 'firebase';

/**
 * Generated class for the DetallePaquetePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-detalle-paquete',
  templateUrl: 'detalle-paquete.html',
})
export class DetallePaquetePage {

  public todo: FormGroup;
  public nuevo: boolean = true;
  public mobile: boolean;
  private filePathData: string;
  public paquete: PaqueteOptions;
  public grupos: GrupoOptions[];
  public loading: Loading;
  private filePathGrupo: string;
  private grupoCollection: AngularFirestoreCollection<GrupoOptions>;

  private paqueteDoc: AngularFirestoreDocument<PaqueteOptions>;
  private filePathEmpresa: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    public modalCtrl: ModalController,
    public plt: Platform,
    private storage: AngularFireStorage,
    private camera: Camera,
    private usuarioServicio: UsuarioProvider,
    public loadingCtrl: LoadingController
  ) {
    this.paquete = this.navParams.get('paquete');
    this.filePathEmpresa = this.usuarioServicio.getFilePathEmpresa();
    this.filePathGrupo = this.usuarioServicio.getFilePathGruposEmpresa();
    this.mobile = plt.is('android');
    this.updateGrupos();
    this.updatePaquete();
    this.loading = this.loadingCtrl.create({
      content: 'Procesando...',
      dismissOnPageChange: true
    });
  }

  cerrar() {
    this.viewCtrl.dismiss();
  }

  private updateGrupos() {
    this.grupoCollection = this.afs.collection<GrupoOptions>(this.filePathGrupo);
    this.grupoCollection.valueChanges().subscribe(data => {
      this.grupos = data;
    });
  }

  private form() {
    this.todo = this.formBuilder.group({
      id: [this.paquete.id, Validators.required],
      nombre: [this.paquete.nombre, Validators.required],
      descripcion: [this.paquete.descripcion, Validators.required],
      valor: [this.paquete.valor, Validators.required],
      grupo: [this.paquete.grupo, Validators.required],
      //servicios: [this.paquete.servicios, Validators.required],
      //sesiones: [this.paquete.sesiones, Validators.required],
      imagen: [this.paquete.imagen]
    });
  }

  private updatePaquete() {
    if (!this.paquete) {
      this.paquete = {
        id: this.afs.createId(),
        nombre: null,
        descripcion: null,
        valor: null,
        grupo: null,
        imagen: null,
        activo: true,
        servicios: null,
        sesiones: null
      };
    }

    this.filePathData = this.filePathEmpresa + '/paquetes/' + this.paquete.id;

    this.paqueteDoc = this.afs.doc<PaqueteOptions>(this.filePathData);
    this.paqueteDoc.valueChanges().subscribe(data => {
      if (data) {
        this.paquete = data;

        this.nuevo = false;
      }
    });

    this.form();
  }

  seleccionarImagen(event) {
    let imagen = event.target.files[0];
    let fileRef = this.storage.ref(this.filePathData);
    let task = this.storage.upload(this.filePathData, imagen);
    task.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.todo.patchValue({ imagen: data });
        });
      })
    ).subscribe();
  }

  sacarFoto() {
    let cameraOptions: CameraOptions = {
      quality: 50,
      encodingType: this.camera.EncodingType.JPEG,
      targetWidth: 1000,
      targetHeight: 1000,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.CAMERA,
      correctOrientation: true
    }

    this.camera.getPicture(cameraOptions).then((imageData) => {
      let imagen = "data:image/jpeg;base64," + imageData;
      let fileRef = this.storage.ref(this.filePathData);
      fileRef.putString(imagen, firebase.storage.StringFormat.DATA_URL).then(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.todo.patchValue({ imagen: data });
        });
      });
    }).catch(err => alert('Upload Failed' + err));
  }

  cargarImagen() {
    let cameraOptions: CameraOptions = {
      quality: 50,
      encodingType: this.camera.EncodingType.JPEG,
      destinationType: this.camera.DestinationType.DATA_URL,
      sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
      mediaType: this.camera.MediaType.PICTURE,
      correctOrientation: true
    }

    this.camera.getPicture(cameraOptions).then((imageData) => {
      let imagen = "data:image/jpeg;base64," + imageData;
      let fileRef = this.storage.ref(this.filePathData);
      fileRef.putString(imagen, firebase.storage.StringFormat.DATA_URL).then(() => {
        fileRef.getDownloadURL().subscribe(data => {
          this.todo.patchValue({ imagen: data });
        });
      });
    }).catch(err => alert('Upload Failed' + err));
  }

  private genericAlert(title: string, message: string) {
    this.alertCtrl.create({
      title: title,
      message: message,
      buttons: [{
        text: 'OK',
        handler: () => {
          this.viewCtrl.dismiss();
        }
      }]
    }).present();
  }

  guardar() {
    this.paquete = this.todo.value;
    const modo = this.nuevo ? 'registrado' : 'actualizado';
    this.loading.present();
    this.paqueteDoc.set(this.paquete).then(() => {
      this.alertCtrl.create({
        title: 'Paquete ' + modo,
        message: 'El paquete ha sido ' + modo + ' exitosamente',
        buttons: ['OK']
      }).present();
      this.viewCtrl.dismiss();
    }).catch(err => {
      this.loading.dismiss();
      this.genericAlert('Ha ocurrido un error', 'Se presentó un error al guardar el paquete. Error: ' + err);
    });
  }

  eliminar() {
    this.alertCtrl.create({
      title: 'Eliminar paquete',
      message: '¿Desea eliminar el paquete ' + this.paquete.nombre,
      buttons: [{
        text: 'No',
        role: 'cancel'
      }, {
        text: 'Si',
        handler: () => {
          this.loading.present();
          this.paqueteDoc.delete().then(() => {
            const alert = this.alertCtrl.create({
              title: 'Paquete eliminado',
              message: 'El paquete ha sido eliminado exitosamente',
              buttons: ['OK']
            });
            alert.present();
            this.viewCtrl.dismiss();
          }).catch(err => {
            this.loading.dismiss();
            this.genericAlert('Ha ocurrido un error', 'Se presentó un error al eliminar el paquete. Error: ' + err);
          });
        }
      }]
    }).present();
  }

  compareFn(e1: GrupoOptions, e2: GrupoOptions): boolean {
    return e1 && e2 ? e1.id === e2.id : e1 === e2;
  }

  servicios() {
    this.navCtrl.push('DetalleServicioPaquetePage', {
      idpaquete: this.paquete.id
    });
  }

  sesiones() {
    this.navCtrl.push('DetalleSesionesPaquetePage', {
      idpaquete: this.paquete.id
    });
  }

}
