import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReportesPage } from './reportes';
import { DatePickerModule } from '../../../node_modules/ionic3-datepicker';

@NgModule({
  declarations: [
    ReportesPage,
  ],
  imports: [
    IonicPageModule.forChild(ReportesPage),
    DatePickerModule
  ],
})
export class ReportesPageModule { }
