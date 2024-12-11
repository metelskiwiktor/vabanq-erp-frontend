import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
interface WmsData {
  enabled: boolean;
  quantity: number;
  criticalStock: number;
}

interface ChangedItem {
  item: {
    type: 'product'|'filament'|'package'|'fastener';
    name: string;
    originalWms: WmsData;
  };
  changes: Partial<WmsData>;
}

@Component({
  selector: 'app-summary-dialog',
  templateUrl: './summary-dialog.component.html',
  styleUrl: './summary-dialog.component.css'
})
export class SummaryDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { changedItems: ChangedItem[] },
    public dialogRef: MatDialogRef<SummaryDialogComponent>
  ) {}
}
