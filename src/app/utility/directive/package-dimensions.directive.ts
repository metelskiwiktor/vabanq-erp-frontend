import { Directive, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appPackageDimensions]'
})
export class PackageDimensionsDirective {
  @Output() packageDimensionsChange: EventEmitter<number[]> = new EventEmitter();

  constructor(private el: ElementRef) { }

  @HostListener('input', ['$event']) onInput(event: any) {
    const value = event.target.value;
    let sanitizedValue = value.replace(/[^\d.x]/g, ''); // Usuwa wszystkie znaki z wyjątkiem cyfr, kropki i liter "x"
    const xCount = sanitizedValue.split('x').length - 1; // Liczy liczbę wystąpień znaku "x"

    if (xCount > 2) {
      // Jeśli jest więcej niż dwa znaki "x", usuń ostatnią z nich
      const lastXIndex = sanitizedValue.lastIndexOf('x');
      sanitizedValue = sanitizedValue.slice(0, lastXIndex) + sanitizedValue.slice(lastXIndex + 1);
    }

    // Usuwa wszystkie kropki, poza pierwszą
    const dotIndex = sanitizedValue.indexOf('.');
    if (dotIndex !== -1) {
      sanitizedValue.replace('.', ''); // Usuwa wszystkie kropki
      sanitizedValue = sanitizedValue.slice(0, dotIndex + 1) + sanitizedValue.slice(dotIndex + 1).replace('.', ''); // Dodaje pierwszą kropkę i pozostawia jedną resztę
    }

    event.target.value = sanitizedValue; // Aktualizuje wartość pola wejściowego
    const dimensions = sanitizedValue.split('x').map((dim: string) => parseFloat(dim.trim()));
    if (dimensions.length === 3 && !dimensions.includes(NaN)) {
      this.packageDimensionsChange.emit(dimensions);
    } else {
      // @ts-ignore
      this.packageDimensionsChange.emit(null);
    }
  }
}
