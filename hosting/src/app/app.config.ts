import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {connectAuthEmulator, getAuth, provideAuth} from '@angular/fire/auth';
import {connectFirestoreEmulator, getFirestore, provideFirestore} from '@angular/fire/firestore';

import reservationsAppConfig from './reservations-app.config.json';
import {environment} from '../environments/environment';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {DialogService} from './utility/dialog-service';
import {MatDialog} from '@angular/material/dialog';
import {provideLuxonDateAdapter} from '@angular/material-luxon-adapter';
import {TodayService} from './utility/today-service';
import {ReservationRoundsService} from './reservations/reservation-rounds-service';
import {connectStorageEmulator, getStorage, provideStorage} from '@angular/fire/storage';
import {connectFunctionsEmulator, getFunctions, provideFunctions} from '@angular/fire/functions';

export const ANIMATION_SETTINGS = {
  enterAnimationDuration: "250ms",
  exitAnimationDuration: "250ms",
}

export const ANNUAL_DOCUMENTS_FOLDER = 'annualDocuments';
export const FLOOR_PLANS_FOLDER = 'floorPlans';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp({
      "projectId": reservationsAppConfig.projectId,
      "appId": reservationsAppConfig.appId,
      "storageBucket": reservationsAppConfig.storageBucket,
      "apiKey": reservationsAppConfig.apiKey,
      "authDomain": reservationsAppConfig.authDomain,
      "messagingSenderId": reservationsAppConfig.messagingSenderId,
    })),
    provideAuth(() => {
      const auth = getAuth();
      if (environment.useEmulators) {
        connectAuthEmulator(auth, 'http://localhost:9099');
      }
      return auth;
    }),
    provideFirestore(() => {
      const firestore = getFirestore();
      if (environment.useEmulators) {
        connectFirestoreEmulator(firestore, 'localhost', 8080)
      }
      return firestore;
    }),
    provideFunctions(() => {
      const functions = getFunctions();
      if (environment.useEmulators) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      return functions;
    }),
    provideStorage(() => {
      const storage = getStorage();
      if (environment.useEmulators) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
      return storage;
    }),
    provideAnimationsAsync(),
    {provide: MatDialog, useClass: DialogService},
    provideLuxonDateAdapter(),
    {provide: ReservationRoundsService},
    {provide: TodayService},
  ],
};
