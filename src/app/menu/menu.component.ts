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
        maxHeight: '500px',
        opacity: 1,
        overflow: 'hidden'
      })),
      state('out', style({
        maxHeight: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      transition('in => out', animate('300ms ease-in-out')),
      transition('out => in', animate('300ms ease-in-out'))
    ])
  ]
})
export class MenuComponent implements OnInit, OnDestroy {
  public userProfile: KeycloakProfile | null = null;
  public allegroTokenDetails: AllegroTokenDetails | null = null;
  public isOpen: boolean = true;
  public searchTerm: string = '';
  public showProfileMenu: boolean = false;
  public currentRoute: string = '';

  private tokenSubscription?: Subscription;
  private routerSubscription?: Subscription;

  // Subcategories state
  public subcategories: { [key: string]: boolean } = {
    products: false,
    auctions: false,
    accounting: false,
    integrations: false,
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
    this.updateActiveCategories();

    // Load sidebar state from localStorage
    this.loadSidebarState();
  }

  ngOnDestroy(): void {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    // Auto-collapse on mobile
    if (event.target.innerWidth < 768) {
      this.isOpen = false;
    }
  }

  toggleSidebar(): void {
    this.isOpen = !this.isOpen;
    this.saveSidebarState();

    // Close profile menu when collapsing sidebar
    if (!this.isOpen) {
      this.showProfileMenu = false;
    }
  }

  toggleCategory(category: string): void {
    this.subcategories[category] = !this.subcategories[category];

    // Close other categories if on mobile
    if (window.innerWidth < 768) {
      Object.keys(this.subcategories).forEach(key => {
        if (key !== category) {
          this.subcategories[key] = false;
        }
      });
    }

    this.saveSubcategoriesState();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  onItemClick(route: string): void {
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768) {
      this.isOpen = false;
    }
    this.showProfileMenu = false;
  }

  onSearch(event: any): void {
    const term = event.target.value.toLowerCase();
    // Implement search functionality here
    console.log('Searching for:', term);
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

  get activeIntegrations(): boolean {
    return this.currentRoute.includes('/settings') && this.allegroTokenDetails?.isValid!;
  }

  // Allegro methods
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

  // Profile methods
  viewProfile(): void {
    this.showProfileMenu = false;
    // Navigate to profile page or open profile modal
    console.log('View profile clicked');
  }

  logout(): void {
    this.showProfileMenu = false;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('sidebar_state');
    localStorage.removeItem('subcategories_state');
    this.keycloak.logout();
  }

  // State persistence
  private saveSidebarState(): void {
    localStorage.setItem('sidebar_state', JSON.stringify({
      isOpen: this.isOpen
    }));
  }

  private loadSidebarState(): void {
    try {
      const saved = localStorage.getItem('sidebar_state');
      if (saved) {
        const state = JSON.parse(saved);
        this.isOpen = state.isOpen !== undefined ? state.isOpen : true;
      }
    } catch (e) {
      console.error('Error loading sidebar state:', e);
    }
  }

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
