import {ChangeDetectionStrategy, Component, HostListener, inject, model} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-password-dialog',
  templateUrl: 'password-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatInput,
    MatError,
    MatLabel,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    FormsModule
  ]
})
export class PasswordDialog {
  bookerName = inject(MAT_DIALOG_DATA);

  readonly dialogRef = inject(MatDialogRef<PasswordDialog>);
  readonly password = model('');
  readonly passwordConfirm = model('');

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    this.dialogRef.close(this.password())
  }

  isValid() {
    return this.password() === this.passwordConfirm();
  }
}
