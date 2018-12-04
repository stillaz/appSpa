import { GrupoOptions } from "./grupo-options";

export interface PaqueteOptions{
    id: string,
    nombre: string,
    descripcion: string,
    valor: number,
    grupo: GrupoOptions,
    imagen: string,
    activo: boolean
}