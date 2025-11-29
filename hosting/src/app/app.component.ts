import { Component, OnInit, inject } from '@angular/core';
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
export class AppComponent implements OnInit {
  private titleService = inject(Title);


  ngOnInit() {
    this.titleService.setTitle(reservationsAppConfig.applicationTitle);
  }
}
