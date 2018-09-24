import { Injectable } from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { Platform } from 'ionic-angular';
import { Firebase } from '@ionic-native/firebase'
import { UsuarioProvider } from './usuario';
import { UsuarioOptions } from '../interfaces/usuario-options';
import { Observable, BehaviorSubject } from 'rxjs';

/*
  Generated class for the FmcProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class FmcProvider {

  private notificaciones = 0;
  private notificacionesObserv: BehaviorSubject<number>;

  constructor(
    public firebase: Firebase,
    public afs: AngularFirestore,
    private platform: Platform,
    private usuario: UsuarioProvider
  ) {
    this.notificacionesObserv = new BehaviorSubject<number>(0);
  }

  async getToken() {

    let token;

    if (this.platform.is('android')) {
      token = await this.firebase.getToken();
    }

    if (this.platform.is('ios')) {
      token = await this.firebase.getToken();
      await this.firebase.grantPermission();
    }

    return this.saveTokenToFirestore(token);
  }

  listenToNotifications() {
    return this.firebase.onNotificationOpen();
  }

  private saveTokenToFirestore(token) {
    if (!token) return;

    const ruta = 'usuarios/' + this.usuario.getUsuario().id;

    const usuarioDoc = this.afs.doc<UsuarioOptions>(ruta);

    return usuarioDoc.update({ token: token });
  }

  public getNotificaciones(): Observable<number> {
    return this.notificacionesObserv.asObservable();
  }

  public setNotificaciones(valor: number): void {
    this.notificaciones += valor;
    this.notificacionesObserv.next(this.notificaciones);
  }

}
