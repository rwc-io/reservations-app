import {Component, computed, inject, OnDestroy, signal, Signal, WritableSignal} from '@angular/core';
import {AsyncPipe, KeyValuePipe} from '@angular/common';
import {AuthComponent, authState} from './auth/auth.component';
import {Auth} from '@angular/fire/auth';
import {combineLatest, from, Observable} from 'rxjs';
import {WeekTableComponent} from './week-table.component';
import {WeekAccordionComponent} from './week-accordion.component';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs/operators';
import {
  BookableUnit,
  Booker,
  PricingTier,
  ReservableWeek,
  Reservation,
  ReservationAuditLog,
  ReservationRound,
  UnitPricingMap
} from './types';
import {DataService} from './data-service';
import {DateTime} from 'luxon';
import {TodayService} from './utility/today-service';
import {TodayPicker} from './utility/today-picker.component';
import {ReservationRoundsService} from './reservations/reservation-rounds-service';
import {RoundConfigComponent} from './reservations/round-config.component';
import {BookerPickerComponent} from './utility/booker-picker.component';
import {toObservable} from '@angular/core/rxjs-interop';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {FormsModule} from '@angular/forms';
import {AuditLogComponent} from './reservations/audit-log.component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {RouterLink} from '@angular/router';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {getDownloadURL, ref, Storage} from '@angular/fire/storage';
import {ANIMATION_SETTINGS, ANNUAL_DOCUMENTS_FOLDER} from './app.config';
import {MatIcon} from '@angular/material/icon';
import {ErrorDialog} from './utility/error-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {EditAnnualDocumentDialog} from './admin/edit-annual-document-dialog.component';
import {MatSnackBar} from '@angular/material/snack-bar';
import {YearSelectorComponent} from './utility/year-selector.component';
import reservationsAppConfig from './reservations-app.config.json';


@Component({
  selector: 'app-reservations',
  imports: [
    AsyncPipe,
    AuthComponent,
    WeekTableComponent,
    WeekAccordionComponent,
    TodayPicker,
    RoundConfigComponent,
    BookerPickerComponent,
    MatChip,
    KeyValuePipe,
    MatChipSet,
    FormsModule,
    AuditLogComponent,
    MatButton,
    RouterLink,
    MatCardContent,
    MatCardHeader,
    MatCard,
    MatIcon,
    MatIconButton,
    YearSelectorComponent,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css'
})
export class ReservationsComponent implements OnDestroy {
  private readonly auth = inject(Auth);
  protected readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly storage = inject(Storage);
  protected readonly reservationRoundsService = inject(ReservationRoundsService);
  private readonly todayService = inject(TodayService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  isSmallScreen = toSignal(
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small]).pipe(map(result => result.matches))
  );

  user$ = authState(this.auth);

  today: Signal<DateTime>;
  bookerIdOverride: WritableSignal<string> = signal('');

  title = reservationsAppConfig.applicationTitle;

  annualDocumentFilename: Signal<string>;
  annualDocumentDownloadUrl: Signal<Observable<string>>;
  bookers: Signal<Booker[]>;
  currentBooker: WritableSignal<Booker | undefined> = signal(undefined);
  weeks$: Observable<ReservableWeek[]>;
  reservationRounds$: Observable<ReservationRound[]>;
  reservations$: Observable<Reservation[]>;
  reservationsAuditLog$: Observable<ReservationAuditLog[]>;
  units: Signal<BookableUnit[]>;
  pricingTiers$: Observable<PricingTier[]>;
  unitPricing$: Observable<UnitPricingMap>;

  isAdmin = this.dataService.isAdmin;
  bookersSubscription;

  constructor() {
    const reservationRoundsService = inject(ReservationRoundsService);

    const dataService = this.dataService;
    this.annualDocumentFilename = dataService.annualDocumentFilename;
    this.bookers = dataService.bookers;
    this.pricingTiers$ = dataService.pricingTiers$;
    this.reservationRounds$ = reservationRoundsService.reservationRounds$;
    this.reservations$ = dataService.reservations$;
    this.reservationsAuditLog$ = dataService.reservationsAuditLog$;
    this.unitPricing$ = dataService.unitPricing$;
    this.units = dataService.units;
    this.weeks$ = dataService.weeks$;

    this.annualDocumentDownloadUrl = computed(() => {
      const rootRef = ref(this.storage, ANNUAL_DOCUMENTS_FOLDER);
      return from(getDownloadURL(ref(rootRef, this.annualDocumentFilename())))
    });

    this.bookersSubscription = combineLatest([toObservable(dataService.bookers), this.user$, toObservable(this.bookerIdOverride)]).subscribe(
      ([bookers, user, bookerIdOverride]) => {
        this.currentBooker.set(bookerIdOverride ?
          bookers.find(booker => booker.id === bookerIdOverride) :
          bookers.find(booker => booker.userId === user?.uid)
        )
      }
    )

    this.today = this.todayService.today;
  }

  ngOnDestroy() {
    this.bookersSubscription?.unsubscribe();
  }

  bookerName(bookerId: string): string {
    return this.bookers().find(booker => booker.id === bookerId)?.name || '';
  }

  editAnnualDocument() {
    const dialogRef = this.dialog.open(EditAnnualDocumentDialog, {
      data: {
        annualDocumentFilename: this.annualDocumentFilename(),
      },
      ...ANIMATION_SETTINGS,
    });
    dialogRef.componentInstance.outputFilename.subscribe((filename: string) => {
      this.dataService.updateAnnualDocumentFilename(this.dataService.activeYear(), filename).then(() => {
        this.snackBar.open('Document updated', 'Ok', {
          duration: 3000
        });
      }).catch(error => {
        this.dialog.open(ErrorDialog, {data: `Couldn't update unit: ${error.message}`, ...ANIMATION_SETTINGS});
      });
    });
  }
}
