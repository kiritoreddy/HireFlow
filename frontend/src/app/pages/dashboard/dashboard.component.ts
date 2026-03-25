import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <h1>Dashboard</h1>
    <p>Welcome to HireFlow. Use the header to navigate to Candidates or Jobs.</p>
  `,
  styles: [
    `
      h1 {
        margin: 0 0 0.5rem 0;
        font-size: 1.75rem;
      }
      p {
        margin: 0;
        color: rgba(0, 0, 0, 0.7);
      }
    `,
  ],
})
export class DashboardComponent {}
