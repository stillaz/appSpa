import { Component } from '@angular/core';
import { IonicPage, NavController, ActionSheetController, AlertController } from 'ionic-angular';
import { PaqueteOptions } from '../../interfaces/paquete-options';
import { UsuarioProvider } from '../../providers/usuario';
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';

/**
 * Generated class for the PaquetePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-paquete',
  templateUrl: 'paquete.html',
})
export class PaquetePage {

  public grupoPaquetes: any[];
  public grupoSeleccion: string;
  public grupos: any[] = [];
  private filePathPaquetes: string;

  constructor(
    private afs: AngularFirestore,
    public navCtrl: NavController,
    public actionSheetCtrl: ActionSheetController,
    public alertCtrl: AlertController,
    private usuarioServicio: UsuarioProvider
  ) {
    this.filePathPaquetes = this.usuarioServicio.getFilePathEmpresa() + '/paquetes';
    this.initialUpdate();
  }

  ionViewWillEnter() {
    this.grupoSeleccion = 'Todos los grupos';
  }

  initialUpdate() {
    const paqueteCollection: AngularFirestoreCollection<PaqueteOptions> = this.afs.collection<PaqueteOptions>(this.filePathPaquetes);
    paqueteCollection.valueChanges().subscribe(data => {
      if (data) {
        this.updatePaquetes(data);
        this.grupoSeleccion = 'Todos los grupos';
      }
    });
  }

  updatePaquetes(paquetes: PaqueteOptions[]) {
    const grupos = [];
    this.grupoPaquetes = [];
    paquetes.forEach(paquete => {
      const grupo = paquete.grupo;
      if (grupos[grupo.id] === undefined) {
        grupos[grupo.id] = [];
        if (!this.grupos.some(x => x === grupo)) {
          this.grupos.push(grupo);
        }
      }
      grupos[grupo.id].push(paquete);
    });

    for (let grupo in grupos) {
      this.grupoPaquetes.push({ grupo: grupo, paquetes: grupos[grupo] });
    }
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

  crear() {
    this.navCtrl.push('DetallePaquetePage');
  }

  ver(paquete: PaqueteOptions) {
    this.navCtrl.push('DetallePaquetePage', {
      paquete: paquete
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
          const paquetesCollection: AngularFirestoreCollection<PaqueteOptions> = this.afs.collection('paquetes', ref => ref.where('grupo.id', '==', grupo.id));
          paquetesCollection.valueChanges().subscribe(data => {
            if (data) {
              this.updatePaquetes(data);
            }
            this.grupoSeleccion = grupo;
          });
        }
      });
    });

    this.actionSheetCtrl.create({
      title: 'Grupos',
      buttons: filtros,
      cssClass: 'actionSheet1'
    }).present();
  }

}
