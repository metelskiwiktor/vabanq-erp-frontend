import {AfterViewInit, Component, inject, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {ProductService} from "../../../utility/service/product.service";
import {
  GroupedAccessoriesResponse, FastenersAccessoryResponse,
  FilamentAccessoryResponse,
} from "../../../utility/model/request/add-product-request";
import {AddMaterialComponent} from "../../add-item/add-material/add-material.component";
import {MatDialog} from "@angular/material/dialog";
import {MatSort} from "@angular/material/sort";

@Component({
  selector: 'app-list-materials',
  templateUrl: './list-materials.component.html',
  styleUrls: ['./list-materials.component.css']
})
export class ListMaterialsComponent implements OnInit, AfterViewInit {
  fastenersDataSource = new MatTableDataSource<FastenersAccessoryResponse>();
  filamentsDataSource = new MatTableDataSource<FilamentAccessoryResponse>();

  displayedColumnsFasteners: string[] = ['name', 'netPricePerQuantity', 'description', 'actions'];
  displayedColumnsFilaments: string[] = ['name', 'producer', 'filamentType', 'printTemperature', 'deskTemperature', 'pricePerKg', 'color', 'description', 'actions'];

  filterValue: string = '';

  @ViewChild('sortFasteners') sortFasteners!: MatSort;
  @ViewChild('sortFilaments') sortFilaments!: MatSort;

  constructor(private productService: ProductService, private dialog: MatDialog) {
  }

  ngAfterViewInit(): void {
    this.fastenersDataSource.sort = this.sortFasteners;
    this.filamentsDataSource.sort = this.sortFilaments;
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.productService.getMaterials().subscribe((response: GroupedAccessoriesResponse) => {
      this.fastenersDataSource.data = response.fasteners;
      this.filamentsDataSource.data = response.filaments;
    });

    this.fastenersDataSource.sort = this.sortFasteners;
    this.filamentsDataSource.sort = this.sortFilaments;
  }

  applyFilter() {
    const filterValue = this.filterValue.trim().toLowerCase();
    this.fastenersDataSource.filter = filterValue;
    this.filamentsDataSource.filter = filterValue;
  }

  editFastenerDialog(element: FastenersAccessoryResponse): void {
    this.openEditDialog(element, 'fastener');
  }

  editFilamentDialog(element: FilamentAccessoryResponse): void {
    this.openEditDialog(element, 'filament');
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
