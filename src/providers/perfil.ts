import { Injectable } from '@angular/core';
import { PerfilOptions } from '../interfaces/perfil-options';
import { ServicioOptions } from '../interfaces/servicio-options';
import { ServicioProvider } from './servicio';

/*
  Generated class for the PerfilProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class PerfilProvider {

  constructor(private servicioCtrl: ServicioProvider){}

  getPerfiles(): PerfilOptions[] {
    let perfiles: PerfilOptions[] = [];

    let perfilAdmin: PerfilOptions = { id: 0, nombre: 'Admin', servicios: []};

    let servicios1: ServicioOptions[] = this.servicioCtrl.getServicios();
    servicios1.splice(1,1);
    let perfil1: PerfilOptions = { id: 1, nombre: 'Barbero', servicios: servicios1};

    let servicios2: ServicioOptions[] = this.servicioCtrl.getServicios();
    servicios2.splice(0,1);
    let perfil2: PerfilOptions = { id: 2, nombre: 'Barbero2', servicios: servicios2};

    let servicios3: ServicioOptions[] = this.servicioCtrl.getServicios();
    servicios3.splice(1,2);
    let perfil3: PerfilOptions = { id: 3, nombre: 'Barbero3', servicios: servicios3};

    perfiles.push(perfilAdmin);
    perfiles.push(perfil1);
    perfiles.push(perfil2);
    perfiles.push(perfil3);

    return perfiles;
  }

}
