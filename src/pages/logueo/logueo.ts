import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { LoginOptions } from '../../interfaces/login-options';
import { AngularFireAuth } from 'angularfire2/auth';
import { AgendaPage } from '../agenda/agenda';
import firebase from 'firebase';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { UsuarioOptions } from '../../interfaces/usuario-options';

/**
 * Generated class for the LogueoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-logueo',
  templateUrl: 'logueo.html',
})
export class LogueoPage {

  login = {} as LoginOptions;
  todo: FormGroup;
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuario: UsuarioOptions;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private formBuilder: FormBuilder,
    public alertCtrl: AlertController,
    private afs: AngularFirestore
  ) {
    this.form();
  }

  form() {
    this.todo = this.formBuilder.group({
      username: [this.login.username, Validators.required],
      password: [this.login.password, Validators.required]
    });
  }

  async logueo() {
    this.login = this.todo.value;
    let result = this.afa.auth.signInWithEmailAndPassword(this.login.username, this.login.password);
    result.then(() => {
      this.navCtrl.setRoot(AgendaPage);
    }).catch(e => {
      let mensajeError;
      switch (e.code) {
        case 'auth/user-not-found':
          this.todo.patchValue({ username: '', password: '' });
          mensajeError = 'El usuario no ha sido registrado en el sistema';
          break;

        case 'auth/wrong-password':
          mensajeError = 'La contraseña no es válida';
          this.todo.patchValue({ password: '' });
          break;
      }

      this.alertCtrl.create({
        title: 'Error de autenticación',
        message: mensajeError,
        buttons: [{ text: 'OK' }]
      }).present();
    });
  }

  async logueo_google() {
    this.afa.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(data => {
      if (data) {
        let id = data.uid;
        this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + id);
        this.usuarioDoc.valueChanges().subscribe(data => {
          if (data) {
            this.navCtrl.setRoot(AgendaPage);
          } else {
            this.afa.auth.signOut();
            this.alertCtrl.create({
              title: 'Error de autenticación',
              message: 'El usaurio no ha sido registrado con esta cuenta',
              buttons: [{ text: 'OK' }]
            }).present();
          }
          this.form();
        });
      }
    }).catch(e => {
      this.alertCtrl.create({
        title: 'Error de autenticación',
        message: 'No fue posible autenticar con el proveedor de servicios',
        buttons: [{ text: 'OK' }]
      }).present();
    });
  }

}
