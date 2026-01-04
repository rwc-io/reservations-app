import {Component, computed, inject, signal, Signal} from '@angular/core';
import {MatCard, MatCardActions, MatCardContent, MatCardHeader} from '@angular/material/card';
import {DataService} from '../data-service';
import {MatList, MatListItem, MatListItemLine, MatListItemTitle} from '@angular/material/list';
import {MatButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ReservableWeek, WeeksConfig} from '../types';
import {EditWeekDialog, EditWeekDialogData, EditWeekDialogResult} from './edit-week-dialog.component';
import {ANIMATION_SETTINGS} from '../app.config';
import {DateTime} from 'luxon';

@Component({
  selector: 'app-weeks-admin',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardActions,
    MatList,
    MatListItem,
    MatListItemLine,
    MatListItemTitle,
    MatButton,
  ],
  templateUrl: './weeks.component.html',
  host: {
    'class': 'admin-component-contents'
  },
})
export class WeeksComponent {
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  year: Signal<number> = computed(() => this.dataService.activeYear());

  weeksSig = signal<ReservableWeek[]>([]);
  weeksConfigIdSig = signal<string>('');
  pricingTiers$ = this.dataService.pricingTiers$;
  pricingTierMapSig = signal<Record<string, string>>({});

  // Year bounds
  readonly yearStart = computed(() => DateTime.fromISO(`${this.year()}-01-01`));
  readonly yearEnd = computed(() => DateTime.fromISO(`${this.year()}-12-31`));

  // Compute the next available Saturday starting from the first defined reservable week
  nextAvailableStartISO = computed(() => {
    const weeks = this.weeksSig();
    if (!weeks) return undefined;

    const existingSet = new Set(weeks.map(w => w.startDate));

    // Determine the baseline start: first defined reservable week, else first Saturday of the year
    let baseline: DateTime;
    if (weeks.length > 0) {
      const minISO = weeks.reduce((min, w) => min < w.startDate ? min : w.startDate, weeks[0].startDate);
      baseline = DateTime.fromISO(minISO);
    } else {
      const ys = this.yearStart();
      const offset = (6 - ys.weekday + 7) % 7; // Saturday is 6 in Luxon
      baseline = ys.plus({days: offset});
    }

    // Ensure baseline is within the year bounds
    if (baseline < this.yearStart()) baseline = this.yearStart();
    if (baseline > this.yearEnd()) return undefined;

    // Start from the baseline (assume Saturdays for weeks list); if baseline isn't Saturday, align to next Saturday
    if (baseline.weekday !== 6) {
      const delta = (6 - baseline.weekday + 7) % 7;
      baseline = baseline.plus({days: delta});
    }

    // Iterate each Saturday until year end
    for (let d = baseline; d <= this.yearEnd(); d = d.plus({weeks: 1})) {
      const iso = d.toISODate()!;
      if (!existingSet.has(iso)) {
        return iso;
      }
    }

    return undefined;
  });

  // Disable Add button when there is no valid Saturday left
  allWeeksDefined = computed(() => !this.nextAvailableStartISO());

  constructor() {
    this.dataService.weeksConfig$.subscribe(cfg => {
      this.weeksConfigIdSig.set(cfg.id || '');
    });
    this.dataService.weeks$.subscribe(weeks => {
      const sorted = [...weeks].sort((a, b) => a.startDate.localeCompare(b.startDate));
      this.weeksSig.set(sorted);
    });

    this.pricingTiers$.subscribe(tiers => {
      const map: Record<string, string> = {};
      tiers.forEach(t => map[t.id] = t.name);
      this.pricingTierMapSig.set(map);
    });
  }

  addWeek() {
    const existingStarts = new Set(this.weeksSig().map(w => w.startDate));
    const dialogRef = this.dialog.open(EditWeekDialog, {
      data: {
        startDateISO: undefined,
        pricingTierId: '',
        year: this.year(),
        existingStartDates: existingStarts,
        mode: 'add',
        suggestedStartDateISO: this.nextAvailableStartISO(),
      } as EditWeekDialogData,
      ...ANIMATION_SETTINGS,
    });

    dialogRef.componentInstance.result.subscribe((result: EditWeekDialogResult) => {
      if (!result) return;
      const weeks = [...this.weeksSig()];
      weeks.push({startDate: result.startDateISO, pricingTierId: result.pricingTierId});
      const config: WeeksConfig = {id: this.weeksConfigIdSig(), year: this.year(), weeks};
      this.dataService.updateWeeksConfig(config).then(() => {
        this.snackBar.open('Week added', 'Ok', {duration: 3000});
        dialogRef.close();
      });
    });
  }

  editWeek(index: number) {
    const week = this.weeksSig()[index];
    const existingStarts = new Set(this.weeksSig().map(w => w.startDate));
    const dialogRef = this.dialog.open(EditWeekDialog, {
      data: {
        startDateISO: week.startDate,
        pricingTierId: week.pricingTierId,
        year: this.year(),
        existingStartDates: existingStarts,
        mode: 'edit',
      } as EditWeekDialogData,
      ...ANIMATION_SETTINGS,
    });

    dialogRef.componentInstance.result.subscribe((result: EditWeekDialogResult) => {
      if (!result) return;
      const weeks = [...this.weeksSig()];
      weeks[index] = {startDate: week.startDate, pricingTierId: result.pricingTierId};
      const config: WeeksConfig = {id: this.weeksConfigIdSig(), year: this.year(), weeks};
      this.dataService.updateWeeksConfig(config).then(() => {
        this.snackBar.open('Week updated', 'Ok', {duration: 3000});
        dialogRef.close();
      });
    });

    dialogRef.componentInstance.deleteWeek.subscribe(() => {
      this.deleteWeek(index);
      dialogRef.close();
    });
  }

  deleteWeek(index: number) {
    const weeks = [...this.weeksSig()];
    weeks.splice(index, 1);
    const config: WeeksConfig = {id: this.weeksConfigIdSig(), year: this.year(), weeks};
    this.dataService.updateWeeksConfig(config).then(() => {
      this.snackBar.open('Week deleted', 'Ok', {duration: 3000});
    });
  }

  formatDate(iso: string): string {
    return DateTime.fromISO(iso).toFormat('ccc DDD');
  }

  pricingTierName(id: string): string {
    return this.pricingTierMapSig()[id] || '<tier not set>';
  }
}
