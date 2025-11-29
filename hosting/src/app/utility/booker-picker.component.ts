import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Input,
  model,
  OnDestroy,
  output,
  OutputRefSubscription,
  Signal,
  signal,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {Booker} from '../types';
import {NgForOf} from '@angular/common';
import {MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'app-booker-picker',
  templateUrl: 'booker-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatFormField,
    NgForOf,
    FormsModule,
    MatLabel,
    MatSelect,
    MatOption,
  ]
})
export class BookerPickerComponent implements OnDestroy {
  bookerId = output<string>();
  _bookerId = model('');
  @Input()
  bookers: Signal<Booker[]> = signal([]);

  sortedBookers = computed(() => {
    return this.bookers().sort((a, b) => a.name.localeCompare(b.name));
  });

  bookerSubscription?: OutputRefSubscription;

  constructor() {
    this.bookerSubscription = this._bookerId.subscribe(id => {
      this.bookerId.emit(id);
    })
  }

  ngOnDestroy() {
    this.bookerSubscription?.unsubscribe();
  }
}
