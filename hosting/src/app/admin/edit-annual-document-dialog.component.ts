import { ChangeDetectionStrategy, Component, HostListener, inject, model, output } from '@angular/core';
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
import {MatInputModule} from '@angular/material/input';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatLuxonDateModule} from '@angular/material-luxon-adapter';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {DataService} from '../data-service';
import {RouterLink} from '@angular/router';

export interface EditAnnualDocumentDialogData {
  annualDocumentFilename: string;
}

@Component({
  selector: 'app-edit-annual-document-dialog',
  templateUrl: 'edit-annual-document-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatFormField,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatLabel,
    MatDialogTitle,
    FormsModule,
    MatDatepickerModule,
    MatLuxonDateModule,
    MatInputModule,
    MatOption,
    MatSelect,
    RouterLink,

  ]
})
export class EditAnnualDocumentDialog {
  data = inject<EditAnnualDocumentDialogData>(MAT_DIALOG_DATA);

  private readonly dataService = inject(DataService);
  readonly dialogRef = inject(MatDialogRef<EditAnnualDocumentDialog>);

  readonly annualDocumentFilename = model('')
  readonly outputFilename = output<string>();

  readonly availableFilenames = this.dataService.annualDocumentFilenames;

  constructor() {
    const data = this.data;

    this.annualDocumentFilename.set(data.annualDocumentFilename);
  }

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    if (this.isValid()) {
      this.onSubmit();
    }
  }

  isValid(): boolean {
    return this.availableFilenames().includes(this.annualDocumentFilename()) || this.annualDocumentFilename() === '';
  }

  onSubmit(): void {
    this.outputFilename.emit(this.annualDocumentFilename());
    this.dialogRef.close();
  }
}
