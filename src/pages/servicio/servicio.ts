import { Component } from '@angular/core';
import { IonicPage, NavController, ActionSheetController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { ServicioOptions } from '../../interfaces/servicio-options';

/**
 * Generated class for the ServicioPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-servicio',
  templateUrl: 'servicio.html',
})
export class ServicioPage {

  grupoServicios: any[];
  grupoSeleccion: string;
  grupos: any[] = [];

  constructor(
    private afs: AngularFirestore,
    public navCtrl: NavController,
    public actionSheetCtrl: ActionSheetController
  ) {
    this.initialUpdate();
  }

  ionViewWillEnter() {
    this.grupoSeleccion = 'Todos los grupos';
  }

  initialUpdate() {
    let serviciosCollection: AngularFirestoreCollection<ServicioOptions>;
    serviciosCollection = this.afs.collection<ServicioOptions>('servicios');
    serviciosCollection.valueChanges().subscribe(data => {
      if (data) {
        this.updateServicios(data);
        this.grupoSeleccion = 'Todos los grupos';
      }
    });
  }

  updateServicios(servicios: ServicioOptions[]) {
    let grupos = [];
    this.grupoServicios = [];
    servicios.forEach(servicio => {
      let grupo = servicio.grupo;
      if (grupos[grupo] === undefined) {
        grupos[grupo] = [];
        if (!this.grupos.some(x => x === grupo)) {
          this.grupos.push(grupo);
        }
      }
      grupos[grupo].push(servicio);
    });

    for (let grupo in grupos) {
      this.grupoServicios.push({ grupo: grupo, servicios: grupos[grupo] });
    }
  }

  crear() {
    this.navCtrl.push('DetalleServicioPage');
  }

  ver(servicio: ServicioOptions) {
    this.navCtrl.push('DetalleServicioPage', {
      servicio: servicio
    });
  }

  filtrosGrupos() {
    let filtros: any = [];
    filtros.push({
      text: 'Todos los grupos', handler: () => {
        this.initialUpdate();
        this.grupoSeleccion = 'Todos los grupos';
      }
    });

    this.grupos.forEach(grupo => {
      filtros.push({
        text: grupo,
        handler: () => {
          let serviciosCollection: AngularFirestoreCollection<ServicioOptions>;
          serviciosCollection = this.afs.collection('servicios', ref => ref.where('grupo', '==', grupo));
          serviciosCollection.valueChanges().subscribe(data => {
            if (data) {
              this.updateServicios(data);
            }
            this.grupoSeleccion = grupo;
          });
        }
      });
    });

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Grupos',
      buttons: filtros,
      cssClass: 'actionSheet1'
    });
    actionSheet.present();
  }

}
