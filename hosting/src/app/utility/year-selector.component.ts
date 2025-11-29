import {Component, inject, Input, model} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {DataService} from '../data-service';

@Component({
  selector: 'app-year-selector',
  standalone: true,
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
  ],
  template: `
    <mat-form-field>
      <mat-label>{{ label }}</mat-label>
      <mat-select [(ngModel)]="selectedYear">
        @for (year of years(); track year) {
          <mat-option [value]="year">
            {{ year }}
          </mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
})
export class YearSelectorComponent {
  @Input() label = 'Viewing year';

  private readonly dataService = inject(DataService);

  years = this.dataService.availableYearsSig;
  selectedYear = model<number>(this.dataService.activeYear());

  constructor() {
    // Forward changes back to the global activeYear
    this.selectedYear.subscribe(year => this.dataService.activeYear.set(year));
  }
}
