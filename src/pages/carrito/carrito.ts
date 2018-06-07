import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, AlertController } from 'ionic-angular';
import { ReservaOptions } from '../../interfaces/reserva-options';

/**
 * Generated class for the CarritoPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-carrito',
  templateUrl: 'carrito.html',
})
export class CarritoPage {

  public total: number;
  public servicios: ReservaOptions[];

  constructor(
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController) {
    this.servicios = this.navParams.get('servicios');
    this.total = this.navParams.get('total');
  }

  eliminar(servicio: ReservaOptions) {
    this.viewCtrl.dismiss({
      servicio: servicio,
      metodo: 'eliminar'
    });
  }

  guardar(){
    this.viewCtrl.dismiss({
      metodo: 'guardar'
    });
  }

}
