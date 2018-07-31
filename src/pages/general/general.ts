import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ModalController } from 'ionic-angular';
import { ConfiguracionOptions } from '../../interfaces/configuracion-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestoreDocument, AngularFirestore } from 'angularfire2/firestore';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import * as DataProvider from '../../providers/constants';
import { UsuarioProvider } from '../../providers/usuario';

/**
 * Generated class for the ConfiguracionPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-general',
  templateUrl: 'general.html',
})
export class GeneralPage {

  configuracion = {} as ConfiguracionOptions;
  usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  todo: FormGroup;
  read;
  dias = DataProvider.DIAS;
  usuario: UsuarioOptions;
  filePathUsuario: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private formBuilder: FormBuilder,
    public modalCtrl: ModalController,
    private usuarioServicio: UsuarioProvider
  ) {
    this.usuario = this.navParams.get('usuario');
    this.filePathUsuario = this.usuarioServicio.getFilePathUsuario();
    this.usuarioDoc = this.afs.doc(this.filePathUsuario + this.usuario.id);
    this.form();
    this.updateConfiguracion(this.usuario);
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  updateConfiguracion(usuario: UsuarioOptions) {
    this.configuracion = usuario.configuracion ? usuario.configuracion : {} as ConfiguracionOptions;
    this.form();
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

  form() {
    this.todo = this.formBuilder.group({
      horaInicio: [this.configuracion.horaInicio, Validators.compose([Validators.required, Validators.min(0), Validators.max(24)])],
      horaFin: [this.configuracion.horaFin, Validators.compose([Validators.required, Validators.min(0), Validators.max(24)]), this.validarFechaFinMayor()],
      tiempoDisponibilidad: [this.configuracion.tiempoDisponibilidad, Validators.compose([Validators.required, Validators.min(1), Validators.max(60)])],
      tiempoAlerta: [this.configuracion.tiempoAlerta, Validators.compose([Validators.required, Validators.min(1), Validators.max(1440)])],
      diasNoDisponible: [this.configuracion.diasNoDisponible]
    });
  }

  isPresent(obj: any): boolean {
    return obj !== undefined && obj !== null;
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
            this.navCtrl.pop();
          }).catch(() => this.genericAlert('Guardar configuración', 'Ha ocurrido un error'));
        }
      }]
    }).present();
  }

  cancelar() {
    this.read.unsubscribe();
    this.updateConfiguracion(this.usuario);
    this.navCtrl.pop();
  }

  compareFn(p1: any, p2: any): boolean {
    return p1 && p2 ? p1.id === p2.id : p1 === p2;
  }

  agregarNoDisponible() {
    this.modalCtrl.create('DetalleNodisponibilidadPage', {
      usuario: this.usuario
    }).present();
  }

  irNoDisponible() {
    this.navCtrl.push('NodisponiblePage', {
      usuario: this.usuario
    });
  }

}
