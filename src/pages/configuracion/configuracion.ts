import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { AngularFireAuth } from 'angularfire2/auth';
import { UsuarioProvider } from '../../providers/usuario';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { AngularFirestore } from '../../../node_modules/angularfire2/firestore';

@Component({
  selector: 'page-configuracion',
  templateUrl: 'configuracion.html'
})
export class ConfiguracionPage {

  pages: any[];
  filePathUsuario: string;
  usuario: UsuarioOptions;

  constructor(
    public navCtrl: NavController,
    private afa: AngularFireAuth,
    private platform: Platform,
    private usuarioServicio: UsuarioProvider,
    private afs: AngularFirestore
  ) {
    if (this.usuarioServicio.isAdministrador()) {
      this.pages = [
        { title: 'Horario', component: 'GeneralPage', icon: 'timer', color: 'secondary' },
        { title: 'Perfil', component: 'PerfilPage', icon: 'person', color: 'primary' },
        { title: 'Servicios', component: 'ServicioPage', icon: 'share', color: 'dark' }
      ];
    } else {
      this.pages = [
        { title: 'Horario', component: 'GeneralPage', icon: 'timer', color: 'secondary' },
        { title: 'Perfil', component: 'PerfilPage', icon: 'person', color: 'primary' }
      ];
    }

    this.filePathUsuario = this.usuarioServicio.getFilePathUsuario();

    this.updateUsuario(this.usuarioServicio.getUsuario());
  }

  updateUsuario(usuario: UsuarioOptions) {
    let usuarioDoc = this.afs.doc<UsuarioOptions>(this.filePathUsuario + usuario.id);
    usuarioDoc.valueChanges().subscribe(data => {
      this.usuario = data;
    });
  }

  openPage(page) {
    this.navCtrl.push(page.component, {
      usuario: this.usuario
    });
  }

  salir() {
    this.afa.auth.signOut();
    this.platform.exitApp();
  }

}
