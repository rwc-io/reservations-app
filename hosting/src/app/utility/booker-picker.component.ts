import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {DataService} from '../data-service';
import {PermissionsService} from '../reservations/permissions-service';

@Component({
  selector: 'app-booker-picker',
  templateUrl: 'booker-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormField,
    FormsModule,
    MatLabel,
    MatSelect,
    MatOption,
  ]
})
export class BookerPickerComponent {
  private readonly dataService = inject(DataService);
  private readonly permissionsService = inject(PermissionsService);

  bookers = this.dataService.bookers;

  sortedBookers = computed(() => {
    return [...this.bookers()].sort((a, b) => a.name.localeCompare(b.name));
  });

  get bookerIdOverride() {
    return this.permissionsService.bookerIdOverride();
  }

  set bookerIdOverride(id: string) {
    this.permissionsService.bookerIdOverride.set(id);
  }
}
