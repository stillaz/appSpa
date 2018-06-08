import { Injectable } from '@angular/core';
import { UsuarioOptions } from '../interfaces/usuario-options';
import { ServicioOptions } from '../interfaces/servicio-options';
import { PerfilProvider } from './perfil';
import { PerfilOptions } from '../interfaces/perfil-options';

/*
  Generated class for the UsuarioProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UsuarioProvider {

  constructor(private perfilCtrl: PerfilProvider){
    
  }

  getUsuarios(): UsuarioOptions[]{
    let usuarios = [];

    let perfiles1: PerfilOptions[] = this.perfilCtrl.getPerfiles().slice(0, 0);
    let usuario1: UsuarioOptions = { id: 1, nombre: 'El Administrador', perfiles: perfiles1 };

    let perfiles2: PerfilOptions[] = this.perfilCtrl.getPerfiles().slice(1, 1);
    let usuario2: UsuarioOptions = { id: 1, nombre: 'El Barbero', perfiles: perfiles2 };

    let perfiles3: PerfilOptions[] = this.perfilCtrl.getPerfiles().slice(0, 1);
    let usuario3: UsuarioOptions = { id: 1, nombre: 'El Administrador, Barbero', perfiles: perfiles3 };

    usuarios.push(usuario1);
    usuarios.push(usuario2);
    usuarios.push(usuario3);

    return usuarios;
  }

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
