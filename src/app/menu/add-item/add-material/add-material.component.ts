import {Component, Inject, inject, OnInit, Optional, TemplateRef} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {ToastService} from "../../../utility/service/toast-service";
import {ProductService} from "../../../utility/service/product.service";
import {
  AddMaterialRequest,
  FastenersAccessoryResponse, FilamentAccessoryResponse,
} from "../../../utility/model/request/add-product-request";
import {ColorEvent} from "ngx-color";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-add-material',
  templateUrl: './add-material.component.html',
  styleUrl: './add-material.component.css'
})
export class AddMaterialComponent implements OnInit {
  public form: FormGroup;
  toastService = inject(ToastService);
  isEditMode: boolean = false;
  dialogTitle: string = "Stwórz nowy materiał";
  buttonText: string = "Utwórz";
  toastSuccessMessage: string = "Pomyślnie utworzono";

  constructor(private productService: ProductService, fb: FormBuilder, @Optional() @Inject(MAT_DIALOG_DATA) public data: {material: any, type: string }, @Optional() public dialogRef: MatDialogRef<AddMaterialComponent>) {
    this.form = fb.group({
      name: [''],
      price: [''],
      description: [''],
      dimensions: [''],
      filamentType: [''],
      producer: [''],
      printTemperature: [''],
      deskTemperature: [''],
      color: ['']
    });
  }
  ngOnInit(): void {
    // Zainicjuj formularz na podstawie przekazanych danych i typu materiału
    if (this.data && this.data.type) {
      this.isEditMode = true;
      this.dialogTitle = `Edytuj materiał (ID: ${this.data.material.id})`;
      this.buttonText = "Zaktualizuj";
      this.toastSuccessMessage = "Pomyślnie zaktualizowano";
      switch (this.data.type) {
        case 'fastener':
          this.setFastenerData(this.data.material as FastenersAccessoryResponse);
          break;
        case 'filament':
          this.setFilamentData(this.data.material as FilamentAccessoryResponse);
          break;
        default:
          console.error('Nieznany typ materiału:', this.data.type);
      }
    } else {
      this.addMaterialRequest.accessoryType = 'FASTENERS';
    }
  }

  setFastenerData(fastener: FastenersAccessoryResponse): void {
    this.addMaterialRequest.name = fastener.name;
    this.addMaterialRequest.price = fastener.netPricePerQuantity;
    this.addMaterialRequest.description = fastener.description;
    this.addMaterialRequest.accessoryType = "FASTENERS";
  }

  // Ustaw dane dla filament
  setFilamentData(filament: FilamentAccessoryResponse): void {
    this.addMaterialRequest.name = filament.name;
    this.addMaterialRequest.producer = filament.producer;
    this.addMaterialRequest.filamentType = filament.filamentType;
    this.addMaterialRequest.temperaturePrint = filament.printTemperature.toString();
    this.addMaterialRequest.temperatureDesk = filament.deskTemperature.toString();
    this.addMaterialRequest.price = filament.pricePerKg;
    this.addMaterialRequest.color = filament.color;
    this.addMaterialRequest.description = filament.description;
    this.showFilamentOptions = true;
    this.addMaterialRequest.accessoryType = "FILAMENT";
  }


  addMaterialRequest = new AddMaterialRequest();

  accessoryTypes = [
    { translation: 'Filament', name: 'FILAMENT' },
    { translation: 'Elementy złączne', name: 'FASTENERS' },
  ];
  filamentTypes = [
    "PLA", "PETG", "ASA", "ABS", "PLA+", "Nylon", "TPU"
  ]
  packageSize = [
    "A", "B", "C"
  ]
  showFilamentOptions: boolean = false;

  onMaterialsChange($event: any) {
    this.showFilamentOptions = $event.name === 'FILAMENT';
    this.addMaterialRequest.accessoryType = $event.name;
  }

  handleChange($event: ColorEvent) {
    this.addMaterialRequest.color = $event.color.hex;
  }

  showSuccess(template: TemplateRef<any>) {
    this.toastService.show({ template, classname: 'bg-success text-light', delay: 2000, text: this.toastSuccessMessage });
  }

  showError(template: TemplateRef<any>, errorMessage: string) {
    this.toastService.show({ template, classname: 'bg-danger text-light', delay: 4000, text: errorMessage });
  }

  onMaterialSubmit(successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    let requestPayload;
    let materialId = this.data?.material?.id; // ID materiału, jeśli edytujemy

    switch (this.addMaterialRequest.accessoryType) {
      case 'FILAMENT':
        requestPayload = {
          name: this.addMaterialRequest.name,
          producer: this.addMaterialRequest.producer,
          filamentType: this.addMaterialRequest.filamentType,
          printTemperature: this.addMaterialRequest.temperaturePrint,
          deskTemperature: this.addMaterialRequest.temperatureDesk,
          pricePerKg: this.addMaterialRequest.price,
          color: this.addMaterialRequest.color,
          description: this.addMaterialRequest.description,
          quantity: this.addMaterialRequest.quantity
        };

        if (this.isEditMode && materialId) {
          this.productService.updateFilament(materialId, requestPayload).subscribe(
            response => {
              this.showSuccess(successTpl);
              console.log('Filament updated!', response);
              this.dialogRef.close(response);
            },
            error => {
              this.showError(errorTpl, error.error.message || 'Nieznany błąd');
              console.error('Error occurred:', error);
            }
          );
        } else {
          this.productService.addFilament(requestPayload).subscribe(
            response => {
              this.showSuccess(successTpl);
              console.log('Filament added!', response);
              this.resetForm();
            },
            error => {
              this.showError(errorTpl, error.error.message || 'Nieznany błąd');
              console.error('Error occurred:', error);
            }
          );
        }
        break;

      case 'FASTENERS':
        requestPayload = {
          name: this.addMaterialRequest.name,
          netPricePerQuantity: this.addMaterialRequest.price,
          quantity: this.addMaterialRequest.quantity,
          description: this.addMaterialRequest.description
        };

        if (this.isEditMode && materialId) {
          this.productService.updateFasteners(materialId, requestPayload).subscribe(
            response => {
              this.showSuccess(successTpl);
              console.log('Fasteners updated!', response);
              this.dialogRef.close(response);
            },
            error => {
              this.showError(errorTpl, error.error.message || 'Nieznany błąd');
              console.error('Error occurred:', error);
            }
          );
        } else {
          this.productService.addFasteners(requestPayload).subscribe(
            response => {
              this.showSuccess(successTpl);
              console.log('Fasteners added!', response);
              this.resetForm();
            },
            error => {
              this.showError(errorTpl, error.error.message || 'Nieznany błąd');
              console.error('Error occurred:', error);
            }
          );
        }
        break;

      default:
        this.showError(errorTpl, "Nieprawidłowe dane" || 'Nieznany błąd');
        console.error('Unknown accessory type');
    }
  }

  resetForm() {
    this.addMaterialRequest = new AddMaterialRequest();  // Reset the request object
    this.form.reset();  // Reset the form
  }
}
