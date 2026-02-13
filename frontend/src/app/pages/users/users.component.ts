import { Component, OnInit, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserService } from '../../core/services/user.service';
import { User, UserFormValue, USER_ROLES } from '../../core/models/user.model';
import { UserFormDialogComponent, UserFormDialogData } from './user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);

  readonly roleLabel = (role: User['role']) =>
    USER_ROLES.find((r) => r.value === role)?.label ?? role;

  displayedColumns: string[] = ['name', 'email', 'username', 'role', 'actions'];
  dataSource = new MatTableDataSource<User>([]);

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.userService.loadUsers();
    this.dataSource.data = this.userService.usersList();
  }

  openCreate(): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '420px',
      data: {} as UserFormDialogData,
    });
    ref.afterClosed().subscribe((result: UserFormValue | undefined) => {
      if (result) {
        this.userService.addUser(result);
        this.refresh();
      }
    });
  }

  openEdit(user: User): void {
    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '420px',
      data: { user } as UserFormDialogData,
    });
    ref.afterClosed().subscribe((result: UserFormValue | undefined) => {
      if (result) {
        this.userService.updateUser(user.id, result);
        this.refresh();
      }
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Remove ${user.firstName} ${user.lastName}?`)) {
      this.userService.deleteUser(user.id);
      this.refresh();
    }
  }

  fullName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}
