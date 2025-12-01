import { ChangeDetectionStrategy, Component, HostListener, inject, model, output } from '@angular/core';
import {MatButton} from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-add-year-dialog',
  template: `
    <h2 mat-dialog-title>Add year</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill">
        <mat-label>Year</mat-label>
        <input matInput type="number" [(ngModel)]="yearValue" (ngModelChange)="yearValue.set($event)" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="!isValid()">Add</button>
    </mat-dialog-actions>
  `,
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
    MatInputModule,
    MatInput,
  ]
})
export class AddYearDialog {
  readonly dialogRef = inject(MatDialogRef<AddYearDialog>);

  // Inputs via dialog config data aren't necessary; caller will set initial value via component API
  readonly yearValue = model<number>(new Date().getFullYear() + 1);
  readonly save = output<number>();

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    if (this.isValid()) {
      this.onSubmit();
    }
  }

  isValid(): boolean {
    const y = this.yearValue();
    return !!y && y > 1900 && y < 3000;
  }

  onSubmit(): void {
    this.save.emit(this.yearValue());
    this.dialogRef.close();
  }
}
