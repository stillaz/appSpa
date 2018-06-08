import { Injectable } from "@angular/core";
import { ReservaOptions } from "../interfaces/reserva-options";
import * as DataProvider from './constants';

@Injectable()
export class ReservaProvider {

    getOtrasReservasByIdServicioAndNotFinalizado(reservas: ReservaOptions[], reservaSeleccionada: ReservaOptions) {
        return reservas.filter(reserva =>
            reserva.idcarrito === reservaSeleccionada.idcarrito && reserva.servicio.id !== reservaSeleccionada.servicio.id && reserva.estado !== DataProvider.ESTADOS_RESERVA.FINALIZADO
        );
    }

    getReservasByIdServicioAndFinalizado(reservas: ReservaOptions[], reservaSeleccionada: ReservaOptions): ReservaOptions[] {
        return reservas.filter(reserva =>
            reserva.idcarrito === reservaSeleccionada.idcarrito && reserva.estado === DataProvider.ESTADOS_RESERVA.FINALIZADO
        );
    }
}