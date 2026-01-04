import {ChangeDetectionStrategy, Component, HostListener, inject, model, output} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {BookableUnit, UnitPricing} from '../types';
import {DataService} from '../data-service';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {RouterLink} from '@angular/router';

export interface EditUnitDialogData {
  unitPricing: UnitPricing[];
  unitName: string;
  floorPlanFilename: string;
  notesMarkdown: string;
  existingUnitId?: string;
}

@Component({
  selector: 'app-edit-unit-dialog',
  templateUrl: 'edit-unit-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatFormField,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatInput,
    MatLabel,
    MatDialogTitle,
    FormsModule,
    MatInputModule,
    MatOption,
    MatSelect,
    RouterLink,
  ]
})
export class EditUnitDialog {
  data = inject<EditUnitDialogData>(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<EditUnitDialog>);

  unitName = model('')
  floorPlanFilename = model('')
  notesMarkdown = model('');

  readonly existingUnitId: string | undefined;
  readonly unitPricing: UnitPricing[];

  unit = output<BookableUnit>();
  deleteUnit = output<void>();

  floorPlanFilenames = inject(DataService).floorPlanFilenames;

  constructor() {
    const data = this.data;

    this.unitPricing = data.unitPricing;
    this.unitName.set(data.unitName);
    this.notesMarkdown.set(data.notesMarkdown);
    this.floorPlanFilename.set(data.floorPlanFilename || "");
    this.existingUnitId = data.existingUnitId;
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    // Don't close the dialog on enter if we're typing in the text area
    if (document.activeElement instanceof HTMLTextAreaElement) {
      return
    }
    if (this.isValid()) {
      this.onSubmit();
    }
  }

  isValid(): boolean {
    return this.unitName().length > 0;
  }

  onSubmit(): void {
    this.unit.emit({
      id: this.existingUnitId || '',
      name: this.unitName(),
      floorPlanFilename: this.floorPlanFilename(),
      notesMarkdown: this.notesMarkdown(),
    });
  }

  onDelete(): void {
    if (confirm("Really delete? This cannot be undone")) {
      this.deleteUnit.emit();
    }
  }
}
