import { ServicioOptions } from "./servicio-options";

export interface PerfilOptions{
    id: number,
    nombre: string,
    imagen: string,
    servicios: ServicioOptions[],
    activo: boolean
}