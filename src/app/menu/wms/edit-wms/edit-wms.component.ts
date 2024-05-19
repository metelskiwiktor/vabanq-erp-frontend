import {Component, Inject, Injectable, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ProductService} from "../../../utility/service/product.service";
import {Wms} from "../wms.component";
import {DataSource} from "@angular/cdk/collections";
import {BehaviorSubject, Observable, ReplaySubject} from "rxjs";

@Component({
  selector: 'app-edit-wms',
  templateUrl: './edit-wms.component.html',
  styleUrl: './edit-wms.component.css'
})
export class EditWmsComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<EditWmsComponent>,
    private productService: ProductService,
    private dataSharingService: DataSharingService,
    @Inject(MAT_DIALOG_DATA) public wms: Wms,
  ) {
  }

  alertStock: number = this.wms.alertStock;
  currentStock: number = this.wms.currentStock;
  changedStock: number = 0;
  childrenWms: Wms[] = [];
  dataSource = new ChildrenWmsDataSource(this.childrenWms);
  displayedColumns: string[] = ['name', 'quantity', 'alertStock', 'currentStock'];
  cascadeDeleting: boolean = true;
  cascadeAdding: boolean = false;
  allegroSynchronization: boolean = true;
  showChildrenWmsForm: boolean = this.wms.childrenWms.length > 0;

  ngOnInit(): void {
    this.wms.childrenWms.forEach(value => {
      this.productService.getWmsById(value.id).subscribe(product => {
        this.childrenWms = [...this.childrenWms, product];
        this.dataSource.setData(this.childrenWms);
        console.log(this.childrenWms);
      })
    })
    this.dataSharingService.currentStock.next(this.wms.currentStock);
    this.dataSharingService.currentStock.subscribe(value => {
      this.currentStock = value;
    });
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getQuantityForChildWms(wms: Wms): number {
    return this.wms.childrenWms.filter(value => value.id == wms.id)[0].quantity;
  }

  remove() {
    let value = this.dataSharingService.currentStock.value - 1;
    this.dataSharingService.currentStock.next(value);
    this.changedStock--;
  }

  add() {
    let value = this.dataSharingService.currentStock.value + 1;
    this.dataSharingService.currentStock.next(value);
    this.changedStock++;
  }

  getCurrentStockChildWms(wms: Wms) {
    if (this.changedStock == 0) return wms.currentStock;
    let quantity = this.getQuantityForChildWms(wms);
    let currentStock = wms.currentStock + this.changedStock * quantity;
    if (currentStock > wms.currentStock && this.cascadeAdding) return currentStock + "(+" + this.changedStock * quantity + ")";
    if (currentStock < wms.currentStock && this.cascadeDeleting) return currentStock + "(" + this.changedStock * quantity + ")";
    return wms.currentStock;
  }

  submit() {
    const formData = new FormData();
    formData.append('changedStock', this.changedStock.toString());
    formData.append('alertStock', this.alertStock.toString());
    // @ts-ignore
    formData.append('cascadeAdding', this.cascadeAdding);
    // @ts-ignore
    formData.append('cascadeDeleting', this.cascadeDeleting);
    console.log(this.changedStock);
    this.productService.updateWms(this.wms.id, formData).subscribe(
    );
    this.dialogRef.close(this.changedStock != 0 || this.alertStock != this.wms.alertStock);
  }

  currentStockWms() {
    if (this.changedStock == 0) return this.currentStock;
    if (this.changedStock > 0) return this.currentStock + "(+" + this.changedStock + ")";
    if (this.changedStock < 0) return this.currentStock + "(" + this.changedStock + ")";
    return this.currentStock;
  }
}

class ChildrenWmsDataSource extends DataSource<Wms> {
  private _dataStream = new ReplaySubject<Wms[]>();

  constructor(initialData: Wms[]) {
    super();
    this.setData(initialData);
  }

  connect(): Observable<Wms[]> {
    return this._dataStream;
  }

  disconnect() {
  }

  setData(data: Wms[]) {
    this._dataStream.next(data);
  }
}

@Injectable()
export class DataSharingService {
  public currentStock: BehaviorSubject<number> = new BehaviorSubject<number>(0);
}
