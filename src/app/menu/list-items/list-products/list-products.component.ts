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

  constructor(private productService: ProductService, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe((data: ProductResponse[]) => {
      this.products = data;
    });
  }

  getProductImage(product: ProductResponse): string {
    // Replace with logic to fetch or generate product image
    return 'https://via.placeholder.com/150';
  }

  filteredProducts(): ProductResponse[] {
    if (!this.filter) {
      return this.products;
    }
    return this.products.filter(product =>
      product.name.toLowerCase().includes(this.filter.toLowerCase())
    );
  }

  // Otwieranie dialogu z ProductComponent
  viewProduct(productId: string): void {
    const selectedProduct = this.products.find(p => p.id === productId);  // Znajdź produkt na podstawie ID

    if (selectedProduct) {
      const dialogRef = this.dialog.open(AddProductComponent, {
        // width: '600px',  // Rozmiar okna dialogowego
        data: { product: selectedProduct }  // Przekazanie danych do komponentu ProductComponent
      });

      dialogRef.afterClosed().subscribe(result => {
        console.log('Dialog was closed');
        // Możesz obsłużyć zamknięcie dialogu tutaj, jeśli to potrzebne
      });
    }
  }
  createNewProduct(): void {
    // Implement create new product logic
    console.log('Creating new product...');
  }
}
