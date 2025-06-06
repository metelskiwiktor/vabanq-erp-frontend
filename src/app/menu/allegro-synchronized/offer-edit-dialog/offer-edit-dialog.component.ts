import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ProductService } from "../../../utility/service/product.service";
import {MatTableDataSource} from "@angular/material/table";
import { PackagingAccessoryResponse } from "../../../utility/model/request/add-product-request";

interface ProductQuantityRequest {
  productId: string;
  quantity: number;
}

interface PackagingQuantityRequest {
  packagingId: string;
  quantity: number;
}

interface ProductItem {
  id: string;
  name: string;
  ean: string;
  quantity: number;
}

interface PackagingItem {
  id: string;
  name: string;
  quantity: number;
}

@Component({
  selector: 'app-offer-edit-dialog',
  styleUrl: './offer-edit-dialog.component.css',
  templateUrl: './offer-edit-dialog.component.html'
})
export class OfferEditDialogComponent implements OnInit {
  offerId: string = '';
  assignedItems = new MatTableDataSource<ProductItem>([]);
  selectedProducts: ProductItem[] = [];
  selectedProductIds: string[] = [];
  allProducts: ProductItem[] = [];

  // Packaging related properties
  packagingOptions: PackagingAccessoryResponse[] = [];
  selectedPackagings: PackagingItem[] = [];
  selectedPackagingIds: string[] = [];
  assignedPackagings = new MatTableDataSource<PackagingItem>([]);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<OfferEditDialogComponent>,
    private productService: ProductService,
  ) {
    // Przekazujemy z parenta: data.offer
    this.offerId = data.offer.offerNumber;
  }

  ngOnInit(): void {
    this.productService.getProducts().subscribe((response: any[]) => {
      this.allProducts = response.map(p => ({
        id: p.id,
        name: p.name,
        ean: p.ean,
        quantity: 1
      }));
    });

    // Fetch packaging options
    this.productService.getMaterials().subscribe(materials => {
      this.packagingOptions = materials.packages;

      // Initialize packaging items if they exist in the offer
      if (this.data.offer.packagings && this.data.offer.packagings.length > 0) {
        // Map existing packagings to PackagingItem format
        const assignedPackagingData = this.data.offer.packagings.map((p: any) => ({
          id: p.packagingId,
          name: p.packagingName,
          quantity: p.quantity
        }));

        this.assignedPackagings.data = assignedPackagingData;
        this.selectedPackagings = [...assignedPackagingData];
        this.selectedPackagingIds = assignedPackagingData.map((p: PackagingItem) => p.id);
      }
      // For backward compatibility - handle single packaging
      else if (this.data.offer.packaging && this.data.offer.packaging.id) {
        const packagingItem: PackagingItem = {
          id: this.data.offer.packaging.id,
          name: this.data.offer.packaging.name,
          quantity: 1
        };

        this.assignedPackagings.data = [packagingItem];
        this.selectedPackagings = [packagingItem];
        this.selectedPackagingIds = [packagingItem.id];
      }
    });

    const existing = this.data.offer.products || [];
    const assignedData = existing.map((p: any) => ({
      id: p.productId,
      name: p.productName,
      ean: p.productEan,
      quantity: p.quantity
    }));

    this.assignedItems.data = assignedData;
    this.selectedProducts = [...assignedData];
    this.selectedProductIds = assignedData.map((p: ProductItem) => p.id);
  }

  onProductChange(selectedIds: string[]) {
    // Find products by IDs
    const selected = selectedIds.map(id =>
      this.allProducts.find((p: ProductItem) => p.id === id)
    ).filter((p): p is ProductItem => p !== undefined);

    // Add new items to assignedItems
    selected.forEach(item => {
      if (!this.assignedItems.data.find(p => p.id === item.id)) {
        this.assignedItems.data = [
          ...this.assignedItems.data,
          { ...item, quantity: item.quantity || 1 }
        ];
      }
    });

    // Remove items that are no longer selected
    this.assignedItems.data = this.assignedItems.data.filter(item =>
      selectedIds.includes(item.id)
    );

    this.selectedProducts = [...this.assignedItems.data];
  }

  onPackagingChange(selectedIds: string[]) {
    // Find packagings by IDs
    const selected = selectedIds.map(id =>
      this.packagingOptions.find((p: PackagingAccessoryResponse) => p.id === id)
    ).filter((p): p is PackagingAccessoryResponse => p !== undefined).map((p: PackagingAccessoryResponse) => ({
      id: p.id,
      name: p.name,
      quantity: 1
    }));

    // Add new items to assignedPackagings
    selected.forEach(item => {
      if (!this.assignedPackagings.data.find(p => p.id === item.id)) {
        this.assignedPackagings.data = [
          ...this.assignedPackagings.data,
          { ...item, quantity: item.quantity || 1 }
        ];
      }
    });

    // Remove items that are no longer selected
    this.assignedPackagings.data = this.assignedPackagings.data.filter(item =>
      selectedIds.includes(item.id)
    );

    this.selectedPackagings = [...this.assignedPackagings.data];
  }

  removeItem(row: ProductItem) {
    this.assignedItems.data = this.assignedItems.data.filter(item => item.id !== row.id);
    this.selectedProducts = this.selectedProducts.filter(item => item.id !== row.id);
    this.selectedProductIds = this.selectedProductIds.filter(id => id !== row.id);
  }

  removePackaging(row: PackagingItem) {
    this.assignedPackagings.data = this.assignedPackagings.data.filter(item => item.id !== row.id);
    this.selectedPackagings = this.selectedPackagings.filter(item => item.id !== row.id);
    this.selectedPackagingIds = this.selectedPackagingIds.filter(id => id !== row.id);
  }

  addQuantity(row: ProductItem) {
    row.quantity++;
  }

  subtractQuantity(row: ProductItem) {
    if (row.quantity > 1) row.quantity--;
  }

  addPackagingQuantity(row: PackagingItem) {
    row.quantity++;
  }

  subtractPackagingQuantity(row: PackagingItem) {
    if (row.quantity > 1) row.quantity--;
  }

  onSave() {
    // Prepare product data
    const productBody: ProductQuantityRequest[] = this.assignedItems.data.map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    // Prepare packaging data
    const packagingBody: PackagingQuantityRequest[] = this.assignedPackagings.data.map(item => ({
      packagingId: item.id,
      quantity: item.quantity
    }));

    this.productService.updateOfferAssignment(this.offerId, productBody, packagingBody).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
