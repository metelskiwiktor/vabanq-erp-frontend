import { Component, OnInit } from '@angular/core';
import {ProductService} from "../../../utility/service/product.service";
import {ProductResponse} from "../../../utility/model/response/product-response.model";
import {MatDialog} from "@angular/material/dialog";
import {AddProductComponent} from "../../add-item/add-product/add-product.component";

@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrls: ['./list-products.component.css']
})
export class ListProductsComponent implements OnInit {
  products: ProductResponse[] = [];
  filter: string = '';
  availableTags: string[] = [];  // Store available tags for ng-select
  selectedTags: string[] = [];
  constructor(private productService: ProductService, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.productService.getProducts().subscribe((data: ProductResponse[]) => {
      // Sortowanie produktów alfabetycznie według nazwy
      this.products = data;
      this.products.sort((a, b) => a.name.localeCompare(b.name));
      this.products.forEach(product => {
        if (product.preview && product.preview.data) {
          if (product.preview.data instanceof Uint8Array) {
            // Jeśli dane są Uint8Array
            const blob = new Blob([product.preview.data], { type: 'image/png' });
            product.imageUrl = URL.createObjectURL(blob);
          } else if (typeof product.preview.data === 'string') {
            // Jeśli dane są ciągiem znaków (prawdopodobnie Base64)
            const base64Data = product.preview.data;
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/png' });
            product.imageUrl = URL.createObjectURL(blob);
          } else {
            console.error('Nieobsługiwany format danych w product.preview.data');
            product.imageUrl = 'assets/images/placeholder.png';
          }
        } else {
          product.imageUrl = 'assets/images/placeholder.png';
        }
      });
      this.extractTags();
    });
  }

  getProductImage(product: ProductResponse): string {
    if (product.preview && product.preview.data) {
      const byteArray = new Uint8Array(product.preview.data);
      const blob = new Blob([byteArray], { type: 'image/png' });

      return URL.createObjectURL(blob);
    }

    return '';
  }

  extractTags() {
    const allTags = this.products.flatMap(product => product.tags);
    // Use a Set to get unique tags
    this.availableTags = Array.from(new Set(allTags));
  }

  filteredProducts(): ProductResponse[] {
    // Filtruj na podstawie nazwy produktu
    let filtered = this.products;

    if (this.filter) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.filter.toLowerCase())
      );
    }

    // Filtruj na podstawie wybranych tagów, jeśli jakiekolwiek zostały wybrane
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(product =>
        product.tags.some(tag => this.selectedTags.includes(tag))
      );
    }

    return filtered;
  }

  editProduct(productId: string): void {
    const selectedProduct = this.products.find(p => p.id === productId);
    if (selectedProduct) {
      const dialogRef = this.dialog.open(AddProductComponent, {
        data: {
          "product": selectedProduct,
          "viewMode": false
        },
        maxHeight: '100vh',
        width: '80%',
        hasBackdrop: true,
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe(result => {
        this.fetchData();
      });
    }
  }

  previewProduct(productId: string): void {
    const selectedProduct = this.products.find(p => p.id === productId);
    if (selectedProduct) {
      const dialogRef = this.dialog.open(AddProductComponent, {
        data: {
          "product": selectedProduct,
          "viewMode": true
        },
        maxHeight: '100vh',
        width: '80%',
        hasBackdrop: true,
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe(result => {
        this.fetchData();
      });
    }
  }


  createNewProduct(): void {
    console.log('Creating new product...');
  }

  formatTags(product: ProductResponse) {
    return product.tags.map(tag => `#${tag}`).join(', ');
  }
}
