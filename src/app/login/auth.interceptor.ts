import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { throwError } from 'rxjs';
import { catchError, mergeMap } from 'rxjs/operators';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private keycloak: KeycloakService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!req.url.includes('/api')) return next.handle(req);

    const cachedToken = localStorage.getItem('auth_token');
    if (cachedToken && this.isTokenValid(cachedToken)) {
      return next.handle(this.addAuthHeader(req, cachedToken));
    }

    return from(this.keycloak.getToken()).pipe(
      mergeMap(token => {
        if (!token) {
          return throwError(() => new Error('Token is null'));
        }

        localStorage.setItem('auth_token', token);
        return next.handle(this.addAuthHeader(req, token));
      }),
      catchError(err => {
        console.error('Token error', err);
        return throwError(() => err);
      })
    );
  }

  private addAuthHeader(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
