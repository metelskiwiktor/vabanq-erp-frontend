import {Component, inject} from '@angular/core';
import {environment} from "../environments/environment";
import {ToastService} from "./utility/service/toast-service";
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1050;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .toast-container ngb-toast {
      max-height: 100px;
    }

    body {
      background-color: #121212;
      color: #ffffff;
    }
  `]
})
export class AppComponent {
  toastService = inject(ToastService);

  constructor() {
    console.log(environment.backendUrl)
    console.log(environment.keycloakUrl)
  }
}
