import { Component } from '@angular/core';

@Component({
  selector: 'app-jobs',
  standalone: true,
  template: `
    <h1>Jobs</h1>
    <p>Job listings will go here.</p>
  `,
  styles: [
    `
      h1 { margin: 0 0 0.5rem 0; font-size: 1.75rem; }
      p { margin: 0; color: rgba(0, 0, 0, 0.7); }
    `,
  ],
})
export class JobsComponent {}
