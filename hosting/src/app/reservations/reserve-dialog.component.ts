import {ChangeDetectionStrategy, Component, HostListener, inject, model, output} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {BookableUnit, Booker, PricingTier, Reservation, UnitPricing} from '../types';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerModule,
  MatDatepickerToggle
} from '@angular/material/datepicker';
import {MatLuxonDateModule} from '@angular/material-luxon-adapter';
import {DateTime} from 'luxon';
import {CurrencyPipe} from "../utility/currency-pipe";
import {MatOption, MatSelect} from '@angular/material/select';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {ShortDate} from '../utility/short-date.pipe';

export interface ReserveDialogData {
  bookers: Booker[];
  unit: BookableUnit;
  tier: PricingTier;
  unitPricing: UnitPricing[];
  weekStartDate: DateTime;
  weekEndDate: DateTime;
  startDate?: DateTime;
  endDate?: DateTime;
  initialGuestName?: string;
  initialBookerId?: string;
  existingReservationId?: string;
  allowDailyReservations: boolean;
  blockedDates: Set<string>;
  canDelete: boolean;
}

@Component({
  selector: 'app-reserve-dialog',
  templateUrl: 'reserve-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatFormField,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatInput,
    MatLabel,
    MatDialogTitle,
    FormsModule,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatDatepickerModule,
    MatDatepicker,
    MatLuxonDateModule,
    MatInputModule,
    CurrencyPipe,
    MatSelect,
    MatOption,
    MatButtonToggleGroup,
    MatButtonToggle,
    ShortDate,
  ]
})
export class ReserveDialog {
  data = inject<ReserveDialogData>(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<ReserveDialog>);

  weekStartDate: DateTime;
  weekEndDate: DateTime;

  reservationStartDate = model(DateTime.now());
  reservationEndDate = model(DateTime.now());
  guestName = model('');
  bookerId = model('');
  bookingDaily = model(false);

  readonly existingReservationId: string | undefined;
  readonly bookers: Booker[];
  readonly unit: BookableUnit;
  readonly tier: PricingTier;
  readonly unitPricing: UnitPricing[];
  readonly blockedDates = new Set<string>();
  readonly isDateAvailable = this.isDateAvailableBuilder();
  protected readonly canDelete;

  reservation = output<Reservation>();
  deleteReservation = output<void>();

  constructor() {
    const data = this.data;

    this.unit = data.unit;
    this.tier = data.tier;
    this.unitPricing = data.unitPricing;
    this.bookers = data.bookers;
    this.blockedDates = data.blockedDates || new Set();
    this.canDelete = data.canDelete;

    this.weekStartDate = data.weekStartDate;
    this.weekEndDate = data.weekEndDate;

    this.reservationStartDate.set(data.startDate || data.weekStartDate);
    this.reservationEndDate.set(data.endDate || data.weekEndDate);
    this.guestName.set(data.initialGuestName || '');
    this.bookerId.set(data.initialBookerId || (this.bookers.length == 1 ? this.bookers[0].id : ''));
    this.existingReservationId = data.existingReservationId;

    this.bookingDaily.set(
      this.reservationEndDate().diff(this.reservationStartDate(), 'days').days === 1
    );

    this.reservationStartDate.subscribe(date => {
      if (this.bookingDaily()) {
        this.reservationEndDate.set(date.plus({days: 1}));
      } else {
        this.reservationEndDate.set(date.plus({days: 7}));
      }
    });
    this.bookingDaily.subscribe(daily => {
      if (daily) {
        this.reservationEndDate.set(this.reservationStartDate().plus({days: 1}));
      } else {
        this.reservationStartDate.set(this.weekStartDate);
        this.reservationEndDate.set(this.weekEndDate);
      }
    });
  }

  reservationCost(): number | undefined {
    const applicablePricing = this.unitPricing.find(it => it.tierId === this.tier?.id);
    const days = this.reservationEndDate().diff(this.reservationStartDate(), 'days').days;

    if (days === 7 || applicablePricing?.dailyPrice === undefined) {
      return applicablePricing?.weeklyPrice;
    } else {
      return applicablePricing?.dailyPrice * days;
    }
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    if (this.isValid()) {
      this.onSubmit();
    }
  }

  isDateAvailableBuilder() {
    const blockedDates = this.blockedDates;

    return (date: DateTime | null) => {
      return !!date && !blockedDates.has(date.toISODate()!);
    }
  }

  reservationConflicts() {
    const reservationLength = this.reservationEndDate().diff(this.reservationStartDate(), 'days').days;
    const reservationDates = [...Array(reservationLength).keys()].map(offset => this.reservationStartDate().plus({days: offset}));
    return reservationDates.some(date => !this.isDateAvailable(date));
  }

  isValid(): boolean {
    return this.guestName().length > 0 &&
      !this.reservationConflicts() &&
      this.reservationStartDate() < this.reservationEndDate() &&
      this.reservationStartDate() >= this.weekStartDate &&
      this.reservationEndDate() <= this.weekEndDate &&
      !!this.bookerId();
  }

  onSubmit(): void {
    this.reservation.emit({
      id: this.existingReservationId || '',
      startDate: this.reservationStartDate().toISODate(),
      endDate: this.reservationEndDate().toISODate(),
      unitId: this.unit.id,
      guestName: this.guestName(),
      bookerId: this.bookerId(),
    });
  }

  onDelete(): void {
    if (confirm("Really delete? This cannot be undone")) {
      this.deleteReservation.emit();
    }
  }

  canBookDaily(): boolean {
    return this.data.allowDailyReservations;
  }
}
