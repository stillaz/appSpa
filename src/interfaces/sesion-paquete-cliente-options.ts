import { ReservaOptions } from "./reserva-options";

export interface SesionPaqueteClienteOptions {
    id: number,
    reserva: ReservaOptions,
    pago: number,
    registro: Date,
    estado: string,
    actualizacion: Date
}