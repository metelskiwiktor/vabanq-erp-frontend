import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiProductUrl = 'http://localhost:8080/product';
  private apiMaterialUrl = 'http://localhost:8080/accessory';

  constructor(private http: HttpClient) {
  }

  addProduct(data: any): Observable<any> {
    //show json request
    console.log(JSON.stringify(data));
    return this.http.post<any>(this.apiProductUrl, data);
  }

  addMaterial(data: any): Observable<any> {
    //show json request
    console.log(JSON.stringify(data));
    return this.http.post<any>(this.apiMaterialUrl, data);
  }

  getMaterials() {
    return this.http.get<any[]>(this.apiMaterialUrl);
  }
}
