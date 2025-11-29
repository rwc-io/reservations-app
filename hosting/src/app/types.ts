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

export interface ConfigData {
  annualDocumentFilename: string;
  year: number;
  weeks: ReservableWeek[];
}

export interface Permissions {
  adminUserIds: string[];
}

export interface PricingTier {
  id: string;
  name: string;
  color: number[];
}

export type PricingTierMap = { [key: string]: PricingTier };

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
  before: { [key: string]: any };
  after: { [key: string]: any };
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
export type UnitPricingMap = { [key: string]: UnitPricing[] };

export interface YearConfig {
  id: string;
  year: number;
}
