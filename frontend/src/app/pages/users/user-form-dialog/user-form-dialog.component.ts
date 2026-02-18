import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { User, UserFormValue, USER_ROLES } from '../../../core/models/user.model';

export interface UserFormDialogData {
  user?: User;
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './user-form-dialog.component.html',
  styleUrl: './user-form-dialog.component.scss',
})
export class UserFormDialogComponent {
  readonly roles = USER_ROLES;
  readonly isEdit: boolean;
  firstName = '';
  lastName = '';
  email = '';
  role: User['role'] = 'candidate';

  constructor(
    private dialogRef: MatDialogRef<UserFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: UserFormDialogData
  ) {
    this.isEdit = !!data?.user;
    if (data?.user) {
      this.firstName = data.user.firstName;
      this.lastName = data.user.lastName;
      this.email = data.user.email;
      this.role = data.user.role;
    }
  }

  get title(): string {
    return this.isEdit ? 'Edit user' : 'Create user';
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    const value: UserFormValue = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      role: this.role,
    };
    this.dialogRef.close(value);
  }
}
