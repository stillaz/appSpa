import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, AlertController, ViewController, ModalController, Platform } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { FileChooser } from '@ionic-native/file-chooser';
import { finalize } from 'rxjs/operators';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { FilePath } from '@ionic-native/file-path';
import { PerfilOptions } from '../../interfaces/perfil-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';

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

  private servicioDoc: AngularFirestoreDocument<ServicioOptions>;
  private perfilesCollection: AngularFirestoreCollection<PerfilOptions>;
  private usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    public modalCtrl: ModalController,
    public plt: Platform,
    public fileChooser: FileChooser,
    private storage: AngularFireStorage,
    private camera: Camera,
    private filePath: FilePath
  ) {
    this.mobile = !plt.is('core');
    this.servicio = this.navParams.get('servicio');
    this.updateServicio();
  }

  form() {
    this.todo = this.formBuilder.group({
      id: [this.servicio.id, Validators.required],
      nombre: [this.servicio.nombre, Validators.required],
      descripcion: [this.servicio.descripcion, Validators.required],
      duracion_MIN: [this.servicio.duracion_MIN, Validators.required],
      valor: [this.servicio.valor, Validators.required],
      grupo: [this.servicio.grupo],
      imagen: [this.servicio.imagen],
      activo: [this.servicio.activo, Validators.required]
    });
  }

  updateServicio() {
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

    this.filePathData = 'servicios/' + this.servicio.id;
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
      let task = fileRef.putString(this.filePathData, imagen);
      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe(data => {
            this.todo.patchValue({ imagen: data });
          });
        })
      ).subscribe();
    }, (err) => {
      alert(err);
    });
  }

  cargarImagen() {
    this.fileChooser.open().then(uri => {
      this.filePath.resolveNativePath(uri)
        .then((imagen) => {
          let fileRef = this.storage.ref(this.filePathData);
          let task = this.storage.upload(this.filePathData, imagen);
          task.snapshotChanges().pipe(
            finalize(() => {
              fileRef.getDownloadURL().subscribe(data => {
                this.todo.patchValue({ imagen: data });
              });
            })
          ).subscribe();
        })
    })
  }

  guardar() {
    this.servicio = this.todo.value;
    this.servicioDoc.set(this.servicio);
    let batch = this.afs.firestore.batch();
    batch.set(this.servicioDoc.ref, this.servicio);
    this.perfilesCollection = this.afs.collection<PerfilOptions>('perfiles', ref => ref.where('nombre', '==', 'Barbero'));
    this.perfilesCollection.ref.get().then(data => {
      data.forEach(perfil => {
        let servicios: ServicioOptions[] = perfil.get('servicios');
        let servicioEncontrado: ServicioOptions = servicios.find(servicio => servicio.id === this.servicio.id);
        if (servicioEncontrado) {
          let item = servicios.indexOf(servicioEncontrado);
          servicios.splice(item, 1, this.servicio);
          servicios.push(servicioEncontrado);
          servicioEncontrado = this.servicio;
        } else {
          servicios.push(this.servicio);
        }

        batch.set(perfil.ref, { servicios: servicios });

        this.usuariosCollection = this.afs.collection('usuarios', ref => ref.where('perfiles.id', '==', perfil.id));
        this.usuariosCollection.ref.get().then(usuariodata => {
          usuariodata.forEach(usuario => {
            
          });
        });
      });
      batch.commit().then(() => {
        let alert = this.alertCtrl.create({
          title: 'Servicio registrado',
          message: 'El servicio ha sido registrado exitosamente',
          buttons: ['OK']
        });
        alert.present();
        this.viewCtrl.dismiss();
      });
    });
  }

  menu() {
    let grupo = this.todo.value.grupo;
    let menu = this.modalCtrl.create('GruposServicioPage', { grupo: grupo });
    menu.present();
    menu.onDidDismiss(data => {
      this.todo.patchValue({ grupo: data });
    });
  }

  cerrar() {
    this.viewCtrl.dismiss();
  }

  genericAlert(title: string, message: string) {
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

  eliminar() {
    let servicio: ServicioOptions = this.todo.value;
    let alert = this.alertCtrl.create({
      title: 'Eliminar servicio',
      message: '¿Desea eliminar el servicio ' + servicio.nombre,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Si',
          handler: () => {
            this.servicioDoc.delete().then(() => {
              if (servicio.imagen) {
                this.storage.ref(this.filePathData).delete();
              }
              this.genericAlert('Eliminar servicio', 'El servicio ha sido eliminado');
            });
          }
        }
      ]
    });
    alert.present();
  }

}
