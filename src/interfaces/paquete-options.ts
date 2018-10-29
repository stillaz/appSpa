import { ServicioOptions } from "./servicio-options";
import { ClienteOptions } from "./cliente-options";

export interface PaqueteOptions{
    servicio: ServicioOptions,
    idempresa: string,
    idcarrito: number,
    sesiones: number,
    realizados: number,
    valorPaquete: number,
    pagado: number,
    estado: string,
    registro: any,
    actualizacion: any,
    cliente: ClienteOptions
}