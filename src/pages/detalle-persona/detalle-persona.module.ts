import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetallePersonaPage } from './detalle-persona';

@NgModule({
  declarations: [
    DetallePersonaPage,
  ],
  imports: [
    IonicPageModule.forChild(DetallePersonaPage),
  ],
  exports: [
    DetallePersonaPage
  ]
})
export class DetallePersonaPageModule {}
