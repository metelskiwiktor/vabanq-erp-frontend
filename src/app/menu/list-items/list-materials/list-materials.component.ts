import {AfterViewInit, Component, inject, OnInit, ViewChild} from '@angular/core';
import {trigger, state, style, transition, animate} from '@angular/animations';
import {MatTableDataSource} from '@angular/material/table';
import {ProductService} from "../../../utility/service/product.service";
import {
  GroupedAccessoriesResponse, FastenersAccessoryResponse,
  FilamentAccessoryResponse, PackagingAccessoryResponse,
} from "../../../utility/model/request/add-product-request";
import {AddMaterialComponent} from "../../add-item/add-material/add-material.component";
import {MatDialog} from "@angular/material/dialog";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-list-materials',
  templateUrl: './list-materials.component.html',
  styleUrls: ['./list-materials.component.css'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class ListMaterialsComponent implements OnInit, AfterViewInit {
  fastenersDataSource = new MatTableDataSource<FastenersAccessoryResponse>();
  filamentsDataSource = new MatTableDataSource<FilamentAccessoryResponse>();
  packagesDataSource = new MatTableDataSource<PackagingAccessoryResponse>();

  displayedColumnsFasteners: string[] = ['name', 'pricePerQuantity', 'description', 'actions'];
  displayedColumnsFilaments: string[] = ['name', 'producer', 'filamentType', 'printTemperature', 'deskTemperature', 'pricePerKg', 'color', 'description', 'actions'];
  displayedColumnsPackages: string[] = ['name', 'packagingSize', 'dimensions', 'pricePerQuantity', 'description', 'actions'];

  // Global search
  globalSearchTerm: string = '';
  
  // Category-specific filters
  fastenersFilter: string = '';
  filamentsFilter: string = '';
  packagesFilter: string = '';
  
  // Filter toggles
  showFastenersFilters: boolean = false;
  showFilamentsFilters: boolean = false;
  showPackagesFilters: boolean = false;
  
  // View mode
  viewMode: 'cards' | 'table' = 'cards';
  
  // Statistics
  totalFasteners: number = 0;
  totalFilaments: number = 0;
  totalPackages: number = 0;
  
  // Original data for filtering
  originalFasteners: FastenersAccessoryResponse[] = [];
  originalFilaments: FilamentAccessoryResponse[] = [];
  originalPackages: PackagingAccessoryResponse[] = [];
  
  // Filament filter options
  uniqueProducers: string[] = [];
  uniqueFilamentTypes: string[] = [];
  selectedProducer: string = '';
  selectedFilamentType: string = '';
  temperatureRange: { min: number, max: number } = { min: 0, max: 300 };
  priceRange: { min: number, max: number } = { min: 0, max: 1000 };

  @ViewChild('sortFasteners') sortFasteners!: MatSort;
  @ViewChild('sortFilaments') sortFilaments!: MatSort;
  @ViewChild('sortPackages') sortPackages!: MatSort;

  constructor(private productService: ProductService, private dialog: MatDialog) {
  }

  ngAfterViewInit(): void {
    this.fastenersDataSource.sort = this.sortFasteners;
    this.filamentsDataSource.sort = this.sortFilaments;
    this.packagesDataSource.sort = this.sortPackages;
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.productService.getMaterials().subscribe((response: GroupedAccessoriesResponse) => {
      this.originalFasteners = response.fasteners || [];
      this.originalFilaments = response.filaments || [];
      this.originalPackages = response.packages || [];
      
      this.fastenersDataSource.data = this.originalFasteners;
      this.filamentsDataSource.data = this.originalFilaments;
      this.packagesDataSource.data = this.originalPackages;
      
      // Update statistics
      this.totalFasteners = this.originalFasteners.length;
      this.totalFilaments = this.originalFilaments.length;
      this.totalPackages = this.originalPackages.length;
      
      // Extract unique values for filters
      this.extractFilterOptions();
    });

    this.fastenersDataSource.sort = this.sortFasteners;
    this.filamentsDataSource.sort = this.sortFilaments;
    this.packagesDataSource.sort = this.sortPackages;
  }

  applyGlobalFilter() {
    const searchTerm = this.globalSearchTerm.trim().toLowerCase();
    
    // Filter fasteners
    this.fastenersDataSource.data = this.originalFasteners.filter(item => 
      item.name?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    );
    
    // Filter filaments
    this.filamentsDataSource.data = this.originalFilaments.filter(item => 
      item.name?.toLowerCase().includes(searchTerm) ||
      item.producer?.toLowerCase().includes(searchTerm) ||
      item.filamentType?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    );
    
    // Filter packages
    this.packagesDataSource.data = this.originalPackages.filter(item => 
      item.name?.toLowerCase().includes(searchTerm) ||
      item.packagingSize?.toLowerCase().includes(searchTerm) ||
      item.dimensions?.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    );
  }
  
  applyCategoryFilter(category: 'fasteners' | 'filaments' | 'packages') {
    switch(category) {
      case 'fasteners':
        const fastenersSearchTerm = this.fastenersFilter.trim().toLowerCase();
        this.fastenersDataSource.data = this.originalFasteners.filter(item => 
          item.name?.toLowerCase().includes(fastenersSearchTerm) ||
          item.description?.toLowerCase().includes(fastenersSearchTerm)
        );
        break;
        
      case 'filaments':
        this.filterFilaments();
        break;
        
      case 'packages':
        const packagesSearchTerm = this.packagesFilter.trim().toLowerCase();
        this.packagesDataSource.data = this.originalPackages.filter(item => 
          item.name?.toLowerCase().includes(packagesSearchTerm) ||
          item.packagingSize?.toLowerCase().includes(packagesSearchTerm) ||
          item.dimensions?.toLowerCase().includes(packagesSearchTerm) ||
          item.description?.toLowerCase().includes(packagesSearchTerm)
        );
        break;
    }
  }
  
  filterFilaments() {
    let filteredFilaments = this.originalFilaments;
    
    // Apply search term filter
    if (this.filamentsFilter.trim()) {
      const searchTerm = this.filamentsFilter.trim().toLowerCase();
      filteredFilaments = filteredFilaments.filter(item => 
        item.name?.toLowerCase().includes(searchTerm) ||
        item.producer?.toLowerCase().includes(searchTerm) ||
        item.filamentType?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply producer filter
    if (this.selectedProducer) {
      filteredFilaments = filteredFilaments.filter(item => item.producer === this.selectedProducer);
    }
    
    // Apply filament type filter
    if (this.selectedFilamentType) {
      filteredFilaments = filteredFilaments.filter(item => item.filamentType === this.selectedFilamentType);
    }
    
    // Apply temperature range filter
    filteredFilaments = filteredFilaments.filter(item => {
      const printTemp = parseInt(item.printTemperature?.toString() || '0');
      return printTemp >= this.temperatureRange.min && printTemp <= this.temperatureRange.max;
    });
    
    // Apply price range filter
    filteredFilaments = filteredFilaments.filter(item => {
      const price = parseFloat(item.pricePerKg?.toString() || '0');
      return price >= this.priceRange.min && price <= this.priceRange.max;
    });
    
    this.filamentsDataSource.data = filteredFilaments;
  }
  
  extractFilterOptions() {
    // Extract unique producers and filament types
    this.uniqueProducers = [...new Set(this.originalFilaments.map(f => f.producer).filter(p => p))];
    this.uniqueFilamentTypes = [...new Set(this.originalFilaments.map(f => f.filamentType).filter(t => t))];
    
    // Set temperature range based on data
    const temperatures = this.originalFilaments
      .map(f => parseInt(f.printTemperature?.toString() || '0'))
      .filter(t => t > 0);
    if (temperatures.length > 0) {
      this.temperatureRange.min = Math.min(...temperatures);
      this.temperatureRange.max = Math.max(...temperatures);
    }
    
    // Set price range based on data
    const prices = this.originalFilaments
      .map(f => parseFloat(f.pricePerKg?.toString() || '0'))
      .filter(p => p > 0);
    if (prices.length > 0) {
      this.priceRange.min = Math.min(...prices);
      this.priceRange.max = Math.max(...prices);
    }
  }
  
  clearFilters() {
    this.globalSearchTerm = '';
    this.fastenersFilter = '';
    this.filamentsFilter = '';
    this.packagesFilter = '';
    this.selectedProducer = '';
    this.selectedFilamentType = '';
    
    // Reset data sources
    this.fastenersDataSource.data = this.originalFasteners;
    this.filamentsDataSource.data = this.originalFilaments;
    this.packagesDataSource.data = this.originalPackages;
  }
  
  getFilteredCount(category: 'fasteners' | 'filaments' | 'packages'): number {
    switch(category) {
      case 'fasteners': return this.fastenersDataSource.data.length;
      case 'filaments': return this.filamentsDataSource.data.length;
      case 'packages': return this.packagesDataSource.data.length;
      default: return 0;
    }
  }
  
  toggleViewMode() {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  editFastenerDialog(element: FastenersAccessoryResponse): void {
    this.openEditDialog(element, 'fastener');
  }

  editFilamentDialog(element: FilamentAccessoryResponse): void {
    this.openEditDialog(element, 'filament');
  }

  editPackageDialog(element: PackagingAccessoryResponse): void {
    this.openEditDialog(element, 'package');
  }

  openEditDialog(element: any, type: string): void {
    const dialogRef = this.dialog.open(AddMaterialComponent, {
      data: {material: element, type: type},
      maxHeight: '80vh',
      width: '80%',
      hasBackdrop: true,
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Logika po zamknięciu dialogu, np. aktualizacja danych
      }
      this.fetchData();
    });
  }

  // Funkcja usunięcia elementu
  deleteElement(element: any): void {
    // Implementacja usunięcia, np. wywołanie serwisu API
    console.log('Usunięto element:', element);
  }
}
