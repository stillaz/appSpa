import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { GastoPage } from './gasto';

@NgModule({
  declarations: [
    GastoPage,
  ],
  imports: [
    IonicPageModule.forChild(GastoPage),
  ],
})
export class GastoPageModule {}
