import {Component, OnInit} from '@angular/core';
import {KeycloakService} from "keycloak-angular";
import {KeycloakProfile} from "keycloak-js";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent implements OnInit {
  // public userProfile: KeycloakProfile | null = null;

  // constructor(private readonly keycloak: KeycloakService) {
  // }

  public async ngOnInit() {
    // console.log(environment.backendUrl);
    // console.log(environment.keycloakUrl);
    // this.userProfile = await this.keycloak.loadUserProfile();
    // console.log(await this.keycloak.getToken());
  }
  //
  // logout() {
  //   this.keycloak.logout();
  // }

  subcategories: { [key: string]: boolean } = {
    items: true
  };

  toggleSubcategories(category: string): void {
    // this.subcategories[category] = !this.subcategories[category];
  }
}
