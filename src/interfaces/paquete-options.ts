import { ServicioOptions } from "./servicio-options";
import { GrupoOptions } from "./grupo-options";

export interface PaqueteOptions{
    id: string,
    nombre: string,
    descripcion: string,
    valor: number,
    grupo: GrupoOptions,
    imagen: string,
    servicios: [{
        servicio: ServicioOptions,
        sesiones: number
    }],
    sesiones: [{
        sesion: number,
        servicios: ServicioOptions[]
    }],
    activo: boolean
}