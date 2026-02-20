import {computed, inject, Injectable, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {Booker, Reservation} from '../types';
import {DataService} from '../data-service';
import {ReservationRoundsService} from './reservation-rounds-service';
import {Auth} from '@angular/fire/auth';
import {authState} from '../auth/auth.component';
import {toObservable} from '@angular/core/rxjs-interop';
import {combineLatest} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PermissionsService implements OnDestroy {
  private readonly auth = inject(Auth);
  private readonly dataService = inject(DataService);
  private readonly reservationRoundsService = inject(ReservationRoundsService);

  private readonly _currentBooker: WritableSignal<Booker | undefined> = signal(undefined);
  currentBooker: Signal<Booker | undefined> = this._currentBooker;
  bookerIdOverride: WritableSignal<string> = signal('');

  isAdmin: Signal<boolean> = computed(() => this.dataService.isAdmin());

  actingAsAdmin: Signal<boolean> = computed(() => {
    if (this._currentBooker()?.id) {
      return false;
    }
    return this.dataService.isAdmin();
  });

  private bookersSubscription;

  constructor() {
    this.bookersSubscription = combineLatest([
      toObservable(this.dataService.bookers),
      authState(this.auth),
      toObservable(this.bookerIdOverride)
    ]).subscribe(
      ([bookers, user, bookerIdOverride]) => {
        const booker = bookerIdOverride ?
          bookers.find(booker => booker.id === bookerIdOverride) :
          bookers.find(booker => booker.userId === user?.uid);
        this._currentBooker.set(booker);
      }
    );
  }

  ngOnDestroy() {
    this.bookersSubscription?.unsubscribe();
  }

  canAddReservation(reservations: Reservation[]): boolean {
    if (this.actingAsAdmin()) {
      return true;
    }

    const currentBooker = this.currentBooker();
    const currentRound = this.reservationRoundsService.currentRound();
    const currentSubRoundBooker = this.reservationRoundsService.currentSubRoundBooker();

    if (!currentRound || !currentBooker) return false

    const bookableRound = (!currentSubRoundBooker || currentSubRoundBooker.id === currentBooker.id);
    if (!bookableRound) return false;

    const applicableBookingLimit = currentRound.bookedWeeksLimit || 0;
    const bookedWeeks = reservations.filter(reservation => reservation.bookerId === currentBooker.id).length;
    return applicableBookingLimit === 0 || bookedWeeks < applicableBookingLimit;
  }

  canAddDailyReservation(reservations: Reservation[]): boolean {
    const currentRound = this.reservationRoundsService.currentRound();
    return this.canAddReservation(reservations) && (this.actingAsAdmin() || !!currentRound?.allowDailyReservations);
  }

  canEditReservation(reservation: { bookerId: string }): boolean {
    if (this.actingAsAdmin()) {
      return true;
    }

    const currentBooker = this.currentBooker();
    return !!currentBooker && reservation.bookerId === currentBooker.id;
  }

  canDeleteReservation(reservation: { bookerId: string }): boolean {
    if (this.actingAsAdmin()) {
      return true;
    }

    const currentRound = this.reservationRoundsService.currentRound();
    if (!currentRound || !currentRound?.allowDeletions) {
      return false;
    }

    // Can only delete our own reservations
    const currentBooker = this.currentBooker();
    if (!currentBooker || currentBooker.id !== reservation.bookerId) {
      return false;
    }

    const currentSubRoundBooker = this.reservationRoundsService.currentSubRoundBooker();

    // If there's a subRoundBooker, can only delete during our subround
    return (!currentSubRoundBooker || currentSubRoundBooker.id === currentBooker?.id);
  }
}
