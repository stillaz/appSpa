import { ServicioOptions } from "./servicio-options";

export interface PerfilOptions{
    id: number,
    nombre: string,
    servicios: ServicioOptions[]
}