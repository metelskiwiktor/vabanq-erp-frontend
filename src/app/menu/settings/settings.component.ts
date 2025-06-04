// src/app/menu/settings/settings.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProductService } from "../../utility/service/product.service";
import { AllegroTokenService, AllegroTokenDetails } from "../../utility/service/allegro-token.service";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  connectingAllegro: boolean = false;
  tokenDetails: AllegroTokenDetails | null = null;
  private tokenSubscription?: Subscription;

  constructor(
    private productService: ProductService,
    private allegroTokenService: AllegroTokenService
  ) {}

  ngOnInit(): void {
    // Subskrybuj zmiany w tokenie
    this.tokenSubscription = this.allegroTokenService.tokenDetails$.subscribe(
      details => {
        this.tokenDetails = details;
        console.log('Token details updated:', details);
      }
    );
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  connectAllegro() {
    this.connectingAllegro = true;
    this.productService.getAllegroAuthUrl().subscribe(
      url => {
        window.open(url, "_blank");
        this.productService.getAuthToken().subscribe(
          token => {
            this.allegroTokenService.setToken(token);
            this.connectingAllegro = false;
          },
          error => {
            console.error('Error getting auth token:', error);
            this.connectingAllegro = false;
          }
        )
      },
      error => {
        console.error('Error getting auth URL:', error);
        this.connectingAllegro = false;
      }
    )
  }

  disconnectAllegro() {
    if (confirm('Czy na pewno chcesz odłączyć konto Allegro?')) {
      this.allegroTokenService.removeToken();
    }
  }

  refreshToken() {
    this.connectAllegro();
  }

  getStatusText(): string {
    if (!this.tokenDetails) return 'Nieznany';

    switch (this.tokenDetails.status) {
      case 'connected': return 'Połączony';
      case 'warning': return 'Ostrzeżenie';
      case 'expired': return 'Wygasł';
      case 'not_connected': return 'Niepołączony';
      default: return 'Nieznany';
    }
  }

  getStatusClass(): string {
    if (!this.tokenDetails) return 'status-unknown';

    switch (this.tokenDetails.status) {
      case 'connected': return 'status-connected';
      case 'warning': return 'status-warning';
      case 'expired': return 'status-expired';
      case 'not_connected': return 'status-not-connected';
      default: return 'status-unknown';
    }
  }

  formatExpiryDate(date: Date | undefined): string {
    if (!date) return 'Nieznana';
    return date.toLocaleString('pl-PL');
  }

  getTimeRemaining(): string {
    if (!this.tokenDetails?.expiresIn) return 'Nieznany';
    return this.allegroTokenService.formatTimeRemaining(this.tokenDetails.expiresIn);
  }
}
