import { GrupoOptions } from "./grupo-options";

export interface ServicioOptions {
    id: string,
    nombre: string,
    descripcion: string,
    duracion_MIN: number,
    valor: number,
    grupo: GrupoOptions,
    imagen: string,
    activo: boolean
}