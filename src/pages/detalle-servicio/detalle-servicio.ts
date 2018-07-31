import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicPage, NavController, NavParams, AlertController, ViewController, ModalController, Platform } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from 'angularfire2/firestore';
import { AngularFireStorage } from 'angularfire2/storage';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { finalize } from 'rxjs/operators';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { PerfilOptions } from '../../interfaces/perfil-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import firebase from 'firebase';
import { UsuarioProvider } from '../../providers/usuario';

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
    private usuarioServicio: UsuarioProvider
  ) {
    this.servicio = this.navParams.get('servicio');
    this.filePathEmpresa = this.usuarioServicio.getFilePathEmpresa();
    this.filePathData = this.filePathEmpresa + '/servicios/' + this.servicio.id;
    this.servicioDoc = this.afs.doc(this.filePathData);
    this.mobile = plt.is('android');
    this.updateGrupos();
    this.updateServicio();
  }

  updateGrupos() {
    this.afs.doc<any>('clases/Grupos').valueChanges().subscribe(data => {
      if (data) {
        this.grupos = data.data;
      }
    });
  }

  form() {
    this.todo = this.formBuilder.group({
      id: [this.servicio.id, Validators.required],
      nombre: [this.servicio.nombre, Validators.required],
      descripcion: [this.servicio.descripcion, Validators.required],
      duracion_MIN: [this.servicio.duracion_MIN, Validators.required],
      valor: [this.servicio.valor, Validators.required],
      grupo: [this.servicio.grupo, Validators.required],
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

  private loadUsuarioPerfil(idperfil: string) {
    let usuariosCollection: AngularFirestoreCollection<UsuarioOptions> = this.afs.collection<UsuarioOptions>(this.filePathEmpresa + '/usuarios');
    return new Promise<UsuarioOptions[]>(resolve => {
      usuariosCollection.valueChanges().subscribe(data => {
        if (data[0]) {
          let usuarios = data.filter(usuario => usuario.perfiles.some(perfil => perfil.id === idperfil));
          resolve(usuarios);
        }
        resolve(data);
      });
    });
  }

  private loadPerfilesGrupo(grupo: string) {
    let perfilesCollection: AngularFirestoreCollection<PerfilOptions> = this.afs.collection<PerfilOptions>(this.filePathEmpresa + '/perfiles', ref => ref.where('grupo', '==', grupo));
    return new Promise<PerfilOptions[]>(resolve => {
      perfilesCollection.valueChanges().subscribe(data => {
        resolve(data);
      });
    });
  }

  private registrarPerfilUsuario(batch, modo: string) {
    let perfilDoc: AngularFirestoreDocument<PerfilOptions>;
    let usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
    this.loadPerfilesGrupo('').then(perfiles => {
      perfiles.forEach(perfil => {
        let servicios: ServicioOptions[] = perfil.servicios;
        let servicioEncontrado: ServicioOptions = servicios.find(servicio => {
          return servicio.id === this.servicio.id;
        });
        if (servicioEncontrado) {
          let item = servicios.indexOf(servicioEncontrado);
          servicios.splice(item, 1, this.servicio);
        } else {
          servicios.push(this.servicio);
        }

        perfilDoc = this.afs.doc(this.filePathEmpresa + '/perfiles/' + perfil.id);

        batch.update(perfilDoc.ref, { servicios: servicios });

        this.loadUsuarioPerfil(perfil.id).then(usuarios => {
          usuarios.forEach(usuario => {
            let perfilesusuario = usuario.perfiles;
            let perfilusuario: PerfilOptions = perfilesusuario.find(perfilUsuario => perfilUsuario.id === perfil.id);
            if (perfilusuario) {
              let itemperfil = usuario.perfiles.indexOf(perfilusuario);
              let serviciosperfilusuario = perfilusuario.servicios ? perfilusuario.servicios : [];
              let servicioUsuarioEncontrado: ServicioOptions = serviciosperfilusuario.find(servicio => servicio.id === this.servicio.id);

              if (servicioUsuarioEncontrado) {
                let itemservicio = serviciosperfilusuario.indexOf(servicioUsuarioEncontrado);
                serviciosperfilusuario.splice(itemservicio, 1, this.servicio);
              } else {
                serviciosperfilusuario.push(this.servicio);
              }

              perfilusuario.servicios = serviciosperfilusuario;

              perfilesusuario.splice(itemperfil, 1, perfilusuario);

              batch.update(usuarioDoc.ref, { perfiles: perfilesusuario });
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
  }

  guardar() {
    let modo = this.nuevo ? 'actualizado' : 'registrado';
    this.servicio = this.todo.value;
    let batch = this.afs.firestore.batch();
    batch.set(this.servicioDoc.ref, this.servicio);
    this.registrarPerfilUsuario(batch, modo);
  }

  cerrar() {
    this.viewCtrl.dismiss();
  }

  private eliminarPerfilUsuario(batch) {
    let perfilDoc: AngularFirestoreDocument<PerfilOptions>;
    let usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
    this.loadPerfilesGrupo('').then(perfiles => {
      perfiles.forEach(perfil => {
        let servicios: ServicioOptions[] = perfil.servicios;
        let servicioEncontrado: ServicioOptions = servicios.find(servicio => {
          return servicio.id === this.servicio.id;
        });
        if (servicioEncontrado) {
          let item = servicios.indexOf(servicioEncontrado);
          servicios.splice(item, 1);
        }

        perfilDoc = this.afs.doc(this.filePathEmpresa + '/perfiles/' + perfil.id);

        batch.update(perfilDoc.ref, { servicios: servicios });

        this.loadUsuarioPerfil(perfil.id).then(usuarios => {
          usuarios.forEach(usuario => {
            let perfilesusuario = usuario.perfiles;
            let perfilusuario: PerfilOptions = perfilesusuario.find(perfilUsuario => perfilUsuario.id === perfil.id);
            if (perfilusuario) {
              let itemperfil = usuario.perfiles.indexOf(perfilusuario);
              let serviciosperfilusuario = perfilusuario.servicios ? perfilusuario.servicios : [];
              let servicioUsuarioEncontrado: ServicioOptions = serviciosperfilusuario.find(servicio => servicio.id === this.servicio.id);

              if (servicioUsuarioEncontrado) {
                let itemservicio = serviciosperfilusuario.indexOf(servicioUsuarioEncontrado);
                serviciosperfilusuario.splice(itemservicio, 1);
              }

              perfilusuario.servicios = serviciosperfilusuario;

              perfilesusuario.splice(itemperfil, 1, perfilusuario);

              batch.update(usuarioDoc.ref, { perfiles: perfilesusuario });
            }
          });

          batch.commit().then(() => {
            this.genericAlert('Eliminar servicio', 'El servicio ha sido eliminado');
            this.viewCtrl.dismiss();
          });
        });
      });
    });
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
            this.eliminarPerfilUsuario(batch);
          }
        }
      ]
    });
    alert.present();
  }

}
