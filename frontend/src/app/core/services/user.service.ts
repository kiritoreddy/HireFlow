import { Injectable, signal, computed } from '@angular/core';
import { User, UserFormValue, UserRole } from '../models/user.model';

/** Mock data. Replace with HTTP calls when backend is ready. */
const MOCK_USERS: User[] = [
  {
    id: '1',
    firstName: 'Jane',
    lastName: 'Admin',
    email: 'jane.admin@hireflow.demo',
    username: 'janeadmin',
    role: 'admin',
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Hiring',
    email: 'john.hiring@hireflow.demo',
    username: 'johnhm',
    role: 'hiring_manager',
  },
  {
    id: '3',
    firstName: 'Alex',
    lastName: 'Interviewer',
    email: 'alex.int@hireflow.demo',
    username: 'alexint',
    role: 'interviewer',
  },
  {
    id: '4',
    firstName: 'Sam',
    lastName: 'Candidate',
    email: 'sam.candidate@hireflow.demo',
    username: 'samcand',
    role: 'candidate',
  },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  private users = signal<User[]>([]);

  readonly usersList = computed(() => this.users());

  constructor() {
    this.users.set([...MOCK_USERS]);
  }

  /** Fetch all users. Later: return this.http.get<User[]>(...) */
  loadUsers(): void {
    // Mock: already in memory. Later: this.users.set(await api.getUsers());
  }

  getById(id: string): User | undefined {
    return this.users().find((u) => u.id === id);
  }

  addUser(form: UserFormValue): User {
    const id = crypto.randomUUID();
    const user: User = {
      id,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      username: form.username.trim().toLowerCase(),
      role: form.role,
    };
    this.users.update((list) => [...list, user]);
    return user;
  }

  updateUser(id: string, form: UserFormValue): User | undefined {
    const existing = this.getById(id);
    if (!existing) return undefined;
    const updated: User = {
      ...existing,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      username: form.username.trim().toLowerCase(),
      role: form.role,
    };
    this.users.update((list) => list.map((u) => (u.id === id ? updated : u)));
    return updated;
  }

  deleteUser(id: string): boolean {
    const found = this.users().some((u) => u.id === id);
    if (found) {
      this.users.update((list) => list.filter((u) => u.id !== id));
    }
    return found;
  }
}
