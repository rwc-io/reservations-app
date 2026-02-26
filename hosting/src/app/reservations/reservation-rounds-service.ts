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
        if (!round || !round.subRounds.length) {
          this.currentSubRoundBooker.set(undefined);
          return;
        }

        const currentSubRound = round.subRounds.find(sr => sr.startDate <= today && sr.endDate >= today);
        const bookerId = currentSubRound?.bookerId;
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

      let roundDurationDays: number;
      if (round.subRoundBookerIds?.length) {
        const numSubRounds = round.subRoundBookerIds.length;
        roundDurationDays = numSubRounds * (round?.durationDays || 0);
      } else {
        roundDurationDays = round.durationDays || 0;
      }

      if (roundDurationDays < 1) {
        throw new Error(`Round "${round.name}" duration is misconfigured`);
      }

      const roundEnd = roundStart.plus({days: roundDurationDays - 1});

      const subRounds = (round.subRoundBookerIds || []).map((bookerId, index) => {
        const subRoundStart = roundStart.plus({days: index * round.durationDays});
        return {
          bookerId,
          startDate: subRoundStart,
          endDate: subRoundStart.plus({days: round.durationDays - 1}),
        };
      });

      previousEndDate = roundEnd.plus({days: 1});
      return {
        name: round.name,
        startDate: roundStart,
        endDate: roundEnd,
        subRounds,
        bookedWeeksLimit: round.bookedWeeksLimit || 0,
        allowDailyReservations: !!round.allowDailyReservations,
        allowDeletions: !!round.allowDeletions,
      };
    });
  }
}
