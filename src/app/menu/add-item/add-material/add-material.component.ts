import {Component, inject, OnInit, TemplateRef} from '@angular/core';
import {FormBuilder, FormGroup} from "@angular/forms";
import {ToastService} from "../../../utility/service/toast-service";
import {ProductService} from "../../../utility/service/product.service";
import {Router} from "@angular/router";
import {AddMaterialRequest} from "../../../utility/model/request/add-product-request";
import {ColorEvent} from "ngx-color";

@Component({
  selector: 'app-add-material',
  templateUrl: './add-material.component.html',
  styleUrl: './add-material.component.css'
})
export class AddMaterialComponent implements OnInit {
  public form: FormGroup;
  toastService = inject(ToastService);

  constructor(private productService: ProductService, fb: FormBuilder, private router: Router) {
    this.form = fb.group({
      phone: [''],
      tuut: ['']
    });
  }

  ngOnInit(): void {
  }

  displayedColumns: string[] = ['name', 'type', 'price', 'q'];
  addMaterialRequest = new AddMaterialRequest();

  accessoryTypes = [
    { translation: 'Filament', name: 'FILAMENT' },
    { translation: 'Kartony', name: 'PACKAGING' },
    { translation: 'Elementy złączne', name: 'FASTENERS' },
  ];
  filamentTypes = [
    "PLA", "PETG", "ASA", "ABS", "PLA+", "Nylon", "TPU"
  ]
  packageSize = [
    "A", "B", "C"
  ]
  showFilamentOptions: boolean = false;
  showPackageOptions: boolean = false;

  onMaterialsChange($event: any) {
    this.showFilamentOptions = $event.name === 'FILAMENT';
    this.showPackageOptions = $event.name === 'PACKAGING';
    this.addMaterialRequest.accessoryType = $event.name;
  }

  handleChange($event: ColorEvent) {
    this.addMaterialRequest.color = $event.color.hex;
  }

  showSuccess(template: TemplateRef<any>) {
    this.toastService.show({ template, classname: 'bg-success text-light', delay: 2000, text: "Pomyślnie utworzono" });
  }

  showError(template: TemplateRef<any>, errorMessage: string) {
    this.toastService.show({ template, classname: 'bg-danger text-light', delay: 4000, text: errorMessage });
  }

  onMaterialSubmit(successTpl: TemplateRef<any>, errorTpl: TemplateRef<any>) {
    let requestPayload;
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
        this.productService.addFilament(requestPayload).subscribe(
          response => {
            this.showSuccess(successTpl);
            console.log('Filament added!', response);
            this.resetForm();
          },
          error => {
            this.showError(errorTpl, error.error.message || 'Nieznany błąd');
            console.error('Error occurred:', error)
          }
        );
        break;
      case 'PACKAGING':
        requestPayload = {
          name: this.addMaterialRequest.name,
          packagingSize: this.addMaterialRequest.packagingSize,
          dimensions: this.addMaterialRequest.dimensions,
          netPricePerQuantity: this.addMaterialRequest.price,
          quantity: this.addMaterialRequest.quantity,
          description: this.addMaterialRequest.description
        };
        this.productService.addPackaging(requestPayload).subscribe(
          response => {
            this.showSuccess(successTpl);
            console.log('Packaging added!', response);
            this.resetForm();
          },
          error => {
            this.showError(errorTpl, error.error.message || 'Nieznany błąd');
            console.error('Error occurred:', error)
          }
        );
        break;
      case 'FASTENERS':
        requestPayload = {
          name: this.addMaterialRequest.name,
          netPricePerQuantity: this.addMaterialRequest.price,
          quantity: this.addMaterialRequest.quantity,
          description: this.addMaterialRequest.description
        };
        console.log(requestPayload);
        this.productService.addFasteners(requestPayload).subscribe(
          response => {
            this.showSuccess(successTpl);
            console.log('Fasteners added!', response);
            this.resetForm();
          },
          error => {
            this.showError(errorTpl, error.error.message || 'Nieznany błąd');
            console.error('Error occurred:', error)
          }
        );
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
