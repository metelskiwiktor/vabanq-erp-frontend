import {Component, OnInit} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {ProductService} from "../../utility/service/product.service";
import {MatDialog} from "@angular/material/dialog";
import {EditWmsComponent} from "./edit-wms/edit-wms.component";
import {LocalStorageService} from "../../local-storage.service";

export interface Wms {
  id: string;
  name: string;
  currentStock: number;
  alertStock: number;
  childrenWms: {
    id: string,
    quantity: number
  }[]
}

@Component({
  selector: 'app-wms',
  templateUrl: './wms.component.html',
  styleUrl: './wms.component.css'
})
export class WmsComponent implements OnInit {
  displayedColumns: string[] = ['name', 'alertStock', 'currentStock', 'action'];
  // dataSource: Wms[] = [];
  dataSource = new MatTableDataSource<Wms[]>();

  // @ViewChild(MatTable) table: MatTable<Wms> | undefined;

  constructor(private productService: ProductService, public dialog: MatDialog, private localStorageService: LocalStorageService) {
  }

  ngOnInit(): void {
    this.productService.getAllWms().subscribe(
      (response: any[]) => {
        this.updateDataSource(response);
      }
    )
  }


  edit(wms: Wms) {
    const dialogRef = this.dialog.open(EditWmsComponent, {
      data: wms,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.getAllWms().subscribe(
          (response: any[]) => {
            this.updateDataSource(response);
          }
        )
      }
    });
  }

  delete(wms: Wms) {

  }

  startSynchronize() {
    this.productService.startSynchronization(this.localStorageService.getItem('allegro-token')!).subscribe(
      response => {
        this.productService.getAllWms().subscribe(
          (response: any[]) => {
            this.updateDataSource(response);
          }
        )
      }
    )
  }

  updateDataSource(newData: any[]) {
    newData.sort((a, b) => a.name.localeCompare(b.name));
    this.dataSource.data = newData;
  }
}
