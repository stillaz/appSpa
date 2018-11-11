import { ServicioOptions } from "./servicio-options";
import { GrupoOptions } from "./grupo-options";

export interface PerfilOptions{
    id: string,
    nombre: string,
    imagen: string,
    servicios: ServicioOptions[],
    activo: boolean,
    grupo: GrupoOptions[]
}