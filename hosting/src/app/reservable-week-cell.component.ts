import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {MatList, MatListItem, MatListItemLine, MatListItemTitle} from '@angular/material/list';
import {MatChip, MatChipSet, MatChipTrailingIcon} from '@angular/material/chips';
import {DateTime} from 'luxon';
import {BookableUnit, Booker} from './types';
import {WeekReservation, WeekRow} from './week-table.component';
import {ShortDate} from './utility/short-date.pipe';

@Component({
  selector: 'app-reservable-week-cell',
  standalone: true,
  imports: [
    CommonModule,
    MatIcon,
    MatIconButton,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatList,
    MatListItem,
    MatListItemLine,
    MatListItemTitle,
    MatChip,
    ShortDate,
    MatChipSet,
    MatChipTrailingIcon,
  ],
  templateUrl: './reservable-week-cell.component.html',
  styleUrl: './reservable-week-cell.component.scss'
})
export class ReservableWeekCellComponent {
  @Input({required: true}) weekRow!: WeekRow;
  @Input({required: true}) unit!: BookableUnit;
  @Input({required: true}) unitReservations!: WeekReservation[];
  @Input({required: true}) bookers!: Booker[];
  @Input({required: true}) canAddReservation!: boolean;
  @Input({required: true}) canAddDailyReservation!: boolean;
  @Input({required: true}) canEditReservationFn!: (reservation: WeekReservation) => boolean;

  @Output() addReservation = new EventEmitter<{ startDate: DateTime; endDate: DateTime }>();
  @Output() editReservation = new EventEmitter<WeekReservation>();

  isReservedByDay(reservations: WeekReservation[]): boolean {
    return reservations?.some(reservation => {
      return reservation.endDate.diff(reservation.startDate, 'days').days < 7;
    });
  }

  weekDates(week: WeekRow): DateTime[] {
    return [...Array(7).keys()].map((i) => week.startDate.plus({days: i}));
  }

  reservationForDay(reservations: WeekReservation[], date: DateTime): WeekReservation | undefined {
    return reservations.find(reservation => {
      return reservation.startDate.equals(date);
    });
  }

  bookerName(bookerId: string): string | undefined {
    return this.bookers.find(it => it.id === bookerId)?.name;
  }

  onAddReservation(startDate: DateTime, endDate: DateTime) {
    this.addReservation.emit({startDate, endDate});
  }

  onEditReservation(reservation: WeekReservation) {
    this.editReservation.emit(reservation);
  }

  canEditReservation(reservation: WeekReservation): boolean {
    return this.canEditReservationFn(reservation);
  }
}
