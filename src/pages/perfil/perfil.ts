import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, Platform } from 'ionic-angular';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFireAuth } from 'angularfire2/auth';
import { User } from '@firebase/auth-types';
import { CameraOptions, Camera } from '../../../node_modules/@ionic-native/camera';
import { AngularFireStorage } from '../../../node_modules/angularfire2/storage';
import firebase from 'firebase';

/**
 * Generated class for the PerfilPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-perfil',
  templateUrl: 'perfil.html',
})
export class PerfilPage {

  usuario: UsuarioOptions;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  todo: FormGroup;
  actualizar_email: boolean = false;
  actualizar_clave: boolean = false;
  private usuariologueado: User;
  mobile: boolean;
  filePathData: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private formBuilder: FormBuilder,
    private afa: AngularFireAuth,
    private plt: Platform,
    private camera: Camera,
    private storage: AngularFireStorage
  ) {
    this.mobile = this.plt.is('android');
    this.todo = {} as FormGroup;
    this.updateUsuario();
  }

  genericAlert(title: string, message: string) {
    let alert = this.alertCtrl.create({
      title: title,
      message: message,
      buttons: [{
        text: 'OK'
      }]
    });
    alert.present();
  }

  form() {
    this.todo = this.formBuilder.group({
      id: [this.usuario.id],
      nombre: [this.usuario.nombre, Validators.required],
      telefono: [this.usuario.telefono, Validators.required],
      email: [this.usuario.email, Validators.required],
      clave: ['1234567890'],
      perfiles: [this.usuario.perfiles, Validators.required],
      imagen: [this.usuario.imagen],
      activo: [this.usuario.activo, Validators.required]
    });
  }

  updateUsuario() {
    this.usuario = {
      id: null,
      nombre: null,
      telefono: null,
      email: null,
      imagen: null,
      activo: true,
      perfiles: [],
      configuracion: null
    };

    this.form();
    this.usuariologueado = this.afa.auth.currentUser;
    if (!this.usuariologueado) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      this.filePathData = 'usuarios/' + this.usuariologueado.uid;
      this.usuarioDoc = this.afs.doc<UsuarioOptions>(this.filePathData);
      this.usuarioDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuario = data;
          this.form();
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
          this.navCtrl.setRoot('LogueoPage');
        }
      });
    }
  }

  guardar() {
    let usuario = this.todo.value;
    this.usuario = {
      id: this.usuario.id,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      email: usuario.email,
      imagen: usuario.imagen,
      activo: true,
      perfiles: this.usuario.perfiles,
      configuracion: this.usuario.configuracion
    };

    this.usuarioDoc.update({ telefono: usuario.telefono, imagen: usuario.imagen });
    let alert = this.alertCtrl.create({
      title: 'Usuario actualizado',
      message: 'El usuario ha sido actualizado exitosamente',
      buttons: ['OK']
    });
    alert.present();
    this.navCtrl.pop();
  }

  actualizarEmail() {
    this.alertCtrl.create({
      title: 'Actualizar correo',
      message: '¿Está seguro de cambiar el correo electrónico de inicio de sesión?',
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Si',
          handler: () => {
            const prompt = this.alertCtrl.create({
              title: 'Actualizar correo',
              message: "Ingrese aquí el nuevo correo electrónico",
              inputs: [
                {
                  name: 'email',
                  placeholder: this.usuario.email,
                  type: 'email'
                }
              ],
              buttons: [
                {
                  text: 'Cancelar',
                  role: 'cancel'
                },
                {
                  text: 'Guardar',
                  handler: data => {
                    if (data && data.email) {
                      let email = data.email;
                      this.usuariologueado.updateEmail(email).then(() => {
                        this.usuarioDoc.update({ email: email }).then(() => {
                          this.alertCtrl.create({
                            title: 'Actualizar correo',
                            subTitle: 'Correo actualizado correctamente',
                            message: 'Ahora inicia nuevamente la sesión',
                            buttons: [
                              {
                                text: 'OK',
                                handler: () => {
                                  this.navCtrl.setRoot('LogueoPage');
                                }
                              }
                            ]
                          }).present();
                        });
                      });
                    } else {
                      this.alertCtrl.create({
                        title: 'Actualizar correo',
                        message: 'Correo no es válido',
                        buttons: [
                          {
                            text: 'OK',
                            role: 'cancel'
                          }
                        ]
                      }).present();
                    }
                  }
                }
              ]
            });
            prompt.present();
          }
        }
      ]
    }).present();
  }

  actualizarClave() {
    this.alertCtrl.create({
      title: 'Cambio de clave',
      message: 'Ingresa aquí la clave actual',
      inputs: [
        {
          name: 'clave',
          type: 'password'
        },
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Continuar',
          handler: dataclave => {
            if (!dataclave || !dataclave.clave) {
              this.alertCtrl.create({
                title: 'Cambio de clave',
                message: 'La clave no es válida',
                buttons: [{
                  text: 'OK',
                  role: 'cancel'
                }]
              }).present();
            } else {
              this.afa.auth.signInWithEmailAndPassword(this.usuario.email, dataclave.clave).then(respuesta => {
                const prompt = this.alertCtrl.create({
                  title: 'Cambio de clave',
                  message: "Ingrese aquí la clave nueva",
                  inputs: [
                    {
                      placeholder: 'Clave nueva',
                      name: 'clave1',
                      type: 'password'
                    },

                    {
                      placeholder: 'Repite la clave',
                      name: 'clave2',
                      type: 'password'
                    }
                  ],
                  buttons: [
                    {
                      text: 'Cancelar',
                      role: 'cancel'
                    },
                    {
                      text: 'Guardar',
                      handler: data => {
                        if (!data || !data.clave1) {
                          this.alertCtrl.create({
                            title: 'Cambio de clave',
                            message: 'La primera clave no es válida',
                            buttons: [
                              {
                                text: 'OK',
                                role: 'cancel'
                              }
                            ]
                          }).present();
                        } else if (!data || !data.clave2) {
                          this.alertCtrl.create({
                            title: 'Cambio de clave',
                            message: 'La segunda clave no es válida',
                            buttons: [
                              {
                                text: 'OK',
                                role: 'cancel'
                              }
                            ]
                          }).present();
                        } else if (data.clave1 !== data.clave1) {
                          this.alertCtrl.create({
                            title: 'Cambio de clave',
                            message: 'Las claves no coinciden',
                            buttons: [
                              {
                                text: 'OK',
                                role: 'cancel'
                              }
                            ]
                          }).present();
                        } else {
                          let clave = data.clave1;
                          this.usuariologueado.updatePassword(clave).then(() => {
                            this.alertCtrl.create({
                              title: 'Cambio de clave',
                              message: 'Clave actualizada',
                              buttons: [
                                {
                                  text: 'OK',
                                  handler: () => {
                                    this.navCtrl.pop();
                                  }
                                }
                              ]
                            }).present();
                          });
                        }
                      }
                    }
                  ]
                });
                prompt.present();
              }).catch(() => this.alertCtrl.create({
                title: 'Cambio de clave',
                message: 'Clave incorrecta',
                buttons: [
                  {
                    text: 'OK',
                    role: 'cancel'
                  }
                ]
              }).present());
            }
          }
        }
      ]
    }).present();
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
}
