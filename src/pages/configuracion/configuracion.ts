import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { ConfiguracionOptions } from '../../interfaces/configuracion-options';
import { AngularFireAuth } from 'angularfire2/auth';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestoreDocument, AngularFirestore } from 'angularfire2/firestore';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';

/**
 * Generated class for the ConfiguracionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-configuracion',
  templateUrl: 'configuracion.html',
})
export class ConfiguracionPage {

  configuracion = {} as ConfiguracionOptions;
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  usuarioLogueado: UsuarioOptions;
  usuario: UsuarioOptions;
  administrador: boolean;
  todo: FormGroup;
  read;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private formBuilder: FormBuilder
  ) {
    this.form();
  }

  ionViewWillEnter() {
    this.updateConfiguracion();
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  updateConfiguracion() {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      this.read = this.usuarioDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuarioLogueado = data;
          this.usuario = data;
          this.administrador = this.usuarioLogueado.perfiles.some(perfil => perfil.id === 0);
          this.configuracion = this.usuario.configuracion ? this.usuario.configuracion : {} as ConfiguracionOptions;
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
        }

        this.form();
      });
    }
  }

  form() {
    this.todo = this.formBuilder.group({
      horaInicio: [this.configuracion.horaInicio, Validators.compose([Validators.required, Validators.min(0), Validators.max(24)])],
      horaFin: [this.configuracion.horaFin, Validators.compose([Validators.required, Validators.min(0), Validators.max(24)]), this.validarFechaFinMayor()],
      tiempoDisponibilidad: [this.configuracion.tiempoDisponibilidad, Validators.compose([Validators.required, Validators.min(1), Validators.max(60)])],
      tiempoAlerta: [this.configuracion.tiempoAlerta, Validators.compose([Validators.required, Validators.min(1), Validators.max(1440)])]
    });
  }

  isPresent(obj: any): boolean {
    return obj !== undefined && obj !== null;
  }

  validarFechaFinMayor(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } => {
      if (this.isPresent(Validators.required(control))) return null;

      let fin = control.value;
      let inicio = this.todo.value.horaInicio ? this.todo.value.horaInicio : 9999999999999;

      return new Promise((resolve) => {
        resolve(Number(fin) <= Number(inicio) ? { validarFechaFinMayor: true } : null);
      });
    }
  }

  guardar() {
    this.configuracion = this.todo.value;

    this.alertCtrl.create({
      title: 'Guardar configuración',
      message: '¿Desea guardar la configuración?',
      buttons: [{
        text: 'No',
        role: 'cancel'
      }, {
        text: 'Si',
        handler: () => {
          this.usuario.configuracion = this.configuracion;
          this.usuarioDoc.set(this.usuario).then(() => {
            this.genericAlert('Guardar configuración', 'Configuración guardada');
          }).catch(() => this.genericAlert('Guardar configuración', 'Ha ocurrido un error'));
        }
      }]
    }).present();
  }

  cancelar() {
    this.read.unsubscribe();
    this.updateConfiguracion();
  }

}
