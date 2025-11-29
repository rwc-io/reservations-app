import {Component, Input, inject, model, Signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgForOf} from '@angular/common';
import {MatFormField} from '@angular/material/form-field';
import {MatSelect, MatOption} from '@angular/material/select';
import {MatLabel} from '@angular/material/form-field';
import {DataService} from '../data-service';

@Component({
  selector: 'year-selector',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
  ],
  template: `
    <mat-form-field>
      <mat-label>{{ label }}</mat-label>
      <mat-select [(ngModel)]="selectedYear">
        <mat-option *ngFor="let year of yearsAsArray()" [value]="year">
          {{ year }}
        </mat-option>
      </mat-select>
    </mat-form-field>
  `,
})
export class YearSelectorComponent {
  @Input() label = 'Viewing year';
  @Input() years: number[] | Signal<number[]> = [];

  private readonly dataService = inject(DataService);

  selectedYear = model<number>(this.dataService.activeYear());

  constructor() {
    // Forward changes back to the global activeYear
    this.selectedYear.subscribe(year => this.dataService.activeYear.set(year));
  }

  yearsAsArray(): number[] {
    return Array.isArray(this.years) ? this.years : (this.years as Signal<number[]>)();
  }
}
