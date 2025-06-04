import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { LocalStorageService } from '../../local-storage.service';

export interface AllegroTokenDetails {
  isValid: boolean;
  user_name?: string;
  scope?: string;
  iss?: string;
  exp?: number;
  client_id?: string;
  expiresIn?: number; // sekundy do wygaśnięcia
  expiryDate?: Date;
  status: 'connected' | 'warning' | 'expired' | 'not_connected';
}

@Injectable({
  providedIn: 'root'
})
export class AllegroTokenService {
  private readonly TOKEN_KEY = 'allegro-token';
  private tokenDetailsSubject = new BehaviorSubject<AllegroTokenDetails>(this.getInitialTokenDetails());
  public tokenDetails$ = this.tokenDetailsSubject.asObservable();

  constructor(private localStorageService: LocalStorageService) {
    // Sprawdzaj token co minutę
    interval(60000).subscribe(() => {
      this.updateTokenDetails();
    });

    // Początkowa aktualizacja
    this.updateTokenDetails();
  }

  private getInitialTokenDetails(): AllegroTokenDetails {
    return {
      isValid: false,
      status: 'not_connected'
    };
  }

  private updateTokenDetails(): void {
    const token = this.localStorageService.getItem(this.TOKEN_KEY);
    const details = this.parseToken(token);
    this.tokenDetailsSubject.next(details);
  }

  public parseToken(token: string | null): AllegroTokenDetails {
    if (!token) {
      return {
        isValid: false,
        status: 'not_connected'
      };
    }

    try {
      // Dekoduj JWT token (format: header.payload.signature)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return {
          isValid: false,
          status: 'not_connected'
        };
      }

      // Dekoduj payload (base64)
      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp || 0;
      const expiresIn = exp - now;
      const expiryDate = new Date(exp * 1000);

      let status: 'connected' | 'warning' | 'expired' | 'not_connected';

      if (expiresIn <= 0) {
        status = 'expired';
      } else if (expiresIn <= 3600) { // ostrzeżenie gdy zostało mniej niż godzina
        status = 'warning';
      } else {
        status = 'connected';
      }

      return {
        isValid: expiresIn > 0,
        user_name: payload.user_name,
        scope: payload.scope,
        iss: payload.iss,
        exp: payload.exp,
        client_id: payload.client_id,
        expiresIn,
        expiryDate,
        status
      };
    } catch (error) {
      console.error('Error parsing Allegro token:', error);
      return {
        isValid: false,
        status: 'not_connected'
      };
    }
  }

  public getTokenDetails(): AllegroTokenDetails {
    return this.tokenDetailsSubject.value;
  }

  public getToken(): string | null {
    return this.localStorageService.getItem(this.TOKEN_KEY);
  }

  public setToken(token: string): void {
    this.localStorageService.setItem(this.TOKEN_KEY, token);
    this.updateTokenDetails();
  }

  public removeToken(): void {
    this.localStorageService.removeItem(this.TOKEN_KEY);
    this.updateTokenDetails();
  }

  public formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return 'Wygasł';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} dni ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}
