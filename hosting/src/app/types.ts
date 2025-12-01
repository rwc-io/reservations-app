import {Timestamp} from '@angular/fire/firestore';
import {DateTime} from 'luxon';

export interface BookableUnit {
  id: string;
  name: string;
  floorPlanFilename: string;
  notesMarkdown: string;
}

export interface Booker {
  id: string;
  name: string;
  userId: string;
}

export interface WeeksConfig {
  id: string;
  year: number;
  weeks: ReservableWeek[];
}

export interface PricingTier {
  id: string;
  name: string;
  color: number[];
}

export interface ReservableWeek {
  startDate: string;
  pricingTierId: string;
}

export interface Reservation {
  id: string;
  startDate: string;
  endDate: string;
  unitId: string;
  guestName: string;
  bookerId: string;
}

export interface ReservationAuditLog {
  who: string;
  year: number;
  reservationId: string;
  timestamp: Timestamp;
  changeType: string;
  before: Record<string, string | number | Timestamp>;
  after: Record<string, string | number | Timestamp>;
}

export interface ReservationRound {
  name: string;
  startDate: DateTime;
  endDate: DateTime;
  subRoundBookerIds: string[];
  bookedWeeksLimit: number;
  allowDailyReservations: boolean;
  allowDeletions: boolean;
}

export interface ReservationRoundDefinition {
  name: string;
  durationWeeks?: number;
  subRoundBookerIds?: string[];
  bookedWeeksLimit?: number;
  allowDailyReservations?: boolean;
  allowDeletions?: boolean;
}

export interface ReservationRoundsConfig {
  id: string;
  year: number;
  startDate: string;
  rounds: ReservationRoundDefinition[];
}

export interface UnitPricing {
  id: string;
  year: number;
  tierId: string;
  unitId: string;
  weeklyPrice: number;
  dailyPrice: number;
}

// Map from unit ID to array of unit pricings (identified by tiers).
export type UnitPricingMap = Record<string, UnitPricing[]>;

export interface YearConfig {
  id: string;
  year: number;
  annualDocumentFilename: string;
}
