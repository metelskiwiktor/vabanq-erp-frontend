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
  public userProfile: KeycloakProfile | null = null;

  constructor(private readonly keycloak: KeycloakService) {
  }

  ngOnInit() {
    const token = this.keycloak.getKeycloakInstance().idTokenParsed;
    this.userProfile = {
      firstName: token?.['given_name'],
      lastName: token?.['family_name'],
      email: token?.['email']
    } as KeycloakProfile;
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.keycloak.logout();
  }

  subcategories: { [key: string]: boolean } = {
    items: true,
    accounting: true,
  };

}
