import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, AlertController, ViewController, ModalController, Platform, LoadingController, Loading } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { finalize } from 'rxjs/operators';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { PerfilOptions } from '../../interfaces/perfil-options';
import firebase from 'firebase';
import { UsuarioProvider } from '../../providers/usuario';
import * as DataConstant from '../../providers/constants';

/**
 * Generated class for the DetalleServicioPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-detalle-servicio',
  templateUrl: 'detalle-servicio.html',
})
export class DetalleServicioPage {
  todo: FormGroup;
  nuevo: boolean = true;
  mobile: boolean;
  filePathData: string;
  public servicio: ServicioOptions;
  grupos: string[];
  loading: Loading;

  private servicioDoc: AngularFirestoreDocument<ServicioOptions>;
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
    this.servicio = this.navParams.get('servicio');
    this.filePathEmpresa = this.usuarioServicio.getFilePathEmpresa();
    this.mobile = plt.is('android');
    this.updateGrupos();
    this.updateServicio();
    this.loading = this.loadingCtrl.create({
      content: 'Procesando...',
      dismissOnPageChange: true
    });
  }

  cerrar() {
    this.viewCtrl.dismiss();
  }

  private updateGrupos() {
    this.afs.doc<any>('clases/Grupos').valueChanges().subscribe(data => {
      if (data) {
        this.grupos = data.data;
      }
    });
  }

  private form() {
    this.todo = this.formBuilder.group({
      id: [this.servicio.id, Validators.required],
      nombre: [this.servicio.nombre, Validators.required],
      descripcion: [this.servicio.descripcion, Validators.required],
      duracion_MIN: [this.servicio.duracion_MIN, Validators.required],
      valor: [this.servicio.valor, Validators.required],
      grupo: [this.servicio.grupo, Validators.required],
      imagen: [this.servicio.imagen]
    });
  }

  private updateServicio() {
    if (!this.servicio) {
      this.servicio = {
        id: this.afs.createId(),
        nombre: null,
        descripcion: null,
        duracion_MIN: null,
        valor: null,
        grupo: null,
        imagen: null,
        activo: true
      };
    }

    this.filePathData = this.filePathEmpresa + '/servicios/' + this.servicio.id;

    this.servicioDoc = this.afs.doc<ServicioOptions>(this.filePathData);
    this.servicioDoc.valueChanges().subscribe(data => {
      if (data) {
        this.servicio = data;

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
    let alert = this.alertCtrl.create({
      title: title,
      message: message,
      buttons: [{
        text: 'OK',
        handler: () => {
          this.viewCtrl.dismiss();
        }
      }]
    });
    alert.present();
  }

  private loadPerfilesGrupo(grupo: string) {
    const perfilesCollection: AngularFirestoreCollection<PerfilOptions> = this.afs.collection<PerfilOptions>(this.filePathEmpresa + '/perfiles');
    return new Promise<PerfilOptions[]>(resolve => {
      perfilesCollection.valueChanges().subscribe(perfilesEmpresa => {
        if (perfilesEmpresa[0]) {
          const perfiles = perfilesEmpresa.filter(perfil => perfil.grupo === grupo);
          resolve(perfiles);
        } else {
          resolve([]);
        }
      });
    });
  }

  guardar() {
    this.servicio = this.todo.value;
    const modo = this.nuevo ? 'registrado' : 'actualizado';
    const batch = this.afs.firestore.batch();
    this.loading.present();
    batch.set(this.servicioDoc.ref, this.servicio);
    this.procesarServicioPerfil(batch, DataConstant.PROCESO_MAESTROS.GUARDAR).then(() => {
      batch.commit().then(() => {
        const alert = this.alertCtrl.create({
          title: 'Servicio ' + modo,
          message: 'El servicio ha sido ' + modo + ' exitosamente',
          buttons: ['OK']
        });
        alert.present();
        this.viewCtrl.dismiss();
      }).catch(err => err);
    }).catch(err => {
      this.loading.dismiss();
      this.genericAlert('Ha ocurrido un error', 'Se presentó un error al guardar el servicio. Error: ' + err);
    });
  }

  private procesarServicioPerfil(batch: firebase.firestore.WriteBatch, proceso: string) {
    return new Promise((resolve, reject) => {
      this.loadPerfilesGrupo(this.servicio.grupo).then(perfilesGrupo => {
        if (perfilesGrupo[0]) {
          perfilesGrupo.forEach(perfil => {
            const filePathServicioPerfilEmpresa = this.filePathEmpresa + '/perfiles/' + perfil.id + '/servicios/' + this.servicio.id;
            const servicioPerfilEmpresaDoc: AngularFirestoreDocument = this.afs.doc(filePathServicioPerfilEmpresa);
            switch (proceso) {
              case DataConstant.PROCESO_MAESTROS.GUARDAR:
                batch.set(servicioPerfilEmpresaDoc.ref, this.servicio);
                break;

              case DataConstant.PROCESO_MAESTROS.ELIMINAR:
                batch.delete(servicioPerfilEmpresaDoc.ref);
                break;
            }
            resolve('ok');
          });
        } else {
          resolve('ok');
        }
      }).catch(err => reject(err));
    });
  }

  eliminar() {
    this.alertCtrl.create({
      title: 'Eliminar servicio',
      message: '¿Desea eliminar el servicio ' + this.servicio.nombre,
      buttons: [{
        text: 'No',
        role: 'cancel'
      }, {
        text: 'Si',
        handler: () => {
          const batch = this.afs.firestore.batch();
          batch.delete(this.servicioDoc.ref);
          this.loading.present();
          this.procesarServicioPerfil(batch, DataConstant.PROCESO_MAESTROS.ELIMINAR).then(() => {
            batch.commit().then(() => {
              const alert = this.alertCtrl.create({
                title: 'Servicio eliminado',
                message: 'El servicio ha sido eliminado exitosamente',
                buttons: ['OK']
              });
              alert.present();
              this.viewCtrl.dismiss();
            }).catch(err => err);
          }).catch(err => {
            this.loading.dismiss();
            this.genericAlert('Ha ocurrido un error', 'Se presentó un error al guardar el servicio. Error: ' + err);
          });
        }
      }]
    }).present();
  }

}
