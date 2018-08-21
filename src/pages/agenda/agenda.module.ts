import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AgendaPage } from './agenda';
import { PipesModule } from '../../pipes/pipes.module';
import { DatePickerModule } from 'ionic3-datepicker';

@NgModule({
  declarations: [
    AgendaPage,
  ],
  imports: [
    IonicPageModule.forChild(AgendaPage),
    PipesModule,
    DatePickerModule
  ],
})
export class AgendaPageModule { }
