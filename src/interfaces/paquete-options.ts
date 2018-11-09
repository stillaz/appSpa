import { ServicioOptions } from "./servicio-options";

export interface PaqueteOptions{
    id: string,
    nombre: string,
    descripcion: string,
    valor: number,
    servicios_sesiones: [{
        servicio: ServicioOptions,
        sesiones: number
    }],
    configuracion: [{
        sesion: number,
        servicios: ServicioOptions[]
    }]
}