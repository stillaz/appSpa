import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, Tabs } from 'ionic-angular';
import { AgendaPage } from '../agenda/agenda';
import { ReportesPage } from '../reportes/reportes';
import { ConfiguracionPage } from '../configuracion/configuracion';
import { GastoPage } from '../gasto/gasto';
import { UsuarioProvider } from '../../providers/usuario';
import { PendientePage } from '../pendiente/pendiente';
import { AngularFirestore } from 'angularfire2/firestore';

/**
 * Generated class for the TabsPage tabs.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {

  @ViewChild('mainTabs') tabRef: Tabs;
  tabs;
  watch;

  constructor(
    private usuarioService: UsuarioProvider,
    private afs: AngularFirestore,
    public navCtrl: NavController
  ) {
    if (this.usuarioService.isAdministrador()) {
      this.tabs = [
        { root: AgendaPage, title: 'Agenda', icon: 'bookmarks', badge: 0 },
        { root: PendientePage, title: 'Pendientes', icon: 'notifications', badge: 0 },
        { root: ReportesPage, title: 'Reportes', icon: 'list', badge: 0 },
        { root: GastoPage, title: 'Gastos', icon: 'trending-down', badge: 0 },
        { root: ConfiguracionPage, title: 'Configuración', icon: 'settings', badge: 0 }
      ];
    } else {
      this.tabs = [
        { root: AgendaPage, title: 'Agenda', icon: 'bookmarks', badge: 0 },
        { root: PendientePage, title: 'Pendientes', icon: 'notifications', badge: 0 },
        { root: ReportesPage, title: 'Reportes', icon: 'list', badge: 0 },
        { root: ConfiguracionPage, title: 'Configuración', icon: 'options', badge: 0 }
      ];
    }
    this.updatePendientes();
  }

  updatePendientes() {
    const pendientesDoc = this.afs.collection<any>(this.usuarioService.getFilePathUsuario() + this.usuarioService.getUsuario().id + '/disponibilidades/', ref => ref.where('pendientes', '>=', 1));
    this.watch = pendientesDoc.valueChanges().subscribe(data => {
      if (data[0]) {
        this.tabs[1].badge = data.map(reservas => Number(reservas.pendientes)).reduce((a, b) => a + b);
      } else {
        this.tabs[1].badge = 0;
      }
    });
  }

  tapped() {
    switch (this.tabRef.getSelected().root) {
      case PendientePage:
        this.watch.unsubscribe();
        this.tabs[1].badge = 0;
        break;

      default:
        this.updatePendientes();
        break;
    }
  }

}