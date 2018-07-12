import { ClienteOptions } from "./cliente-options";
import { ServicioOptions } from "./servicio-options";

export interface ReservaOptions {
  fechaInicio: any,
  fechaFin: any,
  estado: string,
  evento: string,
  idcarrito: number,
  servicio: ServicioOptions[],
  cliente: ClienteOptions,
  idusuario: string,
  nombreusuario: string
}
