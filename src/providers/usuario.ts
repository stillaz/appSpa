import { Injectable } from '@angular/core';
import { UsuarioOptions } from '../interfaces/usuario-options';
import { ServicioOptions } from '../interfaces/servicio-options';

/*
  Generated class for the UsuarioProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UsuarioProvider {

  getServicios(usuario: UsuarioOptions): ServicioOptions[] {
    let perfiles = usuario.perfiles;
    let serviciosGroup = [];
    let servicios: ServicioOptions[] = [];
    perfiles.forEach(perfil => {
      perfil.servicios.forEach(servicio => {
        if (serviciosGroup[servicio.id] === undefined) {
          serviciosGroup[servicio.id] = servicio;
          servicios.push(servicio);
        }
      });
    });

    return servicios;
  }

}
