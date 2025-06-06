import { Component, inject, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { environment } from "../environments/environment";
import { ToastService } from "./utility/service/toast-service";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  toastService = inject(ToastService);
  private sidebarSubscription?: Subscription;

  constructor(private renderer: Renderer2) {
    console.log(environment.backendUrl);
    console.log(environment.keycloakUrl);
  }

  ngOnInit() {
    // Listen for sidebar state changes and update body class
    this.updateBodyClass();

    // Listen for changes in localStorage (sidebar state)
    window.addEventListener('storage', this.handleStorageChange.bind(this));

    // Check initial sidebar state
    this.checkSidebarState();
  }

  ngOnDestroy() {
    window.removeEventListener('storage', this.handleStorageChange.bind(this));
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === 'sidebar_state') {
      this.updateBodyClass();
    }
  }

  private checkSidebarState() {
    // Check every 100ms for sidebar state changes (for real-time updates)
    setInterval(() => {
      this.updateBodyClass();
    }, 100);
  }

  private updateBodyClass() {
    try {
      const sidebarState = localStorage.getItem('sidebar_state');
      if (sidebarState) {
        const state = JSON.parse(sidebarState);
        if (state.isOpen) {
          this.renderer.addClass(document.body, 'sidebar-open');
        } else {
          this.renderer.removeClass(document.body, 'sidebar-open');
        }
      }
    } catch (e) {
      // Handle parsing errors gracefully
      this.renderer.removeClass(document.body, 'sidebar-open');
    }
  }
}
