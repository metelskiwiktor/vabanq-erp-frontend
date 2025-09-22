import { ToastService } from './toast-service';
import { NgTemplateOutlet, NgIf } from '@angular/common';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import {Component, inject} from "@angular/core";

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [NgbToastModule, NgTemplateOutlet, NgIf],
  template: `
		@for (toast of toastService.toasts; track toast) {
			<ngb-toast
				[class]="toast.classname"
				[autohide]="true"
				[delay]="toast.delay || 5000"
				(hidden)="toastService.remove(toast)"
			>
				<ng-template *ngIf="toast.template" [ngTemplateOutlet]="toast.template"></ng-template>
				<div *ngIf="!toast.template">{{ toast.text }}</div>
			</ngb-toast>
		}
	`,
  host: { class: 'toast-container position-fixed top-0 end-0 p-3', style: 'z-index: 1200' },
})
export class ToastsContainer {
  toastService = inject(ToastService);
}
