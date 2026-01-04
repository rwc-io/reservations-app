import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-copy-pricing-dialog',
  template: `
    <h2 mat-dialog-title>Copy unit pricing</h2>
    <mat-dialog-content>
      <p>Select a year to copy <b>all unit pricing</b> from into {{data.activeYear}}.</p>
      <mat-form-field>
        <mat-label>Source year</mat-label>
        <mat-select [(ngModel)]="selectedYear">
          @for (year of data.availableYears; track year) {
            <mat-option [value]="year">{{year}}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button [mat-dialog-close]="null">Cancel</button>
      <button mat-button class="primary-button" [mat-dialog-close]="selectedYear" [disabled]="!selectedYear">Copy</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogClose,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    FormsModule,
  ]
})
export class CopyPricingDialog {
  data = inject<{activeYear: number, availableYears: number[]}>(MAT_DIALOG_DATA);
  selectedYear: number | null = null;

  onCancel() {
    // We can just use mat-dialog-close on the button, but this is fine too.
  }
}
