import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GruposServicioPage } from './grupos-servicio';

@NgModule({
  declarations: [
    GruposServicioPage,
  ],
  imports: [
    IonicPageModule.forChild(GruposServicioPage),
  ],
})
export class GruposServicioPageModule {}
