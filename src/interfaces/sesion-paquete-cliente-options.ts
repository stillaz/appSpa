import { ServicioOptions } from "./servicio-options";
import { UsuarioOptions } from "./usuario-options";

export interface SesionPaqueteClienteOptions {
    id: number,
    sesion: number,
    servicios: ServicioOptions[],
    usuario: UsuarioOptions,
    pago: number,
    fecha: Date,
    estado: string
}