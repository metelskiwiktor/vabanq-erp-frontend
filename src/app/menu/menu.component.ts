// src/app/menu/menu.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { KeycloakService } from "keycloak-angular";
import { KeycloakProfile } from "keycloak-js";
import { AllegroTokenService, AllegroTokenDetails } from "../utility/service/allegro-token.service";
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  animations: [
    trigger('slideInOut', [
      state('in', style({
        maxHeight: '300px',
        opacity: 1,
        overflow: 'hidden'
      })),
      state('out', style({
        maxHeight: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      transition('in => out', animate('400ms cubic-bezier(0.4, 0, 0.2, 1)')),
      transition('out => in', animate('400ms cubic-bezier(0.4, 0, 0.2, 1)'))
    ])
  ]
})
export class MenuComponent implements OnInit, OnDestroy {
  public userProfile: KeycloakProfile | null = null;
  public allegroTokenDetails: AllegroTokenDetails | null = null;
  public showProfileMenu: boolean = false;
  public currentRoute: string = '';

  private tokenSubscription?: Subscription;
  private routerSubscription?: Subscription;

  // Subcategories state
  public subcategories: { [key: string]: boolean } = {
    products: true,
    auctions: true,
    accounting: true,
  };

  constructor(
    private readonly keycloak: KeycloakService,
    private allegroTokenService: AllegroTokenService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize user profile
    const token = this.keycloak.getKeycloakInstance().idTokenParsed;
    this.userProfile = {
      firstName: token?.['given_name'],
      lastName: token?.['family_name'],
      email: token?.['email']
    } as KeycloakProfile;

    // Subscribe to Allegro token changes
    this.tokenSubscription = this.allegroTokenService.tokenDetails$.subscribe(
      details => {
        this.allegroTokenDetails = details;
      }
    );

    // Subscribe to route changes
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      const navEvent = event as NavigationEnd;
      this.currentRoute = navEvent.urlAfterRedirects;
      this.updateActiveCategories();
    });

    // Set initial route and categories
    this.currentRoute = this.router.url;

    // Load subcategories state from localStorage
    this.loadSubcategoriesState();
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  toggleCategory(category: string): void {
    this.subcategories[category] = !this.subcategories[category];
    this.saveSubcategoriesState();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onItemClick(route: string): void {
    this.showProfileMenu = false;
  }

  updateActiveCategories(): void {
    // Auto-expand categories based on current route
    if (this.currentRoute.includes('/items') ||
      this.currentRoute.includes('/add-item') ||
      this.currentRoute.includes('/wms') ||
      this.currentRoute.includes('/generate-eans')) {
      this.subcategories['products'] = true;
    }

    if (this.currentRoute.includes('/offers') ||
      this.currentRoute.includes('/orders')) {
      this.subcategories['auctions'] = true;
    }

    if (this.currentRoute.includes('/accounting')) {
      this.subcategories['accounting'] = true;
    }
  }

  isRouteActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  // User initials for avatar
  getUserInitials(): string {
    if (!this.userProfile) return 'U';

    const firstName = this.userProfile.firstName || '';
    const lastName = this.userProfile.lastName || '';

    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
  }

  // Allegro status methods
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

  // Profile avatar status class
  getProfileAllegroStatusClass(): string {
    if (!this.allegroTokenDetails) return 'profile-status-unknown';

    switch (this.allegroTokenDetails.status) {
      case 'connected': return 'profile-status-connected';
      case 'warning': return 'profile-status-warning';
      case 'expired': return 'profile-status-expired';
      case 'not_connected': return 'profile-status-not-connected';
      default: return 'profile-status-unknown';
    }
  }

  // Menu status dot class
  getMenuAllegroStatusClass(): string {
    if (!this.allegroTokenDetails) return '';

    switch (this.allegroTokenDetails.status) {
      case 'connected': return 'status-connected';
      case 'warning': return 'status-warning';
      case 'expired': return 'status-error';
      case 'not_connected': return '';
      default: return '';
    }
  }

  // Profile menu methods
  goToSettings(): void {
    this.showProfileMenu = false;
    this.router.navigate(['/settings']);
  }

  goToIntegrations(): void {
    this.showProfileMenu = false;
    // Redirect to settings page since integrations are handled there
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.showProfileMenu = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('subcategories_state');
    this.keycloak.logout();
  }

  // State persistence
  private saveSubcategoriesState(): void {
    localStorage.setItem('subcategories_state', JSON.stringify(this.subcategories));
  }

  private loadSubcategoriesState(): void {
    try {
      const saved = localStorage.getItem('subcategories_state');
      if (saved) {
        this.subcategories = { ...this.subcategories, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Error loading subcategories state:', e);
    }
  }
}
