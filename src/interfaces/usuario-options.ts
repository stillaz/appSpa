import { PerfilOptions } from "./perfil-options";

export interface UsuarioOptions{
    id: string,
    nombre: string,
    telefono: string,
    email: string,
    perfiles: PerfilOptions[],
    imagen: string,
    activo: boolean
}