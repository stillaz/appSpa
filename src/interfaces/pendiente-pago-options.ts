import { ReservaOptions } from "./reserva-options";

export interface PendientePagoOptions{
    total: number,
    idcarrito: number
    nombrecliente: string,
    nombreusuario: string,
    servicios: number,
    reservas: ReservaOptions[]
}