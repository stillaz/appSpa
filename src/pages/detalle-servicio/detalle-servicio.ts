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
import { AngularFireAuth } from 'angularfire2/auth';

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
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  private usuario: UsuarioOptions;
  private control_usuarios: boolean;

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
    private filePath: FilePath,
    private afa: AngularFireAuth
  ) {
    this.mobile = plt.is('android');
    this.servicio = this.navParams.get('servicio');
    this.updateUsuario();
    this.updateServicio();
  }

  updateUsuario() {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      this.usuarioDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuario = data;
          let administrador = this.usuario.perfiles.some(perfil => perfil.nombre === 'Administrador');
          if (administrador) {
            let configuracion = this.usuario.configuracion;
            if (configuracion) {
              this.control_usuarios = configuracion.control_usuarios;
            }
          } else {
            this.genericAlert('Error usuario', 'Usuario no es administrador');
            this.navCtrl.pop();
          }
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
          this.navCtrl.setRoot('LogueoPage');
        }
      });
    }
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
    let modo = this.nuevo ? 'actualizado' : 'registrado';
    this.servicio = this.todo.value;
    let batch = this.afs.firestore.batch();
    batch.set(this.servicioDoc.ref, this.servicio);
    if (!this.control_usuarios) {
      this.perfilesCollection = this.afs.collection<PerfilOptions>('perfiles', ref => ref.where('nombre', '==', 'Barbero'));
      this.perfilesCollection.ref.get().then(data => {
        data.forEach(perfil => {
          let servicios: ServicioOptions[] = perfil.get('servicios');
          let servicioEncontrado: ServicioOptions = servicios.find(servicio => servicio.id === this.servicio.id);
          if (servicioEncontrado) {
            let item = servicios.indexOf(servicioEncontrado);
            servicios.splice(item, 1, this.servicio);
          } else {
            servicios.push(this.servicio);
          }

          batch.update(perfil.ref, { servicios: servicios });

          this.usuariosCollection = this.afs.collection('usuarios');
          this.usuariosCollection.ref.get().then(usuariodata => {
            usuariodata.forEach(usuario => {
              let perfilesusuario: PerfilOptions[] = usuario.get('perfiles');
              let perfilusuario: PerfilOptions = perfilesusuario.find(perfilu => perfilu.id === perfil.id);
              if (perfilusuario) {
                let itemperfil = perfilesusuario.indexOf(perfilusuario);
                let serviciosperfilusuario = perfilusuario.servicios ? perfilusuario.servicios : [];
                let servicioUsuarioEncontrado: ServicioOptions = serviciosperfilusuario.find(servicio => servicio.id === this.servicio.id);

                if (servicioUsuarioEncontrado) {
                  let item = serviciosperfilusuario.indexOf(servicioUsuarioEncontrado);
                  serviciosperfilusuario.splice(item, 1, this.servicio);
                } else {
                  serviciosperfilusuario.push(this.servicio);
                }

                perfilusuario.servicios = serviciosperfilusuario;

                perfilesusuario.splice(itemperfil, 1, perfilusuario);

                batch.update(usuario.ref, { perfiles: perfilesusuario });
              }
            });

            batch.commit().then(() => {
              let alert = this.alertCtrl.create({
                title: 'Servicio ' + modo,
                message: 'El servicio ha sido ' + modo + ' exitosamente',
                buttons: ['OK']
              });
              alert.present();
              this.viewCtrl.dismiss();
            });
          });
        });
      });
    } else {
      batch.commit().then(() => {
        let alert = this.alertCtrl.create({
          title: 'Servicio ' + modo,
          message: 'El servicio ha sido ' + modo + ' exitosamente',
          buttons: ['OK']
        });
        alert.present();
        this.viewCtrl.dismiss();
      });
    }
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
            let batch = this.afs.firestore.batch();
            batch.delete(this.servicioDoc.ref);
            if (!this.control_usuarios) {
              this.perfilesCollection = this.afs.collection<PerfilOptions>('perfiles', ref => ref.where('nombre', '==', 'Barbero'));
              this.perfilesCollection.ref.get().then(data => {
                data.forEach(perfil => {
                  let servicios: ServicioOptions[] = perfil.get('servicios');
                  let servicioEncontrado: ServicioOptions = servicios.find(servicio => servicio.id === this.servicio.id);
                  if (servicioEncontrado) {
                    let item = servicios.indexOf(servicioEncontrado);
                    servicios.splice(item, 1);
                  }

                  batch.update(perfil.ref, { servicios: servicios });

                  this.usuariosCollection = this.afs.collection('usuarios');
                  this.usuariosCollection.ref.get().then(usuariodata => {
                    usuariodata.forEach(usuario => {
                      let perfilesusuario: PerfilOptions[] = usuario.get('perfiles');
                      let perfilusuario: PerfilOptions = perfilesusuario.find(perfilu => perfilu.id === perfil.id);
                      if (perfilusuario) {
                        let itemperfil = perfilesusuario.indexOf(perfilusuario);
                        let serviciosperfilusuario = perfilusuario.servicios ? perfilusuario.servicios : [];
                        let servicioUsuarioEncontrado: ServicioOptions = serviciosperfilusuario.find(servicio => servicio.id === this.servicio.id);

                        if (servicioUsuarioEncontrado) {
                          let item = serviciosperfilusuario.indexOf(servicioUsuarioEncontrado);
                          serviciosperfilusuario.splice(item, 1);
                        }

                        perfilusuario.servicios = serviciosperfilusuario;

                        perfilesusuario.splice(itemperfil, 1, perfilusuario);

                        batch.update(usuario.ref, { perfiles: perfilesusuario });
                      }
                    });

                    batch.commit().then(() => {
                      if (servicio.imagen) {
                        this.storage.ref(this.filePathData).delete();
                      }
                      this.genericAlert('Eliminar servicio', 'El servicio ha sido eliminado');
                      this.viewCtrl.dismiss();
                    });
                  });
                });
              });
            } else {
              batch.commit().then(() => {
                if (servicio.imagen) {
                  this.storage.ref(this.filePathData).delete();
                }
                this.genericAlert('Eliminar servicio', 'El servicio ha sido eliminado');
                this.viewCtrl.dismiss();
              });
            }
          }
        }
      ]
    });
    alert.present();
  }

}
