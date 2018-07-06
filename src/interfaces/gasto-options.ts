import { TipoOptions } from "./tipo-options";

export interface GastoOptions{
    id: string,
    valor: number,
    fecha: any,
    descripcion: string,
    especie: TipoOptions,
    idusuario: string,
    usuario: string,
    imagenusuario: string
}