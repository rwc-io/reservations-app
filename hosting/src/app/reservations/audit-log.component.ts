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
import {BookableUnit, Booker, ReservationAuditLog} from '../types';
import {Observable, Subscription} from 'rxjs';
import {MatList, MatListItem, MatListItemIcon, MatListItemLine, MatListItemTitle} from '@angular/material/list';
import {ShortDate} from '../utility/short-date.pipe';
import {MatIcon} from '@angular/material/icon';
import {ShortDateTime} from '../utility/short-datetime.pipe';
import {MatAccordion, MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';

@Component({
  selector: 'app-audit-log',
  templateUrl: 'audit-log.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatListItemLine,
    MatIcon,
    ShortDateTime,
    ShortDate,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
  ]
})
export class AuditLogComponent implements OnDestroy {
  _today = model(DateTime.now());

  auditLog: WritableSignal<ReservationAuditLog[]> = signal([]);

  @Input() bookers: Signal<Booker[]> = signal([]);
  @Input() units: Signal<BookableUnit[]> = signal([]);

  auditLogSubscription?: Subscription = undefined;

  ngOnDestroy() {
    this.auditLogSubscription?.unsubscribe();
  }

  @Input()
  set reservationsAuditLog$(value: Observable<ReservationAuditLog[]>) {
    this.auditLogSubscription?.unsubscribe();

    this.auditLogSubscription = value.subscribe(rounds => {
      this.auditLog.set(rounds);
    });
  }

  changeType(entry: ReservationAuditLog) {
    switch (entry.changeType) {
      case 'update':
        return 'Reservation Updated';
      case 'create':
        return 'Reservation Created';
      case 'delete':
        return 'Reservation Deleted';
      default:
        return 'Unknown Change';
    }
  }

  changeIcon(entry: ReservationAuditLog) {
    switch (entry.changeType) {
      case 'update':
        return 'edit';
      case 'create':
        return 'add';
      case 'delete':
        return 'delete';
      default:
        return 'error';
    }
  }

  unitBefore(entry: ReservationAuditLog) {
    return this.units().find(unit => unit.id === entry.before['unitId']);
  }

  unitAfter(entry: ReservationAuditLog) {
    return this.units().find(unit => unit.id === entry.after['unitId']);
  }

  startDateChanged(entry: ReservationAuditLog) {
    return entry.before['startDate'] != entry.after['startDate'];
  }

  startDateBefore(entry: ReservationAuditLog) {
    if (entry.before['startDate']) {
      return DateTime.fromISO(entry.before['startDate'] as string);
    } else {
      return undefined;
    }
  }

  startDateAfter(entry: ReservationAuditLog) {
    if (entry.after['startDate']) {
      return DateTime.fromISO(entry.after['startDate'] as string);
    } else {
      return undefined;
    }
  }

  endDateChanged(entry: ReservationAuditLog) {
    return entry.before['endDate'] != entry.after['endDate'];
  }

  endDateBefore(entry: ReservationAuditLog) {
    if (entry.before['endDate']) {
      return DateTime.fromISO(entry.before['endDate'] as string);
    } else {
      return undefined;
    }
  }

  endDateAfter(entry: ReservationAuditLog) {
    if (entry.after['endDate']) {
      return DateTime.fromISO(entry.after['endDate'] as string);
    } else {
      return undefined;
    }
  }

  guestBefore(entry: ReservationAuditLog) {
    return entry.before['guestName'];
  }

  guestAfter(entry: ReservationAuditLog) {
    return entry.after['guestName'];
  }

  bookerBefore(entry: ReservationAuditLog) {
    return this.bookers().find(booker => booker.id === entry.before['bookerId']);
  }

  bookerAfter(entry: ReservationAuditLog) {
    return this.bookers().find(booker => booker.id === entry.after['bookerId']);
  }

  startDate(entry: ReservationAuditLog) {
    return DateTime.fromISO((entry.before['startDate'] || entry.after['startDate']) as string);
  }

  endDate(entry: ReservationAuditLog) {
    return DateTime.fromISO((entry.before['endDate'] || entry.after['endDate']) as string);
  }
}
