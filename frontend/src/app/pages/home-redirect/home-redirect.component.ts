import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home-redirect',
  standalone: true,
  template: '',
})
export class HomeRedirectComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);

  ngOnInit(): void {
    const role = this.auth.getCurrentUser()?.role ?? '';
    if (role === 'candidate') {
      void this.router.navigate(['/portal/jobs'], { replaceUrl: true });
    } else if (role === 'interviewer') {
      void this.router.navigate(['/interviewer/interviews'], { replaceUrl: true });
    } else {
      void this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
