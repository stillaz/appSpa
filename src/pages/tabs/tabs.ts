import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { AgendaPage } from '../agenda/agenda';
import { ReportesPage } from '../reportes/reportes';
import { ConfiguracionPage } from '../configuracion/configuracion';
import { GastoPage } from '../gasto/gasto';
import { UsuarioProvider } from '../../providers/usuario';
import { NotificacionPage } from '../notificacion/notificacion';
import { FmcProvider } from '../../providers/fmc';

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
  tabs;

  constructor(
    private usuarioService: UsuarioProvider,
    private fmcService: FmcProvider
  ) {
    if (this.usuarioService.isAdministrador()) {
      this.tabs = [
        { root: AgendaPage, title: 'Agenda', icon: 'bookmarks', badge: 0 },
        { root: ReportesPage, title: 'Reportes', icon: 'list', badge: 0 },
        { root: NotificacionPage, title: 'Notificaciones', icon: 'notifications', badge: 0 },
        { root: GastoPage, title: 'Gastos', icon: 'trending-down', badge: 0 },
        { root: ConfiguracionPage, title: 'Configuración', icon: 'settings', badge: 0 }
      ];
    } else {
      this.tabs = [
        { root: AgendaPage, title: 'Agenda', icon: 'bookmarks', badge: 0 },
        { root: ReportesPage, title: 'Reportes', icon: 'list', badge: 0 },
        { root: NotificacionPage, title: 'Notificaciones', icon: 'notifications', badge: 0 },
        { root: ConfiguracionPage, title: 'Configuración', icon: 'options', badge: 0 }
      ];
    }

    this.fmcService.getNotificaciones().subscribe(data => {
      this.tabs[2].badge = data;
    });
  }

}