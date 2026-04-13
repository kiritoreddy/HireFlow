import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map, catchError, of, throwError } from 'rxjs';
import { User, UserFormValue, getDefaultPasswordForEmail } from '../models/user.model';
import { USERS_ENDPOINTS } from '../config/api.config';

/** Backend user list item (no password) */
interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

function backendUserToFrontend(b: BackendUser): User {
  const parts = (b.name || '').trim().split(/\s+/);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ') ?? '';
  return {
    id: String(b.id),
    firstName,
    lastName,
    email: b.email,
    role: b.role as User['role'],
    isActive: b.is_active,
  };
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private users = signal<User[]>([]);
  private http = inject(HttpClient);

  readonly usersList = computed(() => this.users());

  /** Fetch all users from backend (admin). Updates internal list and returns it. */
  loadUsers(): Observable<User[]> {
    return this.http.get<BackendUser[]>(USERS_ENDPOINTS.list).pipe(
      map((list) => list.map(backendUserToFrontend)),
      tap((list) => this.users.set(list)),
      catchError((err) => {
        console.error('loadUsers failed', err);
        return of([]);
      })
    );
  }

  getById(id: string): User | undefined {
    return this.users().find((u) => u.id === id);
  }

  /** Create user via backend (admin). Uses default password derived from email. */
  addUser(form: UserFormValue): Observable<User> {
    const name = [form.firstName, form.lastName].filter(Boolean).join(' ').trim() || form.email;
    const password = getDefaultPasswordForEmail(form.email);
    const body = {
      name,
      email: form.email.trim().toLowerCase(),
      password,
      role: form.role,
    };
    return this.http.post<BackendUser>(USERS_ENDPOINTS.create, body).pipe(
      map(backendUserToFrontend),
      tap((user) => this.users.update((list) => [...list, user])),
      catchError((err) => {
        const msg = err?.error?.error ?? err?.message ?? 'Failed to create user';
        return throwError(() => new Error(msg));
      })
    );
  }

  updateUser(id: string, form: UserFormValue): User | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    const updated: User = {
      ...existing,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
    };
    this.users.update((list) => list.map((u) => (u.id === id ? updated : u)));
    return updated;
  }

  /** Set user active/inactive via backend (admin). Returns observable; errors surface to caller. */
  setUserActive(id: string, isActive: boolean): Observable<User> {
    return this.http
      .patch<BackendUser>(USERS_ENDPOINTS.patch(id), { is_active: isActive })
      .pipe(
        map(backendUserToFrontend),
        tap((user) => this.users.update((list) => list.map((u) => (u.id === id ? user : u)))),
        catchError((err) => {
          const msg = err?.error?.error ?? err?.message ?? 'Failed to update user';
          return throwError(() => new Error(msg));
        })
      );
  }
}
