import {
  ChangeDetectionStrategy,
  Component,
  Input,
  model,
  OnDestroy,
  Signal,
  signal,
  WritableSignal,
} from '@angular/core';
import {DateTime} from 'luxon';
import {Booker, ReservationRound} from '../types';
import {Observable, Subscription} from 'rxjs';
import {NgForOf} from '@angular/common';
import {ShortDate} from '../utility/short-date.pipe';

@Component({
  selector: 'app-round-config',
  templateUrl: 'round-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgForOf,
    ShortDate
  ]
})
export class RoundConfigComponent implements OnDestroy {
  _today = model(DateTime.now());

  rounds: WritableSignal<ReservationRound[]> = signal([]);
  @Input()
  bookers: Signal<Booker[]> = signal([]);

  roundsSubscription?: Subscription = undefined;

  ngOnDestroy() {
    this.roundsSubscription?.unsubscribe();
  }

  @Input()
  set rounds$(value: Observable<ReservationRound[]>) {
    this.roundsSubscription?.unsubscribe();

    this.roundsSubscription = value.subscribe(rounds => {
      this.rounds.set(rounds);
    });
  }

  bookerFor(bookerId: string): Booker | undefined {
    return this.bookers().find(booker => booker.id === bookerId);
  }

  offsetDate(date: DateTime, weeks: number): DateTime {
    return date.plus({days: weeks * 7});
  }
}
