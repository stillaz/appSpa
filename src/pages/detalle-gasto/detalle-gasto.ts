import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';
import { GastoOptions } from '../../interfaces/gasto-options';
import { TipoOptions } from '../../interfaces/tipo-options';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import moment from 'moment';
import { AngularFirestore } from 'angularfire2/firestore';
import { AngularFireAuth } from 'angularfire2/auth';
import { UsuarioOptions } from '../../interfaces/usuario-options';

/**
 * Generated class for the DetalleGastoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-detalle-gasto',
  templateUrl: 'detalle-gasto.html',
})
export class DetalleGastoPage {

  gasto: GastoOptions;
  especies: TipoOptions[] = [];
  todo: FormGroup;
  nuevo: boolean = true;
  valorAnterior: number = 0;
  usuarioLogueado: UsuarioOptions;
  administrador: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private formBuilder: FormBuilder,
    private afs: AngularFirestore,
    private alertCtrl: AlertController,
    public viewCtrl: ViewController,
    private afa: AngularFireAuth
  ) {
    this.gasto = this.navParams.get('gasto');
    this.especies.push(
      { icon: 'restaurant', descripcion: 'Alimentación' },
      { icon: 'car', descripcion: 'Transporte' },
      { icon: 'barcode', descripcion: 'Servicios' },
      { icon: 'hammer', descripcion: 'Productos' },
      { icon: 'football', descripcion: 'Otro' }
    );
    this.updateGasto();
    this.updateUsuario();
  }

  form() {
    this.todo = this.formBuilder.group({
      id: [this.gasto.id],
      valor: [this.gasto.valor, Validators.required],
      descripcion: [this.gasto.descripcion, Validators.required],
      fecha: [this.gasto.fecha, Validators.required],
      especie: [this.gasto.especie, Validators.required]
    });
  }

  updateUsuario() {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      let usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      usuarioDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuarioLogueado = data;
          this.administrador = this.usuarioLogueado.perfiles.some(perfil => perfil.nombre === 'Administrador');
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
          this.navCtrl.setRoot('LogueoPage');
        }
      });
    }
  }

  updateGasto() {
    if (!this.gasto) {
      this.gasto = {
        id: this.afs.createId(),
        valor: null,
        descripcion: null,
        fecha: new Date(),
        especie: null,
        idusuario: null,
        usuario: null,
        imagenusuario: null
      };
    } else {
      this.nuevo = false;
      this.valorAnterior = this.gasto.valor;
    }

    this.form();
  }

  compareFn(p1: TipoOptions, p2: TipoOptions): boolean {
    return p1 && p2 ? p1.descripcion === p2.descripcion : p1 === p2;
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  guardar() {
    this.gasto.usuario = this.usuarioLogueado.nombre;
    this.gasto.idusuario = this.usuarioLogueado.id;
    this.gasto.imagenusuario = this.usuarioLogueado.imagen;
    let actual = new Date();
    let batch = this.afs.firestore.batch();
    let mes = moment(new Date()).startOf('month').toDate().getTime().toString();
    let dia = moment(new Date()).startOf('day').toDate().getTime().toString();
    this.gasto = this.todo.value;
    let gastoDoc = this.afs.doc('gastos/' + mes);

    gastoDoc.ref.get().then(dataGastos => {
      if (!dataGastos.exists) {
        batch.set(gastoDoc.ref, { fecha: actual, totalGastos: this.gasto.valor });
      } else {
        let totalActual = dataGastos.get('totalGastos');
        let valorNuevo = Number(this.gasto.valor) - Number(this.valorAnterior);
        batch.update(gastoDoc.ref, { totalGastos: Number(totalActual) + valorNuevo, fecha: new Date() });
      }

      let totalesGastoDiaDoc = gastoDoc.collection('totalesgastos').doc<GastoOptions>(dia);

      totalesGastoDiaDoc.ref.get().then(datosDiarios => {
        if (datosDiarios.exists) {
          let totalActual = datosDiarios.get('totalGastos');
          let valorNuevo = Number(this.gasto.valor) - Number(this.valorAnterior);
          batch.update(totalesGastoDiaDoc.ref, { totalGastos: Number(totalActual) + valorNuevo, fecha: new Date() });
        } else {
          let totalGasto = {
            totalGastos: this.gasto.valor,
            fecha: actual
          }

          batch.set(totalesGastoDiaDoc.ref, totalGasto);
        }

        let gastosespecieDoc = totalesGastoDiaDoc.collection('gastos').doc(this.gasto.id);

        batch.set(gastosespecieDoc.ref, this.gasto);

        batch.commit().then(() => {
          if (this.nuevo) {
            this.genericAlert('Gasto registrado', 'El gasto ha sido registrado.');
          } else {
            this.genericAlert('Gasto actualizado', 'El gasto ha sido actualizado.');
          }
          this.viewCtrl.dismiss();
        });
      });
    });
  }

  eliminar() {
    this.alertCtrl.create({
      title: 'Eliminar gasto',
      message: '¿Está seguro eliminar el gasto?',
      buttons: [
        {
          text: 'No',
          role: 'Cancel'
        },
        {
          text: 'Si',
          handler: () => {
            let actual = new Date();
            let fechaGasto: Date = this.gasto.fecha.toDate();
            let batch = this.afs.firestore.batch();
            let mes = moment(fechaGasto).startOf('month').toDate().getTime().toString();
            let dia = moment(fechaGasto).startOf('day').toDate().getTime().toString();
            this.gasto = this.todo.value;
            let gastoDoc = this.afs.doc('gastos/' + mes);

            gastoDoc.ref.get().then(dataGastos => {
              if (!dataGastos.exists) {
                batch.set(gastoDoc.ref, { ultimaactualizacion: actual, totalGastos: this.gasto.valor });
              } else {
                let totalActual = dataGastos.get('totalGastos');
                batch.update(gastoDoc.ref, { totalGastos: Number(totalActual) - Number(this.gasto.valor), fecha: new Date() });
              }

              let totalesGastoDiaDoc = gastoDoc.collection('totalesgastos').doc<GastoOptions>(dia);

              totalesGastoDiaDoc.ref.get().then(datosDiarios => {
                if (datosDiarios.exists) {
                  let totalActual = datosDiarios.get('totalGastos');
                  batch.update(totalesGastoDiaDoc.ref, { totalGastos: Number(totalActual) - Number(this.gasto.valor), fecha: new Date() });
                } else {
                  let totalGasto = {
                    totalGastos: this.gasto.valor,
                    fecha: actual
                  }

                  batch.set(totalesGastoDiaDoc.ref, totalGasto);
                }

                let gastosdetalleDoc = totalesGastoDiaDoc.collection('gastos').doc(this.gasto.id);

                batch.delete(gastosdetalleDoc.ref);

                batch.commit().then(() => {
                  if (this.nuevo) {
                    this.genericAlert('Gasto eliminado', 'El gasto ha sido eliminado.');
                  }
                  this.viewCtrl.dismiss();
                });
              });
            });
          }
        }
      ]
    }).present();
  }

  cerrar(){
    this.viewCtrl.dismiss();
  }

}
