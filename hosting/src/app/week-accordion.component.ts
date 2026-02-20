import {Component, computed, inject, Input, signal, Signal, WritableSignal} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';
import {MatListModule} from '@angular/material/list';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {ShortDate} from './utility/short-date.pipe';
import {Observable, of} from 'rxjs';
import {BookableUnit, Booker, PricingTier, ReservableWeek, Reservation, UnitPricingMap} from './types';
import {DataService} from './data-service';
import {MatDialog} from '@angular/material/dialog';
import {DateTime} from 'luxon';
import {ANIMATION_SETTINGS} from './app.config';
import {ErrorDialog} from './utility/error-dialog.component';
import {Auth} from '@angular/fire/auth';
import {ReservationRoundsService} from './reservations/reservation-rounds-service';
import {WeekReservation, WeekRow} from './week-table.component';
import {WeekPanelComponent} from './week-panel.component';
import {ReserveDialog, ReserveDialogData} from './reservations/reserve-dialog.component';
import {CurrencyPipe} from './utility/currency-pipe';
import {PermissionsService} from './reservations/permissions-service';

@Component({
  selector: 'app-week-accordion',
  standalone: true,
  imports: [
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    ShortDate,
    AsyncPipe,
    WeekPanelComponent,
    MatListModule,
    MatCardModule,
    MatChipsModule,
    CurrencyPipe,
  ],
  template: `
    <mat-accordion>
      @for (row of tableRows$ | async; track row.startDate.toISODate()) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              {{ row.startDate | shortDate }} – {{ row.endDate | shortDate }}: {{ row.pricingTier?.name || '' }}
            </mat-panel-title>
          </mat-expansion-panel-header>
          <app-week-panel
            [weekRow]="row"
            [units]="units"
            [bookers]="bookers"
            [unitPricing]="unitPricing"
            [canAddReservation]="canAddReservation()"
            [canAddDailyReservation]="canAddDailyReservation()"
            [canEditReservationFn]="canEditReservation.bind(this)"
            (addReservation)="addReservation($event.weekRow, $event.unit, $event.startDate, $event.endDate)"
            (editReservation)="editReservation($event, row)"
          ></app-week-panel>
        </mat-expansion-panel>
      } @empty {
        <div class="no-data">
          <h2>No reservable weeks configured for {{ activeYear() }}.</h2>
        </div>
      }

      @if (units.length > 0) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Pricing</mat-panel-title>
          </mat-expansion-panel-header>
          <div class="pricing-cards">
            @for (unit of units; track unit.id) {
              <mat-card>
                <mat-card-header>
                  <mat-card-title>{{ unit.name }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <mat-chip-set>
                    @for (pricing of getUnitPricing(unit); track pricing.tierId) {
                      <mat-chip>
                        {{ pricing.tierName }} {{ pricing.weeklyPrice | currency }}
                      </mat-chip>
                    }
                  </mat-chip-set>
                </mat-card-content>
              </mat-card>
            }
          </div>
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  styles: [`
    .no-data {
      padding: 30px;
      text-align: center;
    }

    .pricing-cards {
      display: flex;
      flex-direction: column;
      gap: 1em;
      padding: 1em 0;
    }
  `]
})
export class WeekAccordionComponent {
  private readonly auth = inject(Auth);
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly reservationsRoundsService = inject(ReservationRoundsService);
  private readonly permissionsService = inject(PermissionsService);

  private _bookers: WritableSignal<Booker[]> = signal([]);
  private _currentBooker: Signal<Booker | undefined> = this.permissionsService.currentBooker;
  private _reservations: Reservation[] = [];
  private _pricingTiers: PricingTier[] = [];
  private _units: BookableUnit[] = [];
  private _weeks: ReservableWeek[] = [];
  private _unitPricing: UnitPricingMap = {};

  tableRows$: Observable<WeekRow[]> = of([])
  activeYear: Signal<number> = computed(() => this.dataService.activeYear());

  @Input() set bookers(value: Booker[]) {
    this._bookers.set(value);
    this.buildTableRows();
  }

  get bookers() {
    return this._bookers();
  }

  @Input() set units(value: BookableUnit[]) {
    this._units = value;
    this.buildTableRows();
  }

  get units() {
    return this._units;
  }

  @Input() set weeks(value: ReservableWeek[]) {
    this._weeks = value;
    this.buildTableRows();
  }

  @Input() set pricingTiers(value: PricingTier[]) {
    this._pricingTiers = value;
    this.buildTableRows();
  }

  @Input() set reservations(value: Reservation[]) {
    this._reservations = value;
    this.buildTableRows();
  }

  @Input() set unitPricing(value: UnitPricingMap) {
    this._unitPricing = value;
    this.buildTableRows();
  }

  get unitPricing() {
    return this._unitPricing;
  }

  buildTableRows() {
    const weeks = this._weeks;
    const units = this._units;
    const pricingTiers = this._pricingTiers;
    const pricingTiersById: Record<string, PricingTier> = pricingTiers.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {} as Record<string, PricingTier>);
    const reservations = this._reservations;

    this.tableRows$ = of(
      weeks.map(week => {
        const startDate = DateTime.fromISO(week.startDate);
        const endDate = startDate.plus({days: 7});
        const pricingTier = pricingTiersById[week.pricingTierId];

        const weekReservations = reservations.filter(reservation => {
          const reservationStartDate = DateTime.fromISO(reservation.startDate);
          const reservationEndDate = DateTime.fromISO(reservation.endDate);
          return reservationStartDate >= startDate && reservationEndDate <= endDate;
        }).map(reservation => {
          const unit = units.find(unit => unit.id === reservation.unitId);
          return {
            id: reservation.id,
            startDate: DateTime.fromISO(reservation.startDate),
            endDate: DateTime.fromISO(reservation.endDate),
            unit,
            guestName: reservation.guestName,
            bookerId: reservation.bookerId,
          } as WeekReservation;
        });

        const reservationsByUnit = weekReservations.reduce((acc: Record<string, WeekReservation[]>, reservation) => {
          const key = reservation.unit?.id;
          if (key) {
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(reservation);
          }
          return acc;
        }, {});

        return {startDate, endDate, pricingTier, reservations: reservationsByUnit};
      })
    );
  }

  getUnitPricing(unit: BookableUnit) {
    const pricing = this._unitPricing[unit.id] || [];
    const pricingTiersById: Record<string, PricingTier> = this._pricingTiers.reduce((acc, t) => {
      acc[t.id] = t;
      return acc;
    }, {} as Record<string, PricingTier>);

    return pricing
      .slice()
      .sort((a, b) => b.weeklyPrice - a.weeklyPrice)
      .map(p => ({
        ...p,
        tierName: pricingTiersById[p.tierId]?.name || 'Unknown'
      }));
  }


  addReservation(weekRow: WeekRow, unit: BookableUnit, startDate: DateTime, endDate: DateTime) {
    const dialogRef = this.openReserveDialog(unit, weekRow, startDate, endDate);
    dialogRef.afterClosed().subscribe(reservation => {
      if (reservation) {
        this.submitReservation(reservation);
      }
    });

    dialogRef.componentInstance.reservation.subscribe((reservation: Reservation) => {
      this.submitReservation(reservation);
      dialogRef.close();
    });
  }

  openReserveDialog(unit: BookableUnit, weekRow: WeekRow, startDate: DateTime, endDate: DateTime, existingReservation?: WeekReservation) {
    const reservationsForUnit = weekRow.reservations[unit.id] || [];
    return this.dialog.open(ReserveDialog, {
      data: {
        unit,
        tier: weekRow.pricingTier,
        unitPricing: this.unitPricing[unit.id] || [],
        bookers: this.availableBookers(),
        weekStartDate: weekRow.startDate,
        weekEndDate: weekRow.endDate,
        startDate,
        endDate,
        initialGuestName: existingReservation?.guestName,
        initialBookerId: existingReservation?.bookerId,
        existingReservationId: existingReservation?.id,
        allowDailyReservations: this.canAddDailyReservation(),
        blockedDates: this.blockedDaysFor(reservationsForUnit, existingReservation),
        canDelete: !!existingReservation && this.canDeleteReservation(existingReservation)
      } as ReserveDialogData,
      ...ANIMATION_SETTINGS
    });
  }

  blockedDaysFor(reservations: WeekReservation[], reservation?: WeekReservation): Set<string> {
    const blockedDates = new Set<string>();
    reservations
      .filter(otherReservation => !reservation || otherReservation.id !== reservation.id)
      .forEach(otherReservation => {
        let current = otherReservation.startDate;
        while (current < otherReservation.endDate) {
          blockedDates.add(current.toISODate()!);
          current = current.plus({days: 1});
        }
      });
    return blockedDates;
  }

  availableBookers(): Booker[] {
    const currentBooker = this._currentBooker();
    if (this.permissionsService.actingAsAdmin()) {
      return this.bookers;
    }
    return this.bookers.filter(booker => booker.id === currentBooker?.id);
  }


  canAddReservation(): boolean {
    return this.permissionsService.canAddReservation(this._reservations);
  }

  canAddDailyReservation(): boolean {
    return this.permissionsService.canAddDailyReservation(this._reservations);
  }

  canEditReservation(reservation: WeekReservation): boolean {
    return this.permissionsService.canEditReservation(reservation);
  }

  canDeleteReservation(reservation: WeekReservation): boolean {
    return this.permissionsService.canDeleteReservation(reservation);
  }

  editReservation(reservation: WeekReservation, week: WeekRow) {
    const dialogRef = this.openReserveDialog(reservation.unit, week, reservation.startDate, reservation.endDate, reservation);

    dialogRef.componentInstance.reservation.subscribe((reservation: Reservation) => {
      this.submitReservation(reservation);
      dialogRef.close();
    });

    dialogRef.componentInstance.deleteReservation.subscribe(() => {
      this.deleteReservation(reservation);
      dialogRef.close();
    });
  }

  submitReservation(reservation: Reservation) {
    const errors: string[] = [];

    if (!reservation.guestName) {
      errors.push("Guest name is required.");
    }
    if (reservation.endDate < reservation.startDate) {
      errors.push("End date must be after start date.");
    }
    if (!reservation.bookerId) {
      errors.push("Booker is required.");
    }
    const reservationLength = DateTime.fromISO(reservation.endDate).diff(DateTime.fromISO(reservation.startDate), 'days').days;
    if (reservationLength != 1 && reservationLength != 7) {
      errors.push("Reservation must be for 1 or 7 days.");
    }

    if (errors.length) {
      this.dialog.open(ErrorDialog, {data: errors.join(' '), ...ANIMATION_SETTINGS});
      return;
    }

    const promise =
      reservation.id ?
        this.dataService.updateReservation(reservation) :
        this.dataService.addReservation(reservation);

    promise.then(() => {
      console.log('Reservation submitted');
    }).catch((error) => {
      this.dialog.open(ErrorDialog, {data: `Couldn't save reservation: ${error.message}`, ...ANIMATION_SETTINGS});
    });
  }

  deleteReservation(reservation: WeekReservation) {
    this.dataService.deleteReservation(reservation.id).then(() => {
      console.log('Reservation deleted');
    }).catch((error) => {
      this.dialog.open(ErrorDialog, {data: `Couldn't delete reservation: ${error.message}`, ...ANIMATION_SETTINGS});
    });
  }
}
