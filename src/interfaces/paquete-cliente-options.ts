import { ClienteOptions } from "./cliente-options";
import { PaqueteOptions } from "./paquete-options";
import { ServicioOptions } from "./servicio-options";
import { SesionPaqueteOptions } from "./sesion-paquete-options";


export interface PaqueteClienteOptions {
    id: string,
    cliente: ClienteOptions,
    paquete: PaqueteOptions,
    idcarrito: number,
    estado: string,
    actualizacion: Date,
    sesion: number,
    pago: number,
    valor: number,
    registro: any,
    servicios: ServicioOptions[],
    sesiones: SesionPaqueteOptions[],
    serviciosActual: ServicioOptions[]
}