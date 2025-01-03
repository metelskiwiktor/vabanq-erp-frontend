import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, of, Subject, tap} from 'rxjs';
import {environment} from "../../../environments/environment";
import {KeycloakService} from "keycloak-angular";
import {GroupedAccessoriesResponse} from "../model/request/add-product-request";
import {ProductResponse} from "../model/response/product-response.model";
import {Order} from "../../menu/orders/model/orders-model";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private materialsUpdated = new Subject<void>();
  public materialsUpdated$ = this.materialsUpdated.asObservable();
  private readonly apiProductUrl: string;
  private readonly apiMaterialUrl: string;
  private readonly apiWmsUrl: string;
  private readonly apiAllegroUrl: string;

  constructor(private http: HttpClient, private readonly keycloak: KeycloakService) {
    this.apiProductUrl = environment.backendUrl + '/api/products';
    this.apiMaterialUrl = environment.backendUrl + '/api/accessories';
    this.apiWmsUrl = environment.backendUrl + '/api/inventory';
    this.apiAllegroUrl = environment.backendUrl + '/allegro';
    console.log(this.apiProductUrl);
  }

  addProduct(data: any): Observable<any> {
    console.log(data);
    return this.http.post<any>(this.apiProductUrl, data).pipe(
      tap(() => console.log('Request sent:', data))
    );
  }

  updateProduct(productId: string, data: any): Observable<any> {
    const url = `${this.apiProductUrl}/${productId}`;
    return this.http.put<any>(url, data).pipe(
      tap(() => console.log(`Product ${productId} updated successfully`, data))
    );
  }

  // Metoda do przesyłania głównego widoku
  addPreview(productId: string, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<any>(`${this.apiProductUrl}/${productId}/preview`, formData).pipe(
      tap(() => console.log('Preview sent:', file.name))
    );
  }

  deletePreview(productId: any): Observable<any> {
    return this.http.delete(`${this.apiProductUrl}/${productId}/preview`);
  }

  // Metoda pobierająca listę produktów
  getProducts(): Observable<ProductResponse[]> {
    // Wykonanie żądania GET do endpointa produktów
    return this.http.get<ProductResponse[]>(this.apiProductUrl).pipe(
      tap((products) => console.log('Fetched products:', products))
    );
  }

  // Metoda do przesyłania dodatkowych plików
  addFile(productId: string, file: File): Observable<any> {
    const formData: FormData = new FormData();
    formData.append('file', file, file.name);

    return this.http.post<any>(`${this.apiProductUrl}/${productId}/file`, formData).pipe(
      tap(() => console.log('File sent:', file.name))
    );
  }

  deleteFile(productId: string, fileId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiProductUrl}/${productId}/file/${fileId}`,).pipe(
      tap(() => console.log('File removed:', fileId))
    );
  }

  addFilament(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiMaterialUrl}/filament`, data).pipe(
      tap(() => {
        console.log('Filament dodany:', data);
        this.materialsUpdated.next();
      })
    );
  }

  // Aktualizacja istniejącego filamentu
  updateFilament(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiMaterialUrl}/filament/${id}`, data).pipe(
      tap(() => {
        console.log(`Filament ${id} zaktualizowany:`, data);
        this.materialsUpdated.next();
      })
    );
  }

  // Dodanie nowego opakowania
  addPackaging(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiMaterialUrl}/packaging`, data).pipe(
      tap(() => console.log('Opakowanie dodane:', data))
    );
  }

  // Aktualizacja istniejącego opakowania
  updatePackaging(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiMaterialUrl}/packaging/${id}`, data).pipe(
      tap(() => console.log(`Opakowanie ${id} zaktualizowane:`, data))
    );
  }

  // Dodanie nowego elementu złącznego
  addFasteners(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiMaterialUrl}/fasteners`, data).pipe(
      tap(() => {
        console.log('Element złączny dodany:', data);
        this.materialsUpdated.next();
      })
    );
  }

  // Aktualizacja istniejącego elementu złącznego
  updateFasteners(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiMaterialUrl}/fasteners/${id}`, data).pipe(
      tap(() => {
        console.log(`Element złączny ${id} zaktualizowany:`, data);
        this.materialsUpdated.next();
      })
    );
  }

  getMaterials(): Observable<GroupedAccessoriesResponse> {
    return this.http.get<GroupedAccessoriesResponse>(`${this.apiMaterialUrl}/all`);
  }

  getTags(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiProductUrl}/tags`);
  }

  updateWmsProduct(productId: string, wms: any) {
    return this.http.post<void>(`${this.apiWmsUrl}/update-wms/product?productId=${productId}`, wms);
  }

  updateWmsFastenersAccessory(id: string, wms: any) {
    return this.http.post<void>(`${this.apiWmsUrl}/update-wms/fasteners-accessory?fastenerAccessoryId=${id}`, wms);
  }

  updateWmsFilamentAccessory(id: string, wms: any) {
    return this.http.post<void>(`${this.apiWmsUrl}/update-wms/filament-accessory?filamentAccessoryId=${id}`, wms);
  }

  updateWmsPackagingAccessory(id: string, wms: any) {
    return this.http.post<void>(`${this.apiWmsUrl}/update-wms/packaging-accessory?packagingAccessoryId=${id}`, wms);
  }

  getOffers(token: string): Observable<any> {
    return this.http.get<any>(this.apiAllegroUrl + "/synchronization/my-offers", {headers: new HttpHeaders().set('allegro-api', token)});
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

  getOffersProducts(token: string) {
    return this.http.get<any>(this.apiAllegroUrl + "/synchronization/all-offers-products", {headers: new HttpHeaders().set('allegro-api', token)});
  }

  // product.service.ts (dodaj dwie metody)

  synchronizeOffers(token: string): Observable<{ created: number; updated: number }> {
    const headers = new HttpHeaders().set('allegro-api', token);
    return this.http.get<{ created: number; updated: number }>(
      `${this.apiAllegroUrl}/synchronize-offers`,
      { headers }
    );
  }

  synchronizeOrders(token: string): Observable<{ created: number; updated: number }> {
    const headers = new HttpHeaders().set('allegro-api', token);
    return this.http.get<{ created: number; updated: number }>(
      `${this.apiAllegroUrl}/synchronize-orders`,
      { headers }
    );
  }

  getLinkedOffers(token: string) {
    return this.http.get<any>(`${this.apiAllegroUrl}/offers`, {
      headers: new HttpHeaders().set('allegro-api', token)
    });
  }

  updateOfferAssignment(offerId: string, requests: any[]) {
    return this.http.post<void>(
      `${this.apiAllegroUrl}/${offerId}/update-assignment`,
      requests
    );
  }

  getOrders(token: string): Observable<Order[]> {
    const headers = new HttpHeaders().set('allegro-api', token);
    return this.http.get<Order[]>(`${this.apiAllegroUrl}/orders`, { headers }).pipe(
      tap((orders) => console.log('Fetched orders from backend:', orders))
    );
  }

}
