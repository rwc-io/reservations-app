import {TestBed} from '@angular/core/testing';
import {ReservationRoundsService} from './reservation-rounds-service';
import {DataService} from '../data-service';
import {TodayService} from '../utility/today-service';
import {DateTime} from 'luxon';
import {BehaviorSubject} from 'rxjs';
import {Booker, ReservationRoundsConfig} from '../types';
import {signal} from '@angular/core';

describe('ReservationRoundsService', () => {
  let service: ReservationRoundsService;
  let dataServiceSpy: Partial<DataService>;
  let todayService: TodayService;

  const mockBookers: Booker[] = [
    {id: 'booker1', name: 'Booker 1', userId: 'user1'},
    {id: 'booker2', name: 'Booker 2', userId: 'user2'},
  ];

  const mockConfig: ReservationRoundsConfig = {
    id: 'config1',
    year: 2026,
    startDate: '2026-01-01',
    rounds: [
      {
        name: 'Round 1',
        subRoundBookerIds: ['booker1', 'booker2'],
        durationDays: 6,
      },
      {
        name: 'Round 2',
        durationDays: 14,
        bookedWeeksLimit: 1,
      }
    ]
  };

  beforeEach(() => {
    dataServiceSpy = {
      reservationRoundsConfig$: new BehaviorSubject(mockConfig),
      bookers: signal(mockBookers),
    };

    todayService = new TodayService();
    todayService.today = DateTime.fromISO('2026-01-01');

    TestBed.configureTestingModule({
      providers: [
        ReservationRoundsService,
        {provide: DataService, useValue: dataServiceSpy},
        {provide: TodayService, useValue: todayService},
      ]
    });
    service = TestBed.inject(ReservationRoundsService);
    // Explicitly call the logic by subscribing to the signals
    // or just let the constructor finish its subscriptions which should happen in TestBed.inject
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('definitionsToRounds', () => {
    it('should convert config to rounds correctly', () => {
      const rounds = service.definitionsToRounds(mockConfig);
      expect(rounds.length).toBe(2);

      const r1 = rounds[0];
      expect(r1.name).toBe('Round 1');
      expect(r1.startDate.toISODate()).toBe('2026-01-01');
      expect(r1.endDate.toISODate()).toBe('2026-01-12'); // 2 subrounds * 6 days = 12 days. End date is start + 11.
      expect(r1.subRounds.length).toBe(2);
      expect(r1.subRounds[0].bookerId).toBe('booker1');
      expect(r1.subRounds[0].startDate.toISODate()).toBe('2026-01-01');
      expect(r1.subRounds[0].endDate.toISODate()).toBe('2026-01-06');
      expect(r1.subRounds[1].bookerId).toBe('booker2');
      expect(r1.subRounds[1].startDate.toISODate()).toBe('2026-01-07');
      expect(r1.subRounds[1].endDate.toISODate()).toBe('2026-01-12');

      const r2 = rounds[1];
      expect(r2.name).toBe('Round 2');
      expect(r2.startDate.toISODate()).toBe('2026-01-13');
      expect(r2.endDate.toISODate()).toBe('2026-01-26'); // 2 weeks = 14 days. End date is start + 13.
      expect(r2.subRounds.length).toBe(0);
      expect(r2.bookedWeeksLimit).toBe(1);
    });

    it('should handle explicit durationDays in subrounds', () => {
      const configWithShortSubrounds: ReservationRoundsConfig = {
        ...mockConfig,
        rounds: [
          {
            name: 'Short Round',
            subRoundBookerIds: ['booker1', 'booker2'],
            durationDays: 3,
          }
        ]
      };
      const rounds = service.definitionsToRounds(configWithShortSubrounds);
      const r = rounds[0];
      expect(r.subRounds[0].startDate.toISODate()).toBe('2026-01-01');
      expect(r.subRounds[0].endDate.toISODate()).toBe('2026-01-03');
      expect(r.subRounds[1].startDate.toISODate()).toBe('2026-01-04');
      expect(r.subRounds[1].endDate.toISODate()).toBe('2026-01-06');
      expect(r.endDate.toISODate()).toBe('2026-01-06');
    });
  });

  describe('currentRound and currentSubRoundBooker', () => {
    it('should identify the current round and subround booker', (done) => {
      // Use toObservable for the signals to wait for emission if necessary
      // but signals should be immediate.
      // Let's force a tick or check if service values are set.

      // Actually, since they are signals based on observables in constructor,
      // they might need a cycle to update.
      setTimeout(() => {
        // Jan 1st is in Round 1, subround 1 (booker1)
        expect(service.currentRound()?.name).withContext('Jan 1st Round').toBe('Round 1');
        expect(service.currentSubRoundBooker()?.id).withContext('Jan 1st Booker').toBe('booker1');

        // Jan 7th is in Round 1, subround 2 (booker2)
        todayService.today = DateTime.fromISO('2026-01-07');
        setTimeout(() => {
          expect(service.currentRound()?.name).withContext('Jan 7th Round').toBe('Round 1');
          expect(service.currentSubRoundBooker()?.id).withContext('Jan 7th Booker').toBe('booker2');

          // Jan 13th is in Round 2, no subrounds
          todayService.today = DateTime.fromISO('2026-01-13');
          setTimeout(() => {
            expect(service.currentRound()?.name).withContext('Jan 13th Round').toBe('Round 2');
            expect(service.currentSubRoundBooker()).withContext('Jan 13th Booker').toBeUndefined();

            // Feb 1st is after all rounds
            todayService.today = DateTime.fromISO('2026-02-01');
            setTimeout(() => {
              expect(service.currentRound()).withContext('Feb 1st Round').toBeUndefined();
              expect(service.currentSubRoundBooker()).withContext('Feb 1st Booker').toBeUndefined();
              done();
            });
          });
        });
      });
    });
  });
});
