import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  password = '';
  confirmPassword = '';
  error = '';
  hidePassword = true;
  hideConfirm = true;
  token = '';

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Router state is on history.state after navigation (getCurrentNavigation() is usually null here).
    let fromHistory = '';
    const st = history.state;
    if (st && typeof st === 'object' && 'resetToken' in st) {
      const v = (st as { resetToken?: unknown }).resetToken;
      if (typeof v === 'string') fromHistory = v.trim();
    }
    this.token =
      fromHistory ||
      sessionStorage.getItem('hireflow_reset_token')?.trim() ||
      this.route.snapshot.queryParamMap.get('token')?.trim() ||
      '';
  }

  private validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pw)) return 'Password must include at least one uppercase letter';
    if (!/[a-z]/.test(pw)) return 'Password must include at least one lowercase letter';
    if (!/[0-9]/.test(pw)) return 'Password must include at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pw)) return 'Password must include at least one special character';
    return null;
  }

  onSubmit(): void {
    this.error = '';
    if (!this.token) {
      this.error = 'Missing reset token. Please request a new reset link.';
      return;
    }
    const pwErr = this.validatePassword(this.password);
    if (pwErr) {
      this.error = pwErr;
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }
    this.auth.resetPassword(this.token, this.password).subscribe((res) => {
      if (!res.success) {
        this.error = res.error ?? 'Failed to reset password';
        return;
      }
      sessionStorage.removeItem('hireflow_reset_token');
      this.router.navigate(['/login'], { queryParams: { reset: 'success' } });
    });
  }
}
