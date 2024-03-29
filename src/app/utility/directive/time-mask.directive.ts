import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appTimeMask]',
})

export class TimeMaskDirective {

  public newVal: string;

  constructor(public ngControl: NgControl) { this.newVal = ''; }

  @HostListener('ngModelChange', ['$event'])
  onModelChange(event: any) {
    this.onInputChange(event, false);
  }

  onInputChange(event: any, backspace: any) {
    this.checkInputType(event);
    this.checkInputContent();
    this.format();
    this.returnFormated();
  }

  returnFormated() {
    // @ts-ignore
    this.ngControl.valueAccessor.writeValue(this.newVal);
  }

  checkInputType(event: any) {
    this.newVal = event.replace(/\D/g, '');
  }

  checkInputContent() {
    if (this.newVal.length === 1) {
      this.newVal = this.newVal.replace(/^[^012]$/, '');
    } else if (this.newVal.length === 2) {
      if (this.newVal.match(/^(?:([01]?\d|2[0-3]))$/) === null) {
        this.newVal = this.newVal.substring(0, this.newVal.length - 1);
      }
    } else if (this.newVal.length === 3) {
      if (this.newVal.match(/^(?:([01]?\d|2[0-3]))[012345]$/) === null) {
        this.newVal = this.newVal.substring(0, this.newVal.length - 1);
      }
    } else if (this.newVal.length === 4) {
      if (this.newVal.match(/^(?:([01]?\d|2[0-3]))[012345]\d$/) === null) {
        this.newVal = this.newVal.substring(0, this.newVal.length - 1);
      }
    } else {
      this.newVal = this.newVal.substring(0, this.newVal.length - 1);
    }
  }

  format() {
    if (this.newVal.length > 2) {
      this.newVal = this.newVal.replace(/^(\d{2})(\d{0,2})$/, '$1:$2');
    }
  }
}
