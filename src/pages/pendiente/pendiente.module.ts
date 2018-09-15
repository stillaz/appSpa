import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { PendientePage } from './pendiente';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  declarations: [
    PendientePage,
  ],
  imports: [
    IonicPageModule.forChild(PendientePage),
    PipesModule
  ],
})
export class PendientePageModule {}
