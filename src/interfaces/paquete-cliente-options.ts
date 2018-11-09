import { ClienteOptions } from "./cliente-options";
import { PaqueteOptions } from "./paquete-options";


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
    registro: Date
}