import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDegreeMask]',
})

export class DegreeMaskDirective {

  public newVal: string;

  constructor(public ngControl: NgControl) { this.newVal = ''; }

  @HostListener('ngModelChange', ['$event'])
  onModelChange(event: any) {
    this.onInputChange(event);
  }

  @HostListener('keydown.backspace', ['$event'])
  keydownBackspace(event: any) {
    this.remove(event.target.value);
  }

  remove(event: any){
    this.checkInputType(event);
    this.newVal = this.newVal.substring(0, this.newVal.length - 1);
    this.format();
    this.returnFormated();
  }

  onInputChange(event: any) {
    this.checkInputType(event);
    this.checkInputContent();
    this.format();
    this.returnFormated();
  }

  checkInputContent() {
    if (this.newVal.length === 1) {
      this.newVal = this.newVal.replace(/[^0-9]/g, '');
    } else if (this.newVal.length === 2) {
      if (this.newVal.match(/^([0-9]{1,2})$/) === null) {
        this.newVal = this.newVal.substring(0, this.newVal.length - 1);
      }
    } else if (this.newVal.length === 3) {
      if (this.newVal.match(/^([0-9]{1,3})$/) === null) {
        this.newVal = this.newVal.substring(0, this.newVal.length - 1);
      }
    } else {
      this.newVal = this.newVal.substring(0, this.newVal.length - 1);
    }
  }




  checkInputType(event: any) {
    this.newVal = event.replace(/\D/g, '');
  }

  format() {
    if (this.newVal.length > 0) {
      this.newVal = this.newVal.replace(/^(\d{0,3})$/, '$1°');
    }
  }

  returnFormated() {
    // @ts-ignore
    this.ngControl.valueAccessor.writeValue(this.newVal);
  }
}
