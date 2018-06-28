import { Component } from '@angular/core';
import { IonicPage, NavController, ViewController, ToastController } from 'ionic-angular';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { ClienteOptions } from '../../interfaces/cliente-options';

/**
 * Generated class for the DetallePersonaPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-cliente',
  templateUrl: 'cliente.html',
})
export class ClientePage {

  todo: FormGroup;
  nuevo: boolean = true;
  cliente: ClienteOptions;

  private clienteDoc: AngularFirestoreDocument<ClienteOptions>;

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    public toastCtrl: ToastController,
    private afs: AngularFirestore) {
    this.cliente = { identificacion: null, nombre: null, telefono: null, correoelectronico: null };
    this.form();
  }

  form() {
    this.todo = this.formBuilder.group({
      identificacion: [this.cliente.identificacion, Validators.required],
      nombre: [this.cliente.nombre, Validators.required],
      telefono: [this.cliente.telefono, Validators.required],
      correoelectronico: [this.cliente.correoelectronico]
    });
  }

  cargar() {
    let id = this.todo.value.identificacion;
    if (id) {
      this.clienteDoc = this.afs.doc<ClienteOptions>('clientes/' + id);
      this.clienteDoc.valueChanges().subscribe(data => {
        if (data) {
          this.cliente = data;
        } else {
          this.cliente = { identificacion: id, nombre: null, telefono: null, correoelectronico: null };
        }
        this.form();
      });
    }
  }

  guardar() {
    this.cliente = this.todo.value;
    this.clienteDoc.set(this.cliente);
    let toast = this.toastCtrl.create({
      message: 'Los datos de la persona han sido registrados',
      duration: 1000,
      position: 'top'
    });
    toast.present();
    this.viewCtrl.dismiss(this.cliente);
  }

}
