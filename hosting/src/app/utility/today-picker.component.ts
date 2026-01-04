import {ChangeDetectionStrategy, Component, inject, Input, model,} from '@angular/core';
import {DateTime} from 'luxon';
import {FormsModule} from '@angular/forms';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {TodayService} from './today-service';

@Component({
  selector: 'app-today-picker',
  templateUrl: 'today-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatDatepicker,
    MatDatepickerInput,
    MatDatepickerToggle,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix
  ]
})
export class TodayPicker {
  _today = model(DateTime.now());
  todayService = inject(TodayService);

  @Input()
  set today(value: DateTime) {
    this._today.set(value);
    this.todayService.today = value;
  }

  get today() {
    return this._today();
  }
}
