import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { DetalleReportePage } from './detalle-reporte';

@NgModule({
  declarations: [
    DetalleReportePage,
  ],
  imports: [
    IonicPageModule.forChild(DetalleReportePage),
  ],
})
export class DetalleReportePageModule {}
