import { UsuarioOptions } from "./usuario-options";

export interface DisponibilidadOptions{
    id: number,
    dia: number,
    mes: number,
    año: number,
    cantidadServicios: number,
    totalServicios: number,
    usuario: UsuarioOptions
}