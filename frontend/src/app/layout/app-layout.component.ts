import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService, CurrentUserProfile } from '../core/auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  currentUser: CurrentUserProfile | null = null;
  isAdmin = false;
  isCandidate = false;
  isInterviewer = false;

  constructor(private auth: AuthService) {
    this.currentUser = this.auth.getCurrentUser();
    const role = this.currentUser?.role ?? '';
    this.isAdmin = role === 'admin';
    this.isCandidate = role === 'candidate';
    this.isInterviewer = role === 'interviewer';
  }

  logout(): void {
    this.auth.logout();
  }
}