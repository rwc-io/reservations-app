import {Component, inject} from '@angular/core';
import {DataService} from '../data-service';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader} from '@angular/material/card';
import {ANIMATION_SETTINGS} from '../app.config';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ErrorDialog} from "../utility/error-dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {Booker} from '../types';
import {PasswordDialog} from './password-dialog.component';
import {Functions, httpsCallable} from '@angular/fire/functions';
import {Auth, updatePassword} from '@angular/fire/auth';

@Component({
  selector: 'app-passwords',
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatIconButton,
    MatIcon,
  ],
  templateUrl: './passwords.component.html',
  host: {
    'class': 'admin-component-contents'
  }
})
export class PasswordsComponent {
  private readonly auth = inject(Auth);
  private readonly dataService = inject(DataService);
  private readonly dialog = inject(MatDialog);
  private readonly functions = inject(Functions);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly bookers = this.dataService.bookers;

  editPassword(booker?: Booker) {
    const userId = booker?.userId || this.auth.currentUser?.uid;
    if (!userId) {
      this.dialog.open(ErrorDialog, {
        data: "No user ID found",
        ...ANIMATION_SETTINGS,
      });
      return;
    }

    const dialogRef = this.dialog.open(PasswordDialog, {
      data: booker?.name || "Admin",
      ...ANIMATION_SETTINGS,
    })

    dialogRef.afterClosed().subscribe(result => {
      if (!result) {
        return;
      }

      if (!booker) {
        // Changing an admin's password happens through the client (logged in as admin)

        updatePassword(this.auth.currentUser!, result).then(() => {
          this.snackBar.open('Password updated successfully', 'Ok', {duration: 3000});
        }).catch((error) => {
          this.dialog.open(ErrorDialog, {
            data: error.message,
            ...ANIMATION_SETTINGS,
          });
        });
      } else {
        // Changing other users' passwords happens through our backend

        const callable = httpsCallable(this.functions, 'setUserPassword');
        callable({userId, password: result}).then(() => {
          this.snackBar.open('Password updated successfully', 'Ok', {duration: 3000});
        }).catch((error: Error) => {
          this.dialog.open(ErrorDialog, {
            data: error.message,
            ...ANIMATION_SETTINGS,
          });
        });
      }
    });
  }
}
