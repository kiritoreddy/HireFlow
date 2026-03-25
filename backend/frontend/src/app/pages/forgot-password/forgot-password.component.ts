import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  email = '';
  submitted = false;
  error = '';
  resetToken = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    this.error = '';
    this.resetToken = '';

    this.auth.requestPasswordReset(this.email).subscribe((res) => {
      if (!res.success) {
        this.error = res.error ?? 'Failed to request reset';
        return;
      }
      this.resetToken = res.resetToken ?? '';
      if (this.resetToken) {
        sessionStorage.setItem('hireflow_reset_token', this.resetToken);
      }
      this.submitted = true;
    });
  }

  /** Demo: no email sending — navigate with token in state so reset page receives it. */
  goToResetPassword(): void {
    if (this.resetToken) {
      this.router.navigate(['/reset-password'], { state: { resetToken: this.resetToken } });
    } else {
      this.router.navigate(['/reset-password']);
    }
  }
}
