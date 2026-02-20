import {Component, EventEmitter, Input, Output} from '@angular/core';
import {BookableUnit, Booker, PricingTier, UnitPricingMap} from './types';
import {WeekReservation, WeekRow} from './week-table.component';
import {DateTime} from 'luxon';
import {ReservableWeekCellComponent} from './reservable-week-cell.component';
import {CurrencyPipe} from './utility/currency-pipe';
import {MatCardModule} from '@angular/material/card';

@Component({
  selector: 'app-reservable-week-card',
  standalone: true,
  imports: [
    ReservableWeekCellComponent,
    CurrencyPipe,
    MatCardModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ unit.name }}</mat-card-title>
        <mat-card-subtitle>
          {{ weekRow.pricingTier?.name || 'Unknown' }} tier:
          {{ unitTierPricing(unit, weekRow.pricingTier)?.weeklyPrice | currency }}/wk,
          {{ unitTierPricing(unit, weekRow.pricingTier)?.dailyPrice | currency }}/day
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-actions>
        <app-reservable-week-cell
          [weekRow]="weekRow"
          [unit]="unit"
          [unitReservations]="weekRow.reservations[unit.id] || []"
          [bookers]="bookers"
          [canAddReservation]="canAddReservation"
          [canAddDailyReservation]="canAddDailyReservation"
          [canEditReservationFn]="canEditReservationFn"
          (addReservation)="addReservation.emit($event)"
          (editReservation)="editReservation.emit($event)"
        ></app-reservable-week-cell>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    mat-card {
      margin-bottom: 1em;
    }
    mat-card-actions {
      display: block;
    }
  `]
})
export class ReservableWeekCardComponent {
  @Input({required: true}) unit!: BookableUnit;
  @Input({required: true}) weekRow!: WeekRow;
  @Input({required: true}) bookers!: Booker[];
  @Input({required: true}) unitPricing!: UnitPricingMap;
  @Input({required: true}) canAddReservation!: boolean;
  @Input({required: true}) canAddDailyReservation!: boolean;
  @Input({required: true}) canEditReservationFn!: (reservation: WeekReservation) => boolean;

  @Output() addReservation = new EventEmitter<{ startDate: DateTime; endDate: DateTime }>();
  @Output() editReservation = new EventEmitter<WeekReservation>();

  unitTierPricing(unit: BookableUnit, pricingTier: PricingTier | undefined) {
    if (pricingTier === undefined) {
      return undefined;
    }
    return this.unitPricing[unit.id]?.find(it => it.tierId === pricingTier.id);
  }
}
