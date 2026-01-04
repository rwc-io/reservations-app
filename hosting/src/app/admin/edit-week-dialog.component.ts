import {ChangeDetectionStrategy, Component, HostListener, inject, model, ModelSignal, output} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';
import {MatButton} from '@angular/material/button';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {MatLuxonDateModule} from '@angular/material-luxon-adapter';
import {AsyncPipe} from '@angular/common';
import {DataService} from '../data-service';
import {DateTime} from 'luxon';

export type EditWeekMode = 'add' | 'edit';

export interface EditWeekDialogData {
  startDateISO?: string;
  pricingTierId: string;
  year: number;
  existingStartDates: Set<string>;
  mode: EditWeekMode;
  // When adding, caller can suggest a default start date (ISO)
  suggestedStartDateISO?: string;
}

export interface EditWeekDialogResult {
  startDateISO: string;
  pricingTierId: string;
}

@Component({
  selector: 'app-edit-week-dialog',
  templateUrl: 'edit-week-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatDialogTitle,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatInputModule,
    MatSelect,
    MatOption,
    MatButton,
    MatSuffix,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerModule,
    MatDatepickerToggle,
    MatLuxonDateModule,
    AsyncPipe,
  ]
})
export class EditWeekDialog {
  data = inject<EditWeekDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<EditWeekDialog>);
  private readonly dataService = inject(DataService);

  readonly pricingTiers$ = this.dataService.pricingTiers$;

  readonly startDate: ModelSignal<DateTime | null> = model<DateTime | null>(null);
  readonly pricingTierId: ModelSignal<string> = model('');

  readonly mode: EditWeekMode;
  // Limit datepicker to active year bounds
  readonly yearStart!: DateTime;
  readonly yearEnd!: DateTime;

  // outputs
  result = output<EditWeekDialogResult>();
  deleteWeek = output<void>();

  constructor() {
    const d = this.data;
    this.mode = d.mode;
    this.startDate.set(d.startDateISO ? DateTime.fromISO(d.startDateISO) : null);
    this.pricingTierId.set(d.pricingTierId);

    // Initialize min/max bounds for the datepicker to current year
    this.yearStart = DateTime.fromISO(`${d.year}-01-01`);
    this.yearEnd = DateTime.fromISO(`${d.year}-12-31`);

    // If adding and no explicit start date provided, use suggested date if available
    if (this.mode === 'add' && !this.startDate() && d.suggestedStartDateISO) {
      this.startDate.set(DateTime.fromISO(d.suggestedStartDateISO));
    }
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    if (this.isValid()) {
      this.onSubmit();
    }
  }

  isValid(): boolean {
    return (!!this.startDate() || this.mode === 'edit') && !!this.pricingTierId();
  }

  // Used by mat-datepicker to filter valid selectable dates
  dateFilter = (date: DateTime | null): boolean => {
    if (!date) return false;
    // Saturdays only
    if (date.weekday !== 6) return false; // 6 = Saturday in Luxon

    const iso = date.toISODate()!;

    // cannot select dates already used as a start
    if (this.data.existingStartDates.has(iso) && iso !== this.data.startDateISO) return false;

    return true;
  }

  onSubmit(): void {
    const startISO = this.mode === 'edit' ? this.data.startDateISO! : this.startDate()!.toISODate()!;
    this.result.emit({
      startDateISO: startISO,
      pricingTierId: this.pricingTierId(),
    });
  }

  onDelete(): void {
    if (confirm(`Really delete week starting ${this.data.startDateISO}? This cannot be undone`)) {
      this.deleteWeek.emit();
    }
  }
}
