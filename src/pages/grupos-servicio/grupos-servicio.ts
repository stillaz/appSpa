import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ViewController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { ServicioOptions } from '../../interfaces/servicio-options';

/**
 * Generated class for the GruposServicioPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-grupos-servicio',
  templateUrl: 'grupos-servicio.html',
})
export class GruposServicioPage {

  private servicioColl: AngularFirestoreCollection<ServicioOptions>;
  grupos: string[];
  grupo: string;
  busqueda: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public viewCtrl: ViewController
  ) {
    this.grupo = this.navParams.get('grupo');
    this.busqueda = this.grupo;
    this.servicioColl = this.afs.collection<ServicioOptions>('servicios');
    this.grupos = [];
  }

  ionViewDidLoad() {
    this.updateGrupos();
  }

  updateGrupos() {
    this.grupos = [];
    let grupos = [];
    this.servicioColl.valueChanges().subscribe(data => {
      if (data) {
        data.map(servicio => servicio.grupo).forEach(item => {
          if(grupos[item] === undefined){
            grupos[item] = item;
            this.grupos.push(item);
          }
        });
      }
    });
  }

  seleccionar(grupo: string) {
    if (grupo && !this.grupos.find(data => data.toLowerCase() === grupo.toLowerCase())) {
      let alert = this.alertCtrl.create({
        title: 'Crear grupo',
        message: '¿Desea crear el grupo ' + grupo + '?',
        buttons: [
          {
            text: 'No',
            role: 'cancel'
          },
          {
            text: 'Si',
            handler: () => {
              this.viewCtrl.dismiss(grupo);
            }
          }
        ]
      });
      alert.present();
    } else if (grupo) {
      this.viewCtrl.dismiss(grupo);
    }
  }

  filtrar() {
    this.updateGrupos();
    if (this.grupo) {
      this.grupos = this.grupos.filter(data => data.toLowerCase() === this.grupo.toLowerCase());
    }
  }

}
