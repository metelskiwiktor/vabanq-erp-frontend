import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ProductService } from "../../../utility/service/product.service";
import {MatTableDataSource} from "@angular/material/table";
import { PackagingAccessoryResponse } from "../../../utility/model/request/add-product-request";

interface ProductQuantityRequest {
  productId: string;
  quantity: number;
}

interface ProductItem {
  id: string;
  name: string;
  ean: string;
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
  allProducts: ProductItem[] = [];
  packagingOptions: PackagingAccessoryResponse[] = [];
  selectedPackaging: PackagingAccessoryResponse | null = null;
  displayedColumns: string[] = ['name', 'quantity', 'actions'];
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

      // Set selected packaging if it exists in the offer
      if (this.data.offer.packaging && this.data.offer.packaging.id) {
        const packagingId = this.data.offer.packaging.id;
        this.selectedPackaging = this.packagingOptions.find(p => p.id === packagingId) || null;
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
  }

  onProductChange(selected: ProductItem[]) {
    // Synchronize selected products with assignedItems
    const selectedIds = selected.map(p => p.id);

    // Add new items to assignedItems
    selected.forEach(item => {
      if (!this.assignedItems.data.find(p => p.id === item.id)) {
        this.assignedItems.data = [
          ...this.assignedItems.data,
          { ...item, quantity: item.quantity || 1 }
        ];
      }
    });

    this.assignedItems.data = this.assignedItems.data.filter(item =>
      selectedIds.includes(item.id)
    );
  }


  removeItem(row: ProductItem) {
    this.assignedItems.data = this.assignedItems.data.filter(item => item.id !== row.id);

    this.selectedProducts = this.selectedProducts.filter(item => item.id !== row.id);
  }

  addQuantity(row: ProductItem) {
    row.quantity++;
  }

  subtractQuantity(row: ProductItem) {
    if (row.quantity > 1) row.quantity--;
  }

  onSave() {
    const body: ProductQuantityRequest[] = this.assignedItems.data.map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    // Prepare packaging data if selected
    let packagingData: { id: string, name: string } | undefined = undefined;
    if (this.selectedPackaging) {
      packagingData = {
        id: this.selectedPackaging.id,
        name: this.selectedPackaging.name
      };
    }

    this.productService.updateOfferAssignment(this.offerId, body, packagingData).subscribe(() => {
      this.dialogRef.close(true);
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
