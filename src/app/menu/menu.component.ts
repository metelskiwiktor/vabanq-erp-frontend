// src/app/menu/menu.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { KeycloakService } from "keycloak-angular";
import { KeycloakProfile } from "keycloak-js";
import { AllegroTokenService, AllegroTokenDetails } from "../utility/service/allegro-token.service";
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit, OnDestroy {
  public userProfile: KeycloakProfile | null = null;
  public allegroTokenDetails: AllegroTokenDetails | null = null;
  private tokenSubscription?: Subscription;

  constructor(
    private readonly keycloak: KeycloakService,
    private allegroTokenService: AllegroTokenService,
    private router: Router
  ) {}

  ngOnInit() {
    const token = this.keycloak.getKeycloakInstance().idTokenParsed;
    this.userProfile = {
      firstName: token?.['given_name'],
      lastName: token?.['family_name'],
      email: token?.['email']
    } as KeycloakProfile;

    // Subskrybuj zmiany w tokenie Allegro
    this.tokenSubscription = this.allegroTokenService.tokenDetails$.subscribe(
      details => {
        this.allegroTokenDetails = details;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.keycloak.logout();
  }

  subcategories: { [key: string]: boolean } = {
    items: true,
    accounting: true,
  };

  getAllegroStatusClass(): string {
    if (!this.allegroTokenDetails) return 'allegro-status-unknown';

    switch (this.allegroTokenDetails.status) {
      case 'connected': return 'allegro-status-connected';
      case 'warning': return 'allegro-status-warning';
      case 'expired': return 'allegro-status-expired';
      case 'not_connected': return 'allegro-status-not-connected';
      default: return 'allegro-status-unknown';
    }
  }

  getAllegroStatusTooltip(): string {
    if (!this.allegroTokenDetails) return 'Status Allegro nieznany';

    switch (this.allegroTokenDetails.status) {
      case 'connected':
        const timeRemaining = this.allegroTokenService.formatTimeRemaining(this.allegroTokenDetails.expiresIn || 0);
        return `Allegro połączone (pozostało: ${timeRemaining})`;
      case 'warning': return 'Allegro - token wygasa wkrótce!';
      case 'expired': return 'Allegro - token wygasł!';
      case 'not_connected': return 'Allegro niepołączone';
      default: return 'Status Allegro nieznany';
    }
  }

  onAllegroClick(): void {
    this.router.navigate(['/settings']);
  }
}
