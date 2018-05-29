import { Component } from '@angular/core';

import { ReservaPage } from '../reserva/reserva';

@Component({
  templateUrl: 'tabs.html'
})
export class TabsPage {

  tab1Root = ReservaPage;
  tab2Root = '';
  tab3Root = '';

  constructor() {

  }
}
