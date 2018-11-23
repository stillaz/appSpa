import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetalleServicioPaquetePage } from './detalle-servicio-paquete';

@NgModule({
  declarations: [
    DetalleServicioPaquetePage,
  ],
  imports: [
    IonicPageModule.forChild(DetalleServicioPaquetePage),
  ],
})
export class DetalleServicioPaquetePageModule {}
