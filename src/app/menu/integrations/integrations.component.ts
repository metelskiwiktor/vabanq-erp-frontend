import {Component, OnInit, OnDestroy} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {AllegroTokenService, AllegroTokenDetails} from "../../utility/service/allegro-token.service";
import {InfaktService} from "../../utility/service/infakt.service";
import {LocalStorageService} from "../../local-storage.service";
import {Subscription} from 'rxjs';

interface AllegroCredentials {
  clientId: string;
  clientSecret: string;
}

interface InfaktCredentials {
  apiKey: string;
  isValid: boolean;
  lastChecked?: Date;
  companyName?: string;
  userEmail?: string;
}

@Component({
  selector: 'app-integrations',
  templateUrl: './integrations.component.html',
  styleUrls: ['./integrations.component.css']
})
export class IntegrationsComponent implements OnInit, OnDestroy {
  // Allegro integration
  connectingAllegro: boolean = false;
  tokenDetails: AllegroTokenDetails | null = null;
  allegroCredentials: AllegroCredentials = {
    clientId: '',
    clientSecret: ''
  };
  showAllegroCredentials: boolean = false;
  showAllegroSecret: boolean = false; // Dodane dla toggle hasła

  // Infakt integration
  infaktCredentials: InfaktCredentials = {
    apiKey: '',
    isValid: false
  };
  checkingInfakt: boolean = false;
  infaktMessage: string = '';
  showInfaktCredentials: boolean = false;
  showInfaktSecret: boolean = false; // Dodane dla toggle hasła

  private tokenSubscription?: Subscription;

  constructor(
    private productService: ProductService,
    private allegroTokenService: AllegroTokenService,
    private infaktService: InfaktService,
    private localStorageService: LocalStorageService
  ) {
  }

  ngOnInit(): void {
    // Subscribe to Allegro token changes
    this.tokenSubscription = this.allegroTokenService.tokenDetails$.subscribe(
      details => {
        this.tokenDetails = details;
        console.log('Token details updated:', details);
      }
    );

    // Load saved credentials
    this.loadCredentials();
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
  }

  // =============== ALLEGRO METHODS ===============

  loadCredentials(): void {
    // Load Allegro credentials
    const allegroData = this.localStorageService.getItem('allegro-credentials');
    if (allegroData) {
      try {
        this.allegroCredentials = JSON.parse(allegroData);
      } catch (e) {
        console.error('Error parsing Allegro credentials:', e);
      }
    }

    // Load Infakt credentials
    const infaktData = this.localStorageService.getItem('infakt-credentials');
    if (infaktData) {
      try {
        this.infaktCredentials = JSON.parse(infaktData);
      } catch (e) {
        console.error('Error parsing Infakt credentials:', e);
      }
    }
  }

  saveAllegroCredentials(): void {
    if (!this.allegroCredentials.clientId.trim() || !this.allegroCredentials.clientSecret.trim()) {
      alert('Wypełnij wszystkie pola Allegro');
      return;
    }

    this.localStorageService.setItem('allegro-credentials', JSON.stringify(this.allegroCredentials));
    alert('Dane logowania Allegro zostały zapisane');
    this.showAllegroCredentials = false;
  }

  connectAllegro(): void {
    if (!this.allegroCredentials.clientId || !this.allegroCredentials.clientSecret) {
      alert('Najpierw skonfiguruj dane logowania Allegro');
      this.showAllegroCredentials = true;
      return;
    }

    this.connectingAllegro = true;
    this.productService.getAllegroAuthUrl(this.allegroCredentials.clientId, this.allegroCredentials.clientSecret).subscribe(
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

  disconnectAllegro(): void {
    if (confirm('Czy na pewno chcesz odłączyć konto Allegro?')) {
      this.allegroTokenService.removeToken();
    }
  }

  refreshAllegroToken(): void {
    this.connectAllegro();
  }

  // =============== INFAKT METHODS ===============

  saveInfaktCredentials(): void {
    if (!this.infaktCredentials.apiKey.trim()) {
      alert('Wprowadź klucz API Infakt');
      return;
    }

    this.localStorageService.setItem('infakt-credentials', JSON.stringify(this.infaktCredentials));
    alert('Klucz API Infakt został zapisany');
    this.showInfaktCredentials = false;
  }

  checkInfaktApi(): void {
    if (!this.infaktCredentials.apiKey.trim()) {
      alert('Wprowadź klucz API Infakt');
      return;
    }

    this.checkingInfakt = true;
    this.infaktMessage = '';

    this.infaktService.checkApiKey(this.infaktCredentials.apiKey).subscribe({
      next: (response) => {
        this.infaktCredentials.isValid = true;
        this.infaktCredentials.lastChecked = new Date();
        this.infaktCredentials.companyName = response.companyName;
        this.infaktCredentials.userEmail = response.userEmail;
        this.infaktMessage = response.message || 'Połączenie z Infakt zostało nawiązane pomyślnie';
        this.saveInfaktCredentialsAfterCheck();
        this.checkingInfakt = false;
      },
      error: (error) => {
        this.infaktCredentials.isValid = false;
        this.infaktCredentials.companyName = undefined;
        this.infaktCredentials.userEmail = undefined;
        this.infaktMessage = error.error?.message || 'Błąd połączenia z Infakt. Sprawdź klucz API.';
        this.saveInfaktCredentialsAfterCheck();
        this.checkingInfakt = false;
      }
    });
  }

  private saveInfaktCredentialsAfterCheck(): void {
    this.localStorageService.setItem('infakt-credentials', JSON.stringify(this.infaktCredentials));
  }

  disconnectInfakt(): void {
    if (confirm('Czy na pewno chcesz odłączyć integrację z Infakt?')) {
      this.infaktCredentials = {
        apiKey: '',
        isValid: false
      };
      this.infaktMessage = '';
      this.localStorageService.removeItem('infakt-credentials');
    }
  }

  // =============== UI HELPER METHODS ===============

  // Allegro status methods
  getAllegroStatusText(): string {
    if (!this.tokenDetails) return 'Nieznany';

    switch (this.tokenDetails.status) {
      case 'connected':
        return 'Połączony';
      case 'warning':
        return 'Ostrzeżenie';
      case 'expired':
        return 'Wygasł';
      case 'not_connected':
        return 'Niepołączony';
      default:
        return 'Nieznany';
    }
  }

  getAllegroStatusClass(): string {
    if (!this.tokenDetails) return 'status-unknown';

    switch (this.tokenDetails.status) {
      case 'connected':
        return 'status-connected';
      case 'warning':
        return 'status-warning';
      case 'expired':
        return 'status-error';
      case 'not_connected':
        return 'status-not-connected';
      default:
        return 'status-unknown';
    }
  }

  getInfaktStatusText(): string {
    if (!this.infaktCredentials.apiKey) return 'Niepołączony';
    return this.infaktCredentials.isValid ? 'Połączony' : 'Błąd połączenia';
  }

  getInfaktStatusClass(): string {
    if (!this.infaktCredentials.apiKey) return 'status-not-connected';
    return this.infaktCredentials.isValid ? 'status-connected' : 'status-error';
  }

  formatExpiryDate(date: Date | undefined): string {
    if (!date) return 'Nieznana';
    return date.toLocaleString('pl-PL');
  }

  getTimeRemaining(): string {
    if (!this.tokenDetails?.expiresIn) return 'Nieznany';
    return this.allegroTokenService.formatTimeRemaining(this.tokenDetails.expiresIn);
  }

  formatLastChecked(): string {
    if (!this.infaktCredentials.lastChecked) return 'Nigdy';
    return new Date(this.infaktCredentials.lastChecked).toLocaleString('pl-PL');
  }

  // Nowa metoda dla klasy CSS daty wygaśnięcia
  getExpiryClass(): string {
    if (!this.tokenDetails) return '';

    switch (this.tokenDetails.status) {
      case 'warning':
        return 'text-warning';
      case 'expired':
        return 'text-danger';
      default:
        return '';
    }
  }
}
