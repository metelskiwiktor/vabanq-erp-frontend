import {Directive, ElementRef, forwardRef, HostListener, Input, OnChanges, SimpleChanges} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator
} from '@angular/forms';
import Inputmask from 'inputmask';

@Directive({
  selector: '[uiMask]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiMaskDirective),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => UiMaskDirective),
      multi: true
    }
  ]
})
export class UiMaskDirective implements ControlValueAccessor, Validator, OnChanges {
  @Input() uiMask: string | undefined;
  @Input() uiMaskOptions: any = {};
  @Input() uiMaskInModel: boolean | undefined;
  @Input() uiMaskValidation: boolean | undefined;

  private onTouched = () => {
  };
  private onChanged: (value: any) => void = () => {
  };

  constructor(private el: ElementRef) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['uiMask'] || changes['uiMaskOptions']) {
      this.initializeMask();
    }
  }

  initializeMask(): void {
    const maskOptions = {
      ...this.uiMaskOptions,
      clearMaskOnLostFocus: false,
      greedy: true
    };
    // @ts-ignore
    const mask = new Inputmask(this.uiMask, maskOptions);
    mask.mask(this.el.nativeElement);
  }

  @HostListener('input', ['$event.target.value'])
  @HostListener('blur')
  onInput(value: any): void {
    this.onTouched();
    const placeholder = this.el.nativeElement.inputmask.opts.placeholder;
    const unmaskedValue = this.el.nativeElement.inputmask.unmaskedvalue();
    const maskedValue = this.el.nativeElement.value.split(placeholder).join('');
    console.log("maskedValue: " + maskedValue);
    const emitValue = this.uiMaskInModel ? value : maskedValue;
    this.onChanged(emitValue);
  }

  writeValue(value: any): void {
    if(value == undefined) return;
    // @ts-ignore
     // Apply mask to incoming value
    this.el.nativeElement.value = (new Inputmask(this.uiMask)).maskValue(value || '');
    this.initializeMask(); // Ensure mask is re-applied if value changes
  }

  registerOnChange(fn: any): void {
    this.onChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  validate(control: AbstractControl): ValidationErrors | null {
    const isComplete = this.el.nativeElement.inputmask.isComplete();
    if (this.uiMaskValidation && !isComplete && this.el.nativeElement.inputmask.unmaskedvalue() !== '') {
      return {incomplete: true};
    }
    return null;
  }
}
