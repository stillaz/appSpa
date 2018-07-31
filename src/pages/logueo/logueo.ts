import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { LoginOptions } from '../../interfaces/login-options';
import { AngularFireAuth } from 'angularfire2/auth';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

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

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private formBuilder: FormBuilder,
    public alertCtrl: AlertController
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
    result.catch(e => {
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

}
