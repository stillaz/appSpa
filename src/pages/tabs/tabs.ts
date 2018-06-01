import { Component } from '@angular/core';

import { AgendaPage } from '../agenda/agenda';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = AgendaPage;
  tab2Root = '';
  tab3Root = '';

  constructor() {

  }
}
