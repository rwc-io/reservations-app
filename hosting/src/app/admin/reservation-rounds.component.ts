import {
  Component,
  computed,
  inject,
  model,
  ModelSignal,
  OnDestroy,
  OutputRefSubscription,
  signal,
  Signal
} from '@angular/core';
import {DataService} from '../data-service';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {of, Subscription} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from "@angular/material/dialog";
import {ReservationRound, ReservationRoundDefinition, ReservationRoundsConfig} from '../types';
import {ActivatedRoute} from '@angular/router';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatInput} from '@angular/material/input';
import {MatButton} from '@angular/material/button';
import {ReservationRoundsService} from '../reservations/reservation-rounds-service';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {DateTime} from 'luxon';
import {RoundConfigComponent} from '../reservations/round-config.component';
import {ANIMATION_SETTINGS} from '../app.config';
import {EditRoundDialog, EditRoundDialogData} from './edit-round-dialog.component';

@Component({
  selector: 'app-reservation-rounds-admin',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatFormField,
    FormsModule,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatCardActions,
    MatButton,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatError,
    MatSuffix,
    RoundConfigComponent,
  ],
  templateUrl: './reservation-rounds.component.html',
})
export class ReservationRoundsComponent implements OnDestroy {
  private route = inject(ActivatedRoute);

  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly reservationRoundsService = inject(ReservationRoundsService);
  private readonly snackBar = inject(MatSnackBar);

  year: Signal<number>
  reservationRoundsConfig = signal({} as ReservationRoundsConfig);
  reservationRoundsDefinitions = computed(() => this.reservationRoundsConfig()?.rounds || []);

  roundsStartDate: ModelSignal<DateTime> = model(DateTime.now());

  rounds = computed(() => {
    if (this.reservationRoundsConfig()) {
      return of(this.reservationRoundsService.definitionsToRounds(this.reservationRoundsConfig()));
    } else {
      return of([] as ReservationRound[]);
    }
  })

  // Support data
  readonly bookers = this.dataService.bookers;
  readonly yearStart = computed(() => DateTime.fromISO(`${this.year()}-01-01`));
  readonly yearEnd = computed(() => DateTime.fromISO(`${this.year()}-12-31`));

  private roundsSubscription?: Subscription;
  private startDateSubscription?: OutputRefSubscription;

  ngOnDestroy() {
    this.roundsSubscription?.unsubscribe();
    this.startDateSubscription?.unsubscribe();
  }

  constructor() {
    this.year = computed(() => this.dataService.activeYear());
    this.roundsSubscription = this.dataService.reservationRoundsConfig$.subscribe(config => {
      this.reservationRoundsConfig.set(config);
      this.roundsStartDate.set(DateTime.fromISO(config.startDate));
    });

    this.startDateSubscription = this.roundsStartDate.subscribe(date => {
      const newConfig = {...this.reservationRoundsConfig()}
      newConfig.startDate = date.toISODate()!;
      this.reservationRoundsConfig.set(newConfig);
    });
  }

  addRound() {
    const dialogRef = this.dialog.open(EditRoundDialog, {
      data: {
        name: `Round ${this.reservationRoundsDefinitions().length + 1}`,
        durationWeeks: 0,
        bookedWeeksLimit: 0,
        allowDailyReservations: false,
        allowDeletions: false,
        bookers: this.bookers(),
      } as EditRoundDialogData,
      ...ANIMATION_SETTINGS,
    });
    dialogRef.componentInstance.round.subscribe((round: ReservationRoundDefinition) => {
      const newConfig = {...this.reservationRoundsConfig()};
      newConfig.rounds.push(round);
      this.reservationRoundsConfig.set(newConfig);
      dialogRef.close();
    });
  }

  editRound(index: number) {
    const round = this.reservationRoundsDefinitions()[index];

    const dialogRef = this.dialog.open(EditRoundDialog, {
      data: {
        name: round.name,
        durationWeeks: round.durationWeeks,
        subRoundBookerIds: round.subRoundBookerIds,
        bookedWeeksLimit: round.bookedWeeksLimit,
        allowDailyReservations: round.allowDailyReservations || false,
        allowDeletions: round.allowDeletions || false,
        bookers: this.bookers(),
        existingPosition: index,
      } as EditRoundDialogData,
      ...ANIMATION_SETTINGS,
    });
    dialogRef.componentInstance.round.subscribe((round: ReservationRoundDefinition) => {
      const newConfig = {...this.reservationRoundsConfig()};
      newConfig.rounds[index] = round;
      this.reservationRoundsConfig.set(newConfig);
      dialogRef.close();
    });

    dialogRef.componentInstance.deleteRound.subscribe(() => {
      const newConfig = {...this.reservationRoundsConfig()};
      newConfig.rounds.splice(index, 1);
      this.reservationRoundsConfig.set(newConfig);
      dialogRef.close();
    });
  }

  onSubmit() {
    this.dataService.updateReservationRoundsConfig(this.reservationRoundsConfig());
    this.snackBar.open('Round rules saved', 'Ok', {duration: 3000});
  }
}
