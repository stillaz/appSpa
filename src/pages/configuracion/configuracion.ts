import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-configuracion',
  templateUrl: 'configuracion.html'
})
export class ConfiguracionPage {

  pages: any[] = [
    { title: 'Horario', component: 'GeneralPage', icon: 'alert' },
    { title: 'Servicios', component: 'ServicioPage', icon: 'alert' }
  ];

  constructor(public navCtrl: NavController) {

  }

  openPage(page) {
    this.navCtrl.push(page.component);
  }

}
