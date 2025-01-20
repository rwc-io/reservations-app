import {Component, inject, Input, signal, WritableSignal} from '@angular/core';
import {AsyncPipe, KeyValuePipe, NgForOf} from '@angular/common';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatFooterCell,
  MatFooterCellDef,
  MatFooterRow,
  MatFooterRowDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import {ShortDate} from './utility/short-date.pipe';
import {from, Observable, of} from 'rxjs';
import {
  BookableUnit,
  Booker,
  Permissions,
  PricingTier,
  PricingTierMap,
  ReservableWeek,
  Reservation,
  UnitPricing,
  UnitPricingMap
} from './types';
import {DataService} from './data-service';
import {MatAnchor, MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {ReserveDialog, ReserveDialogData} from './reservations/reserve-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {DateTime} from 'luxon';
import {ANIMATION_SETTINGS, FLOOR_PLANS_FOLDER} from './app.config';
import {ErrorDialog} from './utility/error-dialog.component';
import {CurrencyPipe} from './utility/currency-pipe';
import {Auth} from '@angular/fire/auth';
import {ReservationRoundsService} from './reservations/reservation-rounds-service';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {MatList, MatListItem, MatListItemLine, MatListItemTitle} from '@angular/material/list';
import {getDownloadURL, ref, Storage} from '@angular/fire/storage';
import {EditUnitDialog} from './units/edit-unit-dialog.component';
import {NotesDialog} from './units/notes-dialog.component';


interface WeekRow {
  startDate: DateTime;
  endDate: DateTime;
  pricingTier: PricingTier;
  reservations: { [key: string]: WeekReservation[] };
}

interface WeekReservation {
  id: string;
  startDate: DateTime;
  endDate: DateTime;
  unit: BookableUnit;
  guestName: string;
  bookerId: string;
}

@Component({
  selector: 'week-table',
  standalone: true,
  imports: [
    MatTable,
    MatHeaderRowDef,
    MatRowDef,
    MatHeaderCellDef,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatRow,
    MatHeaderRow,
    ShortDate,
    NgForOf,
    MatFooterCellDef,
    MatFooterCell,
    MatFooterRow,
    MatFooterRowDef,
    KeyValuePipe,
    CurrencyPipe,
    MatIconButton,
    MatIcon,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatList,
    MatListItem,
    MatListItemLine,
    MatListItemTitle,
    AsyncPipe,
    MatButton,
    MatAnchor,
  ],
  templateUrl: './week-table.component.html',
  styleUrl: './week-table.component.css'
})
export class WeekTableComponent {
  private readonly auth = inject(Auth);
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly reservationsRoundsService = inject(ReservationRoundsService);
  private readonly storage = inject(Storage)

  // Input fields
  private _bookers: WritableSignal<Booker[]> = signal([]);
  private _currentBooker: WritableSignal<Booker | undefined> = signal(undefined);
  private _reservations: Reservation[] = [];
  private _permissions: Permissions = {adminUserIds: []};
  private _pricingTiers: PricingTierMap = {};
  private _units: BookableUnit[] = [];
  private _weeks: ReservableWeek[] = [];
  private _unitPricing: UnitPricingMap = {};

  // Download URLs are generated asynchronously
  protected downloadUrls: { [key: string]: Observable<string> } = {};

  // Main table fields
  tableRows$: Observable<WeekRow[]> = of([])
  displayedColumns: string[] = [];

  buildTableRows() {
    const weeks = this._weeks;
    const units = this._units;
    const pricingTiers = this._pricingTiers;
    const reservations = this._reservations;

    this.displayedColumns = ['week', ...units.map(unit => unit.name)];
    this.tableRows$ = of(
      weeks.map(week => {
        const startDate = DateTime.fromISO(week.startDate);
        const endDate = startDate.plus({days: 7});
        const pricingTier = pricingTiers[week.pricingTierId];

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

        const reservationsByUnit = weekReservations.reduce((acc: { [key: string]: WeekReservation[] }, reservation) => {
          const key = reservation.unit?.id;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push(reservation);
          return acc;
        }, {});

        return {startDate, endDate, pricingTier, reservations: reservationsByUnit};
      })
    );
  }

  // Input functions

  @Input()
  set bookers(value: Booker[]) {
    this._bookers.set(value);
    this.buildTableRows();
  }

  @Input() set currentBooker(value: Booker | undefined) {
    this._currentBooker.set(value);
    this.buildTableRows()
  }

  @Input()
  set units(value: BookableUnit[]) {
    this._units = value;
    const rootRef = ref(this.storage, FLOOR_PLANS_FOLDER);

    this.downloadUrls = value.reduce((acc, unit) => {
      if (unit.floorPlanFilename) {
        acc[unit.id] = from(getDownloadURL(ref(rootRef, unit.floorPlanFilename)))
      }
      return acc;
    }, {} as { [key: string]: Observable<string> });

    this.buildTableRows();
  }

  get units() {
    return this._units;
  }

  @Input()
  set weeks(value: ReservableWeek[]) {
    this._weeks = value;
    this.buildTableRows();
  }

  @Input()
  set permissions(value: Permissions) {
    this._permissions = value;
    this.buildTableRows();
  }

  @Input()
  set pricingTiers(value: PricingTierMap) {
    this._pricingTiers = value;
    this.buildTableRows();
  }

  get pricingTiers() {
    return this._pricingTiers;
  }

  @Input()
  set reservations(value: Reservation[]) {
    this._reservations = value;
    this.buildTableRows();
  }

  @Input()
  set unitPricing(value: UnitPricingMap) {
    this._unitPricing = value;
    this.buildTableRows();
  }

  // Helper functions

  availableBookers(): Booker[] {
    const currentBooker = this._currentBooker;
    const bookers = this._bookers;

    return bookers().filter(booker => {
      return this.actingAsAdmin() || booker.userId === currentBooker()?.userId;
    });
  }

  addReservation(weekRow: WeekRow, unit: BookableUnit, startDate: DateTime, endDate: DateTime) {
    const unitPricing = this._unitPricing[unit.id] || [];

    const dialogRef = this.openReserveDialog(unit, weekRow, startDate, endDate);

    dialogRef.componentInstance.reservation.subscribe((reservation: Reservation) => {
      this.submitReservation(reservation);
      dialogRef.close();
    });
  }

  private openReserveDialog(unit: BookableUnit, weekRow: WeekRow, startDate: DateTime, endDate: DateTime, existingReservation?: WeekReservation) {
    const unitPricing = this._unitPricing[unit.id] || [];
    const allowDailyReservations = this.actingAsAdmin() || this.reservationsRoundsService.currentRound()?.allowDailyReservations || false;
    const blockedDates = this.blockedDaysFor(weekRow.reservations[unit.id], existingReservation)

    // Always honor the existing reservation being edited
    startDate = existingReservation ? existingReservation.startDate : startDate;
    endDate = existingReservation ? existingReservation.endDate : endDate;

    return this.dialog.open(ReserveDialog, {
      data: {
        unit,
        tier: weekRow.pricingTier,
        weekStartDate: weekRow.startDate,
        weekEndDate: weekRow.endDate,
        startDate: startDate,
        endDate: endDate,
        unitPricing,
        bookers: this.availableBookers(),
        allowDailyReservations,
        blockedDates,
        initialGuestName: existingReservation?.guestName,
        initialBookerId: existingReservation?.bookerId,
        existingReservationId: existingReservation?.id,
      } as ReserveDialogData,
      ...ANIMATION_SETTINGS,
    });
  }

  actingAsAdmin(): boolean {
    // There is no admin booker. If one is set (whether as an override, or
    // otherwise) don't set the admin status.
    if (this._currentBooker()?.id) {
      return false;
    }
    return this.dataService.isAdmin();
  }

  canAddReservation(): boolean {
    if (this.actingAsAdmin()) {
      return true;
    }
    const currentBooker = this._currentBooker();
    const currentRound = this.reservationsRoundsService.currentRound();
    const currentSubRoundBooker = this.reservationsRoundsService.currentSubRoundBooker();

    const bookableRound = !!currentRound && (!currentSubRoundBooker || currentSubRoundBooker.id === currentBooker?.id);

    const applicableBookingLimit = currentRound?.bookedWeeksLimit || 0;
    const bookedWeeks = this._reservations.filter(reservation => reservation.bookerId === currentBooker?.id).length;
    const underBookingLimit = applicableBookingLimit === 0 || bookedWeeks < applicableBookingLimit;

    return bookableRound && underBookingLimit;
  }

  canAddDailyReservation(): boolean {
    return this.canAddReservation() && (this.actingAsAdmin() || this.reservationsRoundsService.currentRound()?.allowDailyReservations || false);
  }

  canEditReservation(reservation: WeekReservation): boolean {
    if (this.actingAsAdmin()) {
      return true;
    }
    return reservation.bookerId === this._currentBooker()?.id;
  }

  canEditUnit(): boolean {
    return this.actingAsAdmin();
  }

  blockedDaysFor(reservations: WeekReservation[], reservation?: WeekReservation) {
    const otherReservations = reservations?.filter(it => it.id !== reservation?.id) || [];

    return new Set(otherReservations.flatMap(otherReservation => {
      const days = otherReservation.endDate.diff(otherReservation.startDate, 'days').days;
      return [...Array(days).keys()].map(offset => otherReservation.startDate.plus({days: offset}).toISODate());
    }));

  }

  editUnit(unit: BookableUnit) {
    const dialogRef = this.dialog.open(EditUnitDialog, {
      minWidth: '40vw',
      data: {
        unitName: unit.name,
        existingUnitId: unit.id,
        floorPlanFilename: unit.floorPlanFilename,
        notesMarkdown: unit.notesMarkdown || "",
        unitPricing: this._unitPricing[unit.id] || [],
      },
      ...ANIMATION_SETTINGS,
    });
    dialogRef.componentInstance.unit.subscribe((unit: BookableUnit) => {
      this.dataService.updateUnit(unit).then(() => {
        console.log('Unit updated');
        dialogRef.close()
      }).catch((error) => {
        this.dialog.open(ErrorDialog, {data: `Couldn't update unit: ${error.message}`, ...ANIMATION_SETTINGS});
      });
    });

    dialogRef.componentInstance.deleteUnit.subscribe(() => {
      console.log('Delete unit', unit);
    });
  }

  editReservation(reservation: WeekReservation, week: WeekRow) {
    const unit = reservation.unit;

    const dialogRef = this.openReserveDialog(unit, week, reservation.startDate, reservation.endDate, reservation);

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
    let errors: string[] = [];

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
      !!reservation.id ?
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

  openNotesDialog(unit: BookableUnit) {
    this.dialog.open(NotesDialog, {
      minWidth: '40vw',
      data: {
        unitName: unit.name,
        notesMarkdown: unit.notesMarkdown || "",
      },
      ...ANIMATION_SETTINGS,
    });
  }

  unitTierPricing(unit: BookableUnit, pricingTier: PricingTier): (UnitPricing | undefined) {
    const unitPricing = this._unitPricing[unit.id];
    if (!unitPricing) {
      return undefined;
    }

    return unitPricing.find(it => it.tierId === pricingTier.id);
  }

  bookerName(bookerId: string): string | undefined {
    const booker = this._bookers().find(it => it.id === bookerId);
    return booker?.name;
  }

  weekDates(week: WeekRow): DateTime[] {
    return [...Array(7).keys()].map((i) => week.startDate.plus({days: i}));
  }

  isReservedByDay(reservations: WeekReservation[]): boolean {
    return reservations?.some(reservation => {
      return reservation.endDate.diff(reservation.startDate, 'days').days < 7;
    });
  }

  reservationForDay(reservations: WeekReservation[], date: DateTime): WeekReservation | undefined {
    return reservations.find(reservation => {
      return reservation.startDate.equals(date);
    });
  }

  rowStyle(pricingTier: PricingTier) {
    if (pricingTier) {
      const colorRgb = pricingTier.color.join(' ');
      return `background-color: rgb(${colorRgb} / 0.05)`;
    } else {
      return '';
    }
  }
}
