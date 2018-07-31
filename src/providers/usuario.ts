import { Injectable } from '@angular/core';
import { UsuarioOptions } from '../interfaces/usuario-options';

/*
  Generated class for the EmpresaProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class UsuarioProvider {

  private usuario: UsuarioOptions;

  constructor() { }

  getUsuario() {
    return this.usuario;
  }

  setUsuario(usuario: UsuarioOptions) {
    this.usuario = usuario;
  }

  isAdministrador() {
    return this.usuario ? this.usuario.perfiles.some(perfil => perfil.nombre === 'Administrador') : false;
  }

  getFilePathEmpresa() {
    return 'negocios/' + this.usuario.idempresa;
  }

  getFilePathUsuarios() {
    return this.getFilePathEmpresa() + '/usuarios';
  }

  getFilePathUsuario() {
    return this.getFilePathEmpresa() + '/usuarios/';
  }

}
