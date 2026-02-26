import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  model,
  OnDestroy,
  signal,
  WritableSignal,
} from '@angular/core';
import {DateTime} from 'luxon';
import {Booker, ReservationRound} from '../types';
import {Observable, Subscription} from 'rxjs';
import {ShortDate} from '../utility/short-date.pipe';
import {DataService} from '../data-service';

@Component({
  selector: 'app-round-config',
  templateUrl: 'round-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShortDate
  ]
})
export class RoundConfigComponent implements OnDestroy {
  private readonly dataService = inject(DataService);
  _today = model(DateTime.now());

  rounds: WritableSignal<ReservationRound[]> = signal([]);

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
    return this.dataService.bookers().find(booker => booker.id === bookerId);
  }
}
