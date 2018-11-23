import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetallePaquetePage } from './detalle-paquete';

@NgModule({
  declarations: [
    DetallePaquetePage,
  ],
  imports: [
    IonicPageModule.forChild(DetallePaquetePage),
  ],
})
export class DetallePaquetePageModule {}
