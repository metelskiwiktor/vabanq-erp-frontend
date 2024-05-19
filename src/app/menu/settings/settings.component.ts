import {Component} from '@angular/core';
import {ProductService} from "../../utility/service/product.service";
import {LocalStorageService} from "../../local-storage.service";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {

  constructor(private productService: ProductService, private localStorageService: LocalStorageService) {
  }

  connectingAllegro: boolean = false;


  connectAllegro() {
    const url: string = "https://google.com";
    this.connectingAllegro = true;
    this.productService.getAllegroAuthUrl().subscribe(
      url => {
        window.open(url, "_blank");
        this.productService.getAuthToken().subscribe(
          token => {
            this.localStorageService.setItem('allegro-token', token);
            this.connectingAllegro = false;
          }
        )
      }
    )
  }
}
