import { Component, OnInit } from '@angular/core';
import {ProductService} from "../../../utility/service/product.service";
import {ProductResponse, PrintTime} from "../../../utility/model/response/product-response.model";
import {MatDialog} from "@angular/material/dialog";
import {AddProductComponent} from "../../add-item/add-product/add-product.component";

@Component({
  selector: 'app-list-products',
  templateUrl: './list-products.component.html',
  styleUrls: ['./list-products.component.css']
})
export class ListProductsComponent implements OnInit {
  products: ProductResponse[] = [];
  filteredProductsCache: ProductResponse[] = [];
  
  // Filters
  filter: string = '';
  availableTags: string[] = [];
  selectedTags: string[] = [];
  stockFilter: string = '';
  sortBy: string = 'name_asc';
  priceRange = { min: 0, max: 0 };
  
  // UI State
  viewMode: 'grid' | 'list' = 'grid';
  
  constructor(private productService: ProductService, public dialog: MatDialog) {}

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.productService.getProducts().subscribe((data: ProductResponse[]) => {
      this.products = data;
      this.processProductImages();
      this.extractTags();
      this.initializePriceRange();
      this.onFiltersChange();
    });
  }

  private processProductImages() {
    this.products.forEach(product => {
      if (product.preview && product.preview.data) {
        if (product.preview.data instanceof Uint8Array) {
          const blob = new Blob([product.preview.data], { type: 'image/png' });
          product.imageUrl = URL.createObjectURL(blob);
        } else if (typeof product.preview.data === 'string') {
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
  }

  private initializePriceRange() {
    if (this.products.length === 0) {
      this.priceRange = { min: 0, max: 0 };
      return;
    }
    
    const prices = this.products.map(p => p.price).filter(p => p > 0);
    if (prices.length > 0) {
      this.priceRange = {
        min: 0,
        max: Math.max(...prices)
      };
    }
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
    return this.filteredProductsCache;
  }

  onFiltersChange() {
    let filtered = [...this.products];

    // Text search filter
    if (this.filter) {
      const searchTerm = this.filter.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.ean?.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Tags filter
    if (this.selectedTags.length > 0) {
      filtered = filtered.filter(product =>
        product.tags.some(tag => this.selectedTags.includes(tag))
      );
    }

    // Stock filter
    if (this.stockFilter) {
      filtered = filtered.filter(product => {
        if (!product.wms.enabled) return this.stockFilter === 'in_stock';
        
        switch (this.stockFilter) {
          case 'in_stock':
            return product.wms.quantity > product.wms.criticalStock;
          case 'low_stock':
            return product.wms.quantity <= product.wms.criticalStock && product.wms.quantity > 0;
          case 'out_of_stock':
            return product.wms.quantity === 0;
          default:
            return true;
        }
      });
    }

    // Price range filter
    if (this.priceRange.max > 0) {
      filtered = filtered.filter(product => 
        product.price >= this.priceRange.min && 
        product.price <= this.priceRange.max
      );
    }

    // Apply sorting
    filtered = this.applySorting(filtered);
    
    this.filteredProductsCache = filtered;
  }

  private applySorting(products: ProductResponse[]): ProductResponse[] {
    return products.sort((a, b) => {
      switch (this.sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'stock_asc':
          return (a.wms.enabled ? a.wms.quantity : 0) - (b.wms.enabled ? b.wms.quantity : 0);
        case 'stock_desc':
          return (b.wms.enabled ? b.wms.quantity : 0) - (a.wms.enabled ? a.wms.quantity : 0);
        case 'created_desc':
          return a.name.localeCompare(b.name); // Fallback to name since no created date
        default:
          return a.name.localeCompare(b.name);
      }
    });
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

  formatTags(product: ProductResponse) {
    return product.tags.map(tag => `#${tag}`).join(', ');
  }

  // New methods for enhanced UI
  getActiveProductsCount(): number {
    return this.products.filter(p => p.wms.enabled && p.wms.quantity > 0).length;
  }

  getLowStockCount(): number {
    return this.products.filter(p => 
      p.wms.enabled && p.wms.quantity <= p.wms.criticalStock && p.wms.quantity > 0
    ).length;
  }

  getStockBadgeClass(product: ProductResponse): string {
    if (!product.wms.enabled) return 'no-wms';
    
    if (product.wms.quantity === 0) return 'out-of-stock';
    if (product.wms.quantity <= product.wms.criticalStock) return 'low-stock';
    return 'in-stock';
  }

  getStockIcon(product: ProductResponse): string {
    if (!product.wms.enabled) return 'inventory_2';
    
    if (product.wms.quantity === 0) return 'remove_shopping_cart';
    if (product.wms.quantity <= product.wms.criticalStock) return 'warning';
    return 'check_circle';
  }

  getStockLabel(product: ProductResponse): string {
    if (!product.wms.enabled) return 'Brak WMS';
    
    if (product.wms.quantity === 0) return 'Brak';
    if (product.wms.quantity <= product.wms.criticalStock) return 'Niski';
    return 'OK';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN'
    }).format(amount);
  }

  formatPrintTime(printTime: PrintTime): string {
    if (!printTime || (printTime.hours === 0 && printTime.minutes === 0)) {
      return 'Brak danych';
    }
    
    if (printTime.hours === 0) {
      return `${printTime.minutes}min`;
    }
    
    if (printTime.minutes === 0) {
      return `${printTime.hours}h`;
    }
    
    return `${printTime.hours}h ${printTime.minutes}min`;
  }

  getPrintTimeTotal(product: ProductResponse): number {
    if (!product.printTime) return 0;
    return product.printTime.hours * 60 + product.printTime.minutes;
  }

  getTotalMaterials(product: ProductResponse): number {
    if (!product.productAccessories) return 0;
    
    const fasteners = product.productAccessories.fasteners?.length || 0;
    const filaments = product.productAccessories.filaments?.length || 0;
    const packagings = product.productAccessories.packagings?.length || 0;
    
    return fasteners + filaments + packagings;
  }

  trackByProductId(index: number, product: ProductResponse): string {
    return product.id;
  }

  onViewModeChange() {
    // Optional: Save preference to localStorage
    localStorage.setItem('products-view-mode', this.viewMode);
  }

  clearFilters() {
    this.filter = '';
    this.selectedTags = [];
    this.stockFilter = '';
    this.sortBy = 'name_asc';
    this.priceRange = { min: 0, max: 0 };
    this.initializePriceRange();
    this.onFiltersChange();
  }

  hasActiveFilters(): boolean {
    return !!(this.filter || 
              this.selectedTags.length > 0 || 
              this.stockFilter || 
              this.sortBy !== 'name_asc' ||
              (this.priceRange.max > 0 && (this.priceRange.min > 0 || this.priceRange.max < Math.max(...this.products.map(p => p.price))))
    );
  }
}
