import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ProductService } from '../../utility/service/product.service';
import { AddProductComponent } from '../add-item/add-product/add-product.component';
import { AddMaterialComponent } from '../add-item/add-material/add-material.component';
import {SummaryDialogComponent} from "../summary-dialog/summary-dialog.component";
import {MatSort} from "@angular/material/sort";

interface WmsData {
  enabled: boolean;
  quantity: number;
  criticalStock: number;
}

interface WmsItem {
  [key: string]: any; // Dodaje dynamiczne klucze
  type: 'product' | 'filament' | 'package' | 'fastener';
  id: string;
  name: string;
  wms: WmsData;
  fullObject?: any;
  originalWms: WmsData;
}

@Component({
  selector: 'app-product-materials-wms-table',
  templateUrl: './product-materials-wms-table.component.html',
  styleUrls: ['./product-materials-wms-table.component.css'],
})
export class ProductMaterialsWmsTableComponent implements OnInit, AfterViewInit {
  @ViewChild('productSort') productSort!: MatSort;
  @ViewChild('materialSort') materialSort!: MatSort;
  displayedColumns = ['name', 'enabled', 'quantity', 'criticalStock', 'percentCriticalStock'];
  productDataSource = new MatTableDataSource<WmsItem>();
  materialDataSource = new MatTableDataSource<WmsItem>();
  filteredProductDataSource = new MatTableDataSource<WmsItem>();
  filteredMaterialDataSource = new MatTableDataSource<WmsItem>();

  editForm: { [key: string]: FormGroup } = {};

  productFilter: string = '';
  materialFilter: string = '';
  availableTags: string[] = [];
  selectedTags: string[] = [];

  selectedMaterialType: string = '';

  constructor(private productService: ProductService, private fb: FormBuilder, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.filteredProductDataSource.sortingDataAccessor = (item: WmsItem, property: keyof WmsItem | 'percentCriticalStock') => {
      switch (property) {
        case 'percentCriticalStock':
          return this.calculateCriticalStockPercentage(item.wms.quantity, item.wms.criticalStock);
        case 'enabled':
          return item.wms.enabled ? 1 : 0;
        case 'name':
          return item.name.toLowerCase();
        case 'quantity':
          return item.wms.quantity;
        case 'criticalStock':
          return item.wms.criticalStock;
        default:
          return (item as any)[property];
      }
    };

    this.filteredProductDataSource.sort = this.productSort;
    this.productSort.active = 'enabled';
    this.productSort.direction = 'desc';
    this.filteredProductDataSource.data = this.filteredProductDataSource.data
      .sort((a, b) => {
        const enabledDiff = (b.wms.enabled ? 1 : 0) - (a.wms.enabled ? 1 : 0);
        if (enabledDiff !== 0) return enabledDiff;
        return a.name.localeCompare(b.name);
      });

    this.filteredMaterialDataSource.sortingDataAccessor = (item: WmsItem, property: keyof WmsItem | 'percentCriticalStock') => {
      switch (property) {
        case 'percentCriticalStock':
          return this.calculateCriticalStockPercentage(item.wms.quantity, item.wms.criticalStock);
        case 'enabled':
          return item.wms.enabled ? 1 : 0;
        case 'name':
          return item.name.toLowerCase();
        case 'quantity':
          return item.wms.quantity;
        case 'criticalStock':
          return item.wms.criticalStock;
        default:
          return (item as any)[property];
      }
    };

    this.filteredMaterialDataSource.sort = this.materialSort;
    this.materialSort.active = 'enabled';
    this.materialSort.direction = 'desc';
    this.filteredMaterialDataSource.data = this.filteredMaterialDataSource.data
      .sort((a, b) => {
        const enabledDiff = (b.wms.enabled ? 1 : 0) - (a.wms.enabled ? 1 : 0);
        if (enabledDiff !== 0) return enabledDiff;
        return a.name.localeCompare(b.name);
      });
  }

  loadData() {
    this.productService.getProducts().subscribe((products) => {
      const productItems: WmsItem[] = products.map((p) => ({
        type: 'product',
        id: p.id,
        name: p.name,
        wms: p.wms,
        fullObject: p,
        originalWms: {...p.wms}
      }));

      this.productDataSource.data = productItems;
      this.filteredProductDataSource.data = productItems;
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
            originalWms: {...f.wms}
          })
        );
        materials.packages.forEach((p) =>
          materialItems.push({
            type: 'package',
            id: p.id,
            name: p.name,
            wms: p.wms,
            fullObject: p,
            originalWms: {...p.wms}
          })
        );
        materials.fasteners.forEach((f) =>
          materialItems.push({
            type: 'fastener',
            id: f.id,
            name: f.name,
            wms: f.wms,
            fullObject: f,
            originalWms: {...f.wms}
          })
        );

        this.materialDataSource.data = materialItems;
        this.filteredMaterialDataSource.data = materialItems;
        materialItems.forEach((item) => this.createEditForm(item));
      });
    });
  }

  applyProductFilter() {
    const filterValue = this.productFilter.trim().toLowerCase();
    this.filteredProductDataSource.data = this.productDataSource.data.filter((item) =>
      item.name.toLowerCase().includes(filterValue) &&
      (this.selectedTags.length === 0 || (item.fullObject?.tags || []).some((tag: string) => this.selectedTags.includes(tag)))
    );
  }

  applyMaterialFilter() {
    const filterValue = this.materialFilter.trim().toLowerCase();

    this.filteredMaterialDataSource.data = this.materialDataSource.data.filter((item) => {
      const matchesNameFilter = item.name.toLowerCase().includes(filterValue);
      const matchesTypeFilter = !this.selectedMaterialType || item.type === this.selectedMaterialType;

      return matchesNameFilter && matchesTypeFilter;
    });
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

  getControl(id: string, controlName: string): FormControl {
    return this.editForm[id]?.get(controlName) as FormControl;
  }

  previewProduct(productId: string): void {
    const selectedProduct = this.productDataSource.data.find((item) => item.id === productId)?.fullObject;
    if (selectedProduct) {
      const dialogRef = this.dialog.open(AddProductComponent, {
        data: {
          product: selectedProduct,
          viewMode: true,
        },
        maxHeight: '90vh',
        width: '80%',
        hasBackdrop: true,
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe(() => this.loadData());
    }
  }

  previewMaterial(materialId: string): void {
    const selectedMaterial = this.materialDataSource.data.find((item) => item.id === materialId);
    if (selectedMaterial) {
      const dialogRef = this.dialog.open(AddMaterialComponent, {
        data: {
          material: selectedMaterial.fullObject,
          type: selectedMaterial.type,
          viewMode: true
        },
        maxHeight: '80vh',
        width: '80%',
        hasBackdrop: true,
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe(() => this.loadData());
    }
  }

  // Funkcja wywoływana po kliknięciu "Wprowadź zmiany"
  openChangeSummaryDialog() {
    const changedItems = this.getChangedItems();

    const dialogRef = this.dialog.open(SummaryDialogComponent, {
      data: {
        changedItems: changedItems
      },
      maxHeight: '90vh',
      width: '80%',
      height: 'auto',
      hasBackdrop: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result === 'save') {
        this.saveAllChanges(changedItems);
      }
    });
  }

  // Pobierz listę zmienionych pozycji wraz z różnicami
  getChangedItems() {
    const changed: {item: WmsItem, changes: Partial<WmsData>}[] = [];
    [...this.productDataSource.data, ...this.materialDataSource.data].forEach(item => {
      const current = this.editForm[item.id].value as WmsData;
      const original = item.originalWms;
      const diff: Partial<WmsData> = {};

      if(current.enabled !== original.enabled) diff.enabled = current.enabled;
      if(current.quantity !== original.quantity) diff.quantity = current.quantity;
      if(current.criticalStock !== original.criticalStock) diff.criticalStock = current.criticalStock;

      if(Object.keys(diff).length > 0) {
        changed.push({item, changes: diff});
      }
    });
    return changed;
  }

  // Po kliknięciu "Zapisz" w dialogu wysyłamy requesty
  saveAllChanges(changed: {item: WmsItem, changes: Partial<WmsData>}[]) {
    const requests = changed.map(ch => {
      const wms = {
        enabled: this.editForm[ch.item.id].get('enabled')!.value,
        quantity: this.editForm[ch.item.id].get('quantity')!.value,
        criticalStock: this.editForm[ch.item.id].get('criticalStock')!.value
      };
      if(ch.item.type==='product') return this.productService.updateWmsProduct(ch.item.id,wms);
      if(ch.item.type==='filament') return this.productService.updateWmsFilamentAccessory(ch.item.id,wms);
      if(ch.item.type==='package') return this.productService.updateWmsPackagingAccessory(ch.item.id,wms);
      if(ch.item.type==='fastener') return this.productService.updateWmsFastenersAccessory(ch.item.id,wms);
      return null;
    }).filter(r => r !== null);

    if(requests.length > 0) {
      Promise.all(requests.map(r => r!.toPromise())).then(() => {
        this.loadData();
      });
    }
  }

  calculateCriticalStockPercentage(quantity: number, criticalStock: number): number {
    if (criticalStock === 0) {
      return 0;
    }
    return (criticalStock / quantity) * 100;
  }
}
