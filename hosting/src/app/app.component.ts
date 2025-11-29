import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Title} from '@angular/platform-browser';

import reservationsAppConfig from './reservations-app.config.json';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
  ],
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(private titleService: Title) {
  }

  ngOnInit() {
    this.titleService.setTitle(reservationsAppConfig.applicationTitle);
  }
}
