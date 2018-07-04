import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFireAuth } from 'angularfire2/auth';
import { User } from '@firebase/auth-types';

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

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private formBuilder: FormBuilder,
    private afa: AngularFireAuth
  ) {
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
      clave: [''],
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
      this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + this.usuariologueado.uid);
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

    if (this.actualizar_email) {
      this.usuariologueado.updateEmail(this.usuario.email);
    }
    if (this.actualizar_clave) {
      this.usuariologueado.updatePassword(usuario.clave);
    }

    this.usuarioDoc.set(this.usuario);
    let alert = this.alertCtrl.create({
      title: 'Usuario actualizado',
      message: 'El usuario ha sido actualizado exitosamente',
      buttons: ['OK']
    });
    alert.present();
    this.navCtrl.pop();
  }

}
