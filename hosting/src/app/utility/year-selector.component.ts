import {Component, inject, Input, model} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {DataService} from '../data-service';
import {MatDialog} from '@angular/material/dialog';
import {ANIMATION_SETTINGS} from '../app.config';
import {AddYearDialog} from '../admin/add-year-dialog.component';

@Component({
  selector: 'app-year-selector',
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
      <mat-select [(ngModel)]="selectedYear" (selectionChange)="onSelectionChange($event.value)" (openedChange)="onOpenedChange($event)">
        @for (year of years(); track year) {
          <mat-option [value]="year">
            {{ year }}
          </mat-option>
        }
        @if (isAdmin()) {
          <mat-option [value]="ADD_OPTION_VALUE" class="add-year-option">➕ Add year</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `
})
export class YearSelectorComponent {
  @Input() label = 'Viewing year';

  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);

  years = this.dataService.availableYearsSig;
  selectedYear = model<number>(this.dataService.activeYear());
  isAdmin = this.dataService.isAdmin;
  readonly ADD_OPTION_VALUE = '__ADD_YEAR__';

  private lastSelectedYear = this.dataService.activeYear();

  constructor() {
    // Forward changes back to the global activeYear
    this.selectedYear.subscribe(year => this.dataService.activeYear.set(year));
  }

  onOpenedChange(opened: boolean) {
    if (opened) {
      this.lastSelectedYear = this.selectedYear();
    }
  }

  onSelectionChange(value: string | number) {
    if (value === this.ADD_OPTION_VALUE) {
      const years = this.years();
      const defaultYear = (years[years.length - 1] || new Date().getFullYear()) + 1;
      const dialogRef = this.dialog.open(AddYearDialog, {
        ...ANIMATION_SETTINGS,
      });
      dialogRef.componentInstance.yearValue.set(defaultYear);
      dialogRef.componentInstance.save.subscribe(async (year: number) => {
        await this.dataService.addYear(year);
        // Select the newly added year
        this.selectedYear.set(year);
        dialogRef.close();
      });

      // Revert selection in the dropdown until/if a year is added
      setTimeout(() => this.selectedYear.set(this.lastSelectedYear));
    }
  }
}
