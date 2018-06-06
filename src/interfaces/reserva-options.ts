import { ClienteOptions } from "./cliente-options";
import { UsuarioOptions } from "./usuario-options";

export interface ReservaOptions {
  fechaInicio: Date,
  fechaFin: Date,
  estado: string,
  evento: string,
  cliente: ClienteOptions,
  usuario: UsuarioOptions
}
