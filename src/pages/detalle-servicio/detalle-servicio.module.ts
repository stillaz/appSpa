import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetalleServicioPage } from './detalle-servicio';

@NgModule({
  declarations: [
    DetalleServicioPage,
  ],
  imports: [
    IonicPageModule.forChild(DetalleServicioPage),
  ],
})
export class DetalleServicioPageModule {}
