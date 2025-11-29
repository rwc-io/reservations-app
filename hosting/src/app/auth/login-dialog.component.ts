import {ChangeDetectionStrategy, Component, HostListener, inject, model} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';

@Component({
  selector: 'app-login-dialog',
  templateUrl: 'login-dialog.component.html',
  imports: [FormsModule, MatButtonModule, MatDialogActions, MatDialogClose, MatDialogTitle, MatDialogContent, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class LoginDialog {
  readonly dialogRef = inject(MatDialogRef<LoginDialog>);
  readonly email = model("");
  readonly password = model("");

  @HostListener('window:keyup.Enter', ['$event'])
  onKeyPress(_event: KeyboardEvent): void {
    this.dialogRef.close({email: this.email(), password: this.password()});
  }
}
