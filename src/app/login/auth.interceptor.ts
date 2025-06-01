import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { KeycloakService } from 'keycloak-angular';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private keycloak: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api')) {
      return next.handle(req);
    }

    const cachedToken = localStorage.getItem('auth_token');
    if (cachedToken) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${cachedToken}`
        }
      });
      return next.handle(authReq);
    }
    console.log(cachedToken);

    return from(this.keycloak.getToken()).pipe(
      mergeMap(token => {
        localStorage.setItem('auth_token', token);
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next.handle(authReq);
      })
    );
  }
}
