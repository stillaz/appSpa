import { ClienteOptions } from "./cliente-options";
import { ServicioOptions } from "./servicio-options";
import { PaqueteOptions } from "./paquete-options";
import { UsuarioOptions } from "./usuario-options";

export interface ReservaOptions {
  fechaInicio: any,
  fechaFin: any,
  estado: string,
  evento: string,
  idcarrito: number,
  servicio: ServicioOptions[],
  cliente: ClienteOptions,
  usuario: UsuarioOptions,
  id: string,
  fechaActualizacion: any,
  leido: boolean,
  pago: number,
  paquete: {
    paquete: PaqueteOptions,
    sesion: number
  }
}
