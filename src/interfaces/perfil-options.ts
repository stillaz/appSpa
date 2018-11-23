import { GrupoOptions } from "./grupo-options";

export interface PerfilOptions{
    id: string,
    nombre: string,
    imagen: string,
    grupo: GrupoOptions[]
}