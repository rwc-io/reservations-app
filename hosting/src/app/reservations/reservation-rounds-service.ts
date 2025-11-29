import {inject, Injectable, OnDestroy, signal, WritableSignal} from '@angular/core';
import {Booker, ReservationRound, ReservationRoundsConfig} from '../types';
import {catchError, combineLatest, map, Observable} from 'rxjs';
import {DataService} from '../data-service';
import {DateTime} from 'luxon';
import {toObservable} from '@angular/core/rxjs-interop';
import {TodayService} from '../utility/today-service';

@Injectable({
  providedIn: 'root',
})
export class ReservationRoundsService implements OnDestroy {
  private readonly dataService = inject(DataService);

  private readonly todayService = inject(TodayService);
  private readonly today = this.todayService.today;

  reservationRoundsConfig$: Observable<ReservationRoundsConfig>;
  reservationRounds$: Observable<ReservationRound[]>;

  currentRound: WritableSignal<ReservationRound | undefined> = signal(undefined);
  currentSubRoundBooker: WritableSignal<Booker | undefined> = signal(undefined);

  currentRoundSubscription;
  currentSubRoundBookerSubscription;

  constructor() {
    this.reservationRoundsConfig$ = this.dataService.reservationRoundsConfig$;
    this.reservationRounds$ = this.reservationRoundsConfig$.pipe(
      map(config => this.definitionsToRounds(config)),
      catchError((_error, caught) => caught)
    );

    this.currentRoundSubscription = combineLatest([this.reservationRounds$, toObservable(this.today)]).subscribe({
      next: ([rounds, today]) => {
        const round = rounds.find(round => round.startDate <= today && round.endDate >= today);
        this.currentRound.set(round);
      },
      error: _error => {
        this.currentRound.set(undefined);
      }
    });

    this.currentSubRoundBookerSubscription = combineLatest([toObservable(this.today), toObservable(this.currentRound), toObservable(this.dataService.bookers)]).subscribe({
      next: ([today, round, bookers]) => {
        if (!round || !round.subRoundBookerIds.length) {
          this.currentSubRoundBooker.set(undefined);
          return;
        }

        const weekOffset = Math.floor(today.diff(round.startDate).as('days') / 7);
        const bookerId = round.subRoundBookerIds[weekOffset];
        const booker = bookers.find(booker => booker.id === bookerId);
        this.currentSubRoundBooker.set(booker);
      }, error: _error => {
        this.currentSubRoundBooker.set(undefined);
      }
    });
  }

  ngOnDestroy() {
    this.currentRoundSubscription.unsubscribe();
    this.currentSubRoundBookerSubscription.unsubscribe();
  }

  definitionsToRounds(roundsConfig: ReservationRoundsConfig): ReservationRound[] {
    let previousEndDate = DateTime.fromISO(roundsConfig.startDate);

    return roundsConfig.rounds.map(round => {
      const roundStart = previousEndDate;
      if (round.durationWeeks && round.subRoundBookerIds?.length) {
        throw new Error(`Round "${round.name}" cannot have both durationWeeks and bookerOrder`);
      }

      const durationWeeks = round.durationWeeks || round.subRoundBookerIds?.length;
      if (!durationWeeks || durationWeeks < 1) {
        throw new Error(`Round "${round.name}" must have durationWeeks or bookerOrder`);
      }

      const roundEnd = roundStart.plus({days: durationWeeks * 7 - 1});
      previousEndDate = roundEnd.plus({days: 1});
      return {
        name: round.name,
        startDate: roundStart,
        endDate: roundEnd,
        subRoundBookerIds: round.subRoundBookerIds || [],
        bookedWeeksLimit: round.bookedWeeksLimit || 0,
        allowDailyReservations: !!round.allowDailyReservations,
        allowDeletions: !!round.allowDeletions,
      };
    });
  }
}
