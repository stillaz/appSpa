import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetalleGastoPage } from './detalle-gasto';

@NgModule({
  declarations: [
    DetalleGastoPage,
  ],
  imports: [
    IonicPageModule.forChild(DetalleGastoPage),
  ],
})
export class DetalleGastoPageModule {}
