import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of, tap} from 'rxjs';
import {environment} from "../../../environments/environment";
import {SaveProductRequest} from '../model/request/save-product-request';
import {CreateWmsRequest} from "../model/request/create-wms-request";
import {KeycloakService} from "keycloak-angular";

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiProductUrl: string;
  private apiMaterialUrl: string;
  private apiWmsUrl: string;
  private apiAllegroUrl: string;

  constructor(private http: HttpClient, private readonly keycloak: KeycloakService) {
    this.apiProductUrl = environment.backendUrl + '/product';
    this.apiMaterialUrl = environment.backendUrl + '/accessory';
    this.apiWmsUrl = environment.backendUrl + '/wms';
    this.apiAllegroUrl = environment.backendUrl + '/allegro';
    console.log(this.apiProductUrl);
  }

  addProduct(data: SaveProductRequest): Observable<any> {
    return this.http.post<any>(this.apiProductUrl, data).pipe(
      tap(() => console.log('Request sent:', data))
    );
  }

  addMaterial(data: any): Observable<any> {
    return this.http.post<any>(this.apiMaterialUrl, data);
  }

  createWms(data: CreateWmsRequest): Observable<any> {
    return this.http.post<any>(this.apiWmsUrl, data);
  }

  getMaterials() {
    return this.http.get<any[]>(this.apiMaterialUrl);
  }

  getProducts() {
    // Utwórz nagłówek z tokenem JWT
    let jwtToken = this.keycloak.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`
    });

    // Dodaj nagłówki do żądania HTTP
    const options = { headers: headers };
    return this.http.get<any[]>(this.apiProductUrl, options);
  }

  getOffers(token: string): Observable<any> {
    return this.http.get<any>(this.apiAllegroUrl + "/synchronization/my-offers", {headers: new HttpHeaders().set('allegro-api', token)});
  }

  getAllWms() {
    return this.http.get<any[]>(this.apiWmsUrl);
  }

  getWmsById(id: string) {
    return this.http.get<any>(this.apiWmsUrl + "/" + id);
  }

  updateWms(id: string, formData: FormData) {
    return this.http.post<any>(this.apiWmsUrl + "/" + id + "/update", formData);
  }

  getAllegroAuthUrl() {
    return this.http.get(this.apiAllegroUrl + "/connect", {responseType: 'text'});
  }

  getAuthToken() {
    return this.http.get(this.apiAllegroUrl + "/token", {responseType: 'text'});
  }

  createOfferProducts(body: any) {
    return this.http.post<any>(this.apiAllegroUrl + "/synchronization/save-offer-products", body);
  }

  myOrders(token: string) {
    return this.http.get<any>(this.apiAllegroUrl + "/synchronization/ready-orders", {headers: new HttpHeaders().set('allegro-api', token)});
  }

  startSynchronization(token: string) {
    return this.http.get<any>(this.apiAllegroUrl + "/synchronization/start-synchronization", {headers: new HttpHeaders().set('allegro-api', token)});
  }

  getOffersProducts(token: string) {
    return this.http.get<any>(this.apiAllegroUrl + "/synchronization/all-offers-products", {headers: new HttpHeaders().set('allegro-api', token)});
  }
}
