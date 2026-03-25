import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../core/auth/auth.service';
import { UserService } from '../../core/services/user.service';
import { User, UserFormValue, USER_ROLES } from '../../core/models/user.model';
import { UserFormDialogComponent, UserFormDialogData } from './user-form-dialog/user-form-dialog.component';

type UserStatusFilter = 'All' | 'Active' | 'Inactive';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private auth = inject(AuthService);

  readonly isAdmin = (this.auth.getCurrentUser()?.role ?? '') === 'admin';

  readonly roleLabel = (role: User['role']) =>
    USER_ROLES.find((r) => r.value === role)?.label ?? role;

  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
  dataSource = new MatTableDataSource<User>([]);
  allUsers: User[] = [];

  searchTerm = '';
  selectedStatusFilter: UserStatusFilter = 'All';

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.userService.loadUsers().subscribe((list) => {
      this.allUsers = list;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.dataSource.data = this.allUsers.filter((user) => {
      const fullName = this.fullName(user).toLowerCase();
      const email = user.email.toLowerCase();
      const role = this.roleLabel(user.role).toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        email.includes(search) ||
        role.includes(search);

      const matchesStatus =
        this.selectedStatusFilter === 'All' ||
        (this.selectedStatusFilter === 'Active' && user.isActive) ||
        (this.selectedStatusFilter === 'Inactive' && !user.isActive);

      return matchesSearch && matchesStatus;
    });
  }

  setStatusFilter(filter: UserStatusFilter): void {
    this.selectedStatusFilter = filter;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  openCreate(): void {
    if (!this.isAdmin) {
      alert('Admin role required');
      return;
    }

    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: {} as UserFormDialogData,
    });

    ref.afterClosed().subscribe((result: UserFormValue | undefined) => {
      if (result) {
        this.userService.addUser(result).subscribe({
          next: () => this.refresh(),
          error: (err) => alert(err?.message ?? 'Failed to create user'),
        });
      }
    });
  }

  openEdit(user: User): void {
    if (!this.isAdmin) {
      alert('Admin role required');
      return;
    }

    const ref = this.dialog.open(UserFormDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: { user } as UserFormDialogData,
    });

    ref.afterClosed().subscribe((result: UserFormValue | undefined) => {
      if (result) {
        this.userService.updateUser(user.id, result);
        this.refresh();
      }
    });
  }

  setUserActive(user: User, isActive: boolean): void {
    if (!this.isAdmin) {
      alert('Admin role required');
      return;
    }

    const action = isActive ? 'Activate' : 'Deactivate';
    const name = this.fullName(user) || user.email;

    if (confirm(`${action} ${name}?`)) {
      this.userService.setUserActive(user.id, isActive).subscribe({
        next: () => this.refresh(),
        error: (err) => alert(err?.message ?? `Failed to ${action.toLowerCase()} user`),
      });
    }
  }

  fullName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }
}