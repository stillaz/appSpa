import { Component } from '@angular/core';
import { IonicPage, NavController, ActionSheetController, AlertController } from 'ionic-angular';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { AngularFireAuth } from 'angularfire2/auth';
import { UsuarioOptions } from '../../interfaces/usuario-options';

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
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  private usuario: UsuarioOptions;

  constructor(
    private afs: AngularFirestore,
    public navCtrl: NavController,
    public actionSheetCtrl: ActionSheetController,
    private afa: AngularFireAuth,
    public alertCtrl: AlertController
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

  updateUsuario() {
    let user = this.afa.auth.currentUser;
    if (!user) {
      this.navCtrl.setRoot('LogueoPage');
    } else {
      this.usuarioDoc = this.afs.doc<UsuarioOptions>('usuarios/' + user.uid);
      this.usuarioDoc.valueChanges().subscribe(data => {
        if (data) {
          this.usuario = data;
          let administrador = this.usuario.perfiles.some(perfil => perfil.nombre === 'Administrador');
          if (!administrador) {
            this.genericAlert('Error usuario', 'Usuario no es administrador');
            this.navCtrl.pop();
          }
        } else {
          this.genericAlert('Error usuario', 'Usuario no encontrado');
          this.navCtrl.setRoot('LogueoPage');
        }
      });
    }
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
