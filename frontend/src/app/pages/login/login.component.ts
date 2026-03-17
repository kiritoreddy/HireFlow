import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  loading = false;
  resetSuccess = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resetSuccess = this.route.snapshot.queryParamMap.get('reset') === 'success';
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    this.error = '';
    this.loading = true;
    this.auth.login(this.email, this.password).subscribe((result) => {
      this.loading = false;
      if (result === true) {
        this.router.navigate(['/']);
      } else {
        this.error = (result as { error: string }).error ?? 'Invalid credentials';
      }
      this.cdr.detectChanges(); // force immediate UI update
    });
  }
}
