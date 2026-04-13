import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  hidePassword = true;
  hideConfirm = true;
  error = '';
  success = '';
  loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(): void {
    this.error = '';
    this.success = '';

    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
      this.error = 'All fields are required.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }

    this.loading = true;
    this.auth.register(this.name.trim(), this.email.trim(), this.password.trim()).subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.success = 'Account created! Redirecting to login…';
          setTimeout(() => this.router.navigate(['/login']), 1800);
        } else {
          this.error = result.error ?? 'Registration failed. Please try again.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Cannot reach server. Is the backend running?';
      },
    });
  }
}
