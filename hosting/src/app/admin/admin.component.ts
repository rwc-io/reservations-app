import {Component, model, OnDestroy} from '@angular/core';
import {NgForOf} from '@angular/common';
import {AuthComponent} from '../auth/auth.component';
import {ActivatedRoute, ActivationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {MatButtonToggle, MatButtonToggleGroup} from '@angular/material/button-toggle';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';
import {filter, iif, map, of} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatFormField} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {DataService} from '../data-service';
import {MatLabel} from '@angular/material/form-field';


@Component({
  selector: 'admin',
  standalone: true,
  imports: [
    AuthComponent,
    RouterOutlet,
    MatButtonToggleGroup,
    MatButtonToggle,
    FormsModule,
    RouterLink,
    MatButton,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    NgForOf,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnDestroy {
  title = 'Reservations-App';

  activeChild = model('');
  currentYear = model(2025);

  constructor(private router: Router, private route: ActivatedRoute, protected dataService: DataService) {
    // Does it really have to be this way...?
    this.router.events.pipe(
      filter(event => event instanceof ActivationEnd),
      filter(event => (event as ActivationEnd).snapshot.component === AdminComponent),
      map(event => (event as ActivationEnd).snapshot.children.length),
      distinctUntilChanged(),
      switchMap(() => iif(() => this.route.children.length > 0, this.route.children[0]?.url, of(undefined))),
      map(it => !!it ? it[0].path : '')
    ).subscribe(it => this.activeChild.set(it));

    // Keep the global active year in sync with the selector
    this.currentYear.subscribe(year => this.dataService.activeYear.next(year));
  }

  ngOnDestroy() {
  }
}
