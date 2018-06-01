import { ClienteOptions } from "./cliente-options";
import { UsuarioOptions } from "./usuario-options";

export interface ReservaOptions {
  fechaInicio: Date,
  fechaFin: Date,
  estado: String,
  evento: String,
  cliente: ClienteOptions,
  usuario: UsuarioOptions
}
