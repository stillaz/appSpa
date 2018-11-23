import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PaquetePage } from './paquete';

@NgModule({
  declarations: [
    PaquetePage,
  ],
  imports: [
    IonicPageModule.forChild(PaquetePage),
  ],
})
export class PaquetePageModule {}
