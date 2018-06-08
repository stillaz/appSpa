import { ClienteOptions } from "./cliente-options";
import { UsuarioOptions } from "./usuario-options";
import { ServicioOptions } from "./servicio-options";

export interface ReservaOptions {
  fechaInicio: Date,
  fechaFin: Date,
  estado: string,
  evento: string,
  idcarrito: number,
  servicio: ServicioOptions,
  cliente: ClienteOptions,
  usuario: UsuarioOptions
}
