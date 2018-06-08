import { PerfilOptions } from "./perfil-options";

export interface UsuarioOptions {
    id: number,
    nombre: string,
    perfiles: PerfilOptions[]
}
