import {ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, Routes} from '@angular/router';
import {ReservationsComponent} from './reservations.component';
import {AdminComponent} from './admin/admin.component';
import {FloorPlanComponent} from './admin/floor-plans.component';
import {UnitPricingComponent} from './admin/unit-pricing.component';
import {ReservationRoundsComponent} from './admin/reservation-rounds.component';
import {PasswordsComponent} from './admin/passwords.component';
import {AnnualDocumentsComponent} from './admin/annual-documents.component';
import {DataService} from './data-service';
import {inject} from '@angular/core';

const isAdminGuard: CanActivateFn = (
  _next: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot) => {
  const dataService = inject(DataService);
  return dataService.isAdmin();
}

export const routes: Routes = [
  {path: 'reservations', component: ReservationsComponent},
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [isAdminGuard],
    canActivateChild: [isAdminGuard],
    children: [
      {
        path: 'annual-documents',
        component: AnnualDocumentsComponent,
      },
      {
        path: 'floor-plans',
        component: FloorPlanComponent,
      },
      {
        path: 'passwords',
        component: PasswordsComponent,
      },
      {
        path: 'reservation-rounds',
        component: ReservationRoundsComponent,
      },
      {
        path: 'unit-pricing',
        component: UnitPricingComponent,
      },
      {
        path: 'unit-pricing/:unitId',
        component: UnitPricingComponent,
      },
    ]
  },
  {path: '', redirectTo: '/reservations', pathMatch: 'full'},
];
