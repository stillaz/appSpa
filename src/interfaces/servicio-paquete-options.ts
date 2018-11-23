import { ServicioOptions } from "./servicio-options";

export interface ServicioPaqueteOptions{
    servicio: ServicioOptions,
    sesiones: number,
    activo: boolean
}