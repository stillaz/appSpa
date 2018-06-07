import { ServicioOptions } from "./servicio-options";

export interface CarritoOptions {
    servicio: ServicioOptions,
    horaDesde: Date,
    horaHasta: Date
}