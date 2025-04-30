import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  // constructor(private keycloakService: KeycloakService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // // Sprawdza, czy użytkownik jest zalogowany
    // if (this.keycloakService.isLoggedIn()) {
    //   return true;
    // }
    //
    // // Jeśli nie jest zalogowany, przekierowuje do logowania
    // this.keycloakService.login();
    // return false;
    return true;
  }

}
