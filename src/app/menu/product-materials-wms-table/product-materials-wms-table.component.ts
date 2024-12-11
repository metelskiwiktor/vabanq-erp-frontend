import {Component, OnInit} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {ProductService} from '../../utility/service/product.service';
import {AddProductComponent} from '../add-item/add-product/add-product.component';
import {AddMaterialComponent} from '../add-item/add-material/add-material.component';

interface WmsItem {
  type: 'product' | 'filament' | 'package' | 'fastener';
  id: string;
  name: string;
  wms: { enabled: boolean; quantity: number; criticalStock: number };
  fullObject?: any; // Stores the full product or material object
}

@Component({
  selector: 'app-product-materials-wms-table',
  templateUrl: './product-materials-wms-table.component.html',
  styleUrls: ['./product-materials-wms-table.component.css'],
})
export class ProductMaterialsWmsTableComponent implements OnInit {
  displayedColumns = ['name', 'enabled', 'quantity', 'criticalStock', 'actions'];
  productDataSource = new MatTableDataSource<WmsItem>();
  materialDataSource = new MatTableDataSource<WmsItem>();
  filteredProductDataSource = new MatTableDataSource<WmsItem>();
  filteredMaterialDataSource = new MatTableDataSource<WmsItem>();

  editForm: { [key: string]: FormGroup } = {};

  // Filtrowanie
  productFilter: string = '';
  materialFilter: string = '';
  availableTags: string[] = [];
  selectedTags: string[] = [];

  constructor(private productService: ProductService, private fb: FormBuilder, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.productService.getProducts().subscribe((products) => {
      const productItems: WmsItem[] = products.map((p) => ({
        type: 'product',
        id: p.id,
        name: p.name,
        wms: p.wms,
        fullObject: p,
      }));

      this.productDataSource.data = productItems;
      this.filteredProductDataSource.data = productItems; // Set filtered data
      this.extractTags(products);
      productItems.forEach((item) => this.createEditForm(item));

      this.productService.getMaterials().subscribe((materials) => {
        const materialItems: WmsItem[] = [];
        materials.filaments.forEach((f) =>
          materialItems.push({
            type: 'filament',
            id: f.id,
            name: f.name,
            wms: f.wms,
            fullObject: f,
          })
        );
        materials.packages.forEach((p) =>
          materialItems.push({
            type: 'package',
            id: p.id,
            name: p.name,
            wms: p.wms,
            fullObject: p,
          })
        );
        materials.fasteners.forEach((f) =>
          materialItems.push({
            type: 'fastener',
            id: f.id,
            name: f.name,
            wms: f.wms,
            fullObject: f,
          })
        );

        this.materialDataSource.data = materialItems;
        this.filteredMaterialDataSource.data = materialItems; // Set filtered data
        materialItems.forEach((item) => this.createEditForm(item));
      });
    });
  }

  applyProductFilter() {
    const filterValue = this.productFilter.trim().toLowerCase();
    this.filteredProductDataSource.data = this.productDataSource.data.filter((item) =>
      item.name.toLowerCase().includes(filterValue) &&
      (this.selectedTags.length === 0 || item.fullObject.tags.some((tag: string) => this.selectedTags.includes(tag)))
    );
  }

  applyMaterialFilter() {
    const filterValue = this.materialFilter.trim().toLowerCase();
    this.filteredMaterialDataSource.data = this.materialDataSource.data.filter((item) =>
      item.name.toLowerCase().includes(filterValue)
    );
  }

  extractTags(products: any[]) {
    const allTags = products.flatMap((product) => product.tags);
    this.availableTags = Array.from(new Set(allTags));
  }

  createEditForm(item: WmsItem) {
    this.editForm[item.id] = this.fb.group({
      enabled: [item.wms.enabled],
      quantity: [item.wms.quantity],
      criticalStock: [item.wms.criticalStock],
    });
  }

  saveWms(item: WmsItem) {
    const wms = this.editForm[item.id].value;
    if(item.type==='product') this.productService.updateWmsProduct(item.id,wms).subscribe(()=>this.loadData());
    if(item.type==='filament') this.productService.updateWmsFilamentAccessory(item.id,wms).subscribe(()=>this.loadData());
    if(item.type==='package') this.productService.updateWmsPackagingAccessory(item.id,wms).subscribe(()=>this.loadData());
    if(item.type==='fastener') this.productService.updateWmsFastenersAccessory(item.id,wms).subscribe(()=>this.loadData());
  }

  previewProduct(productId: string): void {
    const selectedProduct = this.productDataSource.data.find((item) => item.id === productId)?.fullObject;
    if (selectedProduct) {
      const dialogRef = this.dialog.open(AddProductComponent, {
        data: {
          product: selectedProduct, // Pass the full product object
          viewMode: true,
        },
        width: '80%',
        maxHeight: '90vh',
      });

      dialogRef.afterClosed().subscribe(() => this.loadData());
    }
  }

  previewMaterial(materialId: string): void {
    const selectedMaterial = this.materialDataSource.data.find((item) => item.id === materialId);
    if (selectedMaterial) {
      const dialogRef = this.dialog.open(AddMaterialComponent, {
        data: {
          material: selectedMaterial.fullObject, // Pass the full material object
          type: selectedMaterial.type, // Pass the type dynamically
        },
        width: '80%',
        maxHeight: '90vh',
      });

      dialogRef.afterClosed().subscribe(() => this.loadData());
    }
  }


  getControl(id: string, controlName: string): FormControl {
    return this.editForm[id]?.get(controlName) as FormControl;
  }
}
