import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BookableUnit, Booker, UnitPricingMap} from './types';
import {WeekReservation, WeekRow} from './week-table.component';
import {DateTime} from 'luxon';
import {ReservableWeekCardComponent} from './reservable-week-card.component';

@Component({
  selector: 'app-week-panel',
  standalone: true,
  imports: [
    ReservableWeekCardComponent,
  ],
  template: `
    @for (unit of units; track unit.id) {
      <app-reservable-week-card
        [unit]="unit"
        [weekRow]="weekRow"
        [bookers]="bookers"
        [unitPricing]="unitPricing"
        [canAddReservation]="canAddReservation"
        [canAddDailyReservation]="canAddDailyReservation"
        [canEditReservationFn]="canEditReservationFn"
        (addReservation)="addReservation.emit({weekRow, unit, startDate: $event.startDate, endDate: $event.endDate})"
        (editReservation)="editReservation.emit($event)"
      ></app-reservable-week-card>
    }
  `
})
export class WeekPanelComponent {
  @Input({required: true}) weekRow!: WeekRow;
  @Input({required: true}) units!: BookableUnit[];
  @Input({required: true}) bookers!: Booker[];
  @Input({required: true}) unitPricing!: UnitPricingMap;
  @Input({required: true}) canAddReservation!: boolean;
  @Input({required: true}) canAddDailyReservation!: boolean;
  @Input({required: true}) canEditReservationFn!: (reservation: WeekReservation) => boolean;

  @Output() addReservation = new EventEmitter<{ weekRow: WeekRow; unit: BookableUnit; startDate: DateTime; endDate: DateTime }>();
  @Output() editReservation = new EventEmitter<WeekReservation>();
}
