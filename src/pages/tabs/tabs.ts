import { Component } from '@angular/core';
import { AgendaPage } from '../agenda/agenda';
import { ReportesPage } from '../reportes/reportes';
import { ConfiguracionPage } from '../configuracion/configuracion';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = AgendaPage;
  tab2Root = ReportesPage;
  tab3Root = ConfiguracionPage;

  constructor() {

  }
}
