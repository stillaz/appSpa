import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { NodisponiblePage } from './nodisponible';

@NgModule({
  declarations: [
    NodisponiblePage,
  ],
  imports: [
    IonicPageModule.forChild(NodisponiblePage),
  ],
})
export class NodisponiblePageModule {}
