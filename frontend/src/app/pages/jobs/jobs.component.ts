import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './jobs.component.html',
})
export class JobsComponent {
  jobs = [
    { id: 1, title: 'Senior Software Engineer' },
    { id: 2, title: 'Product Designer' },
  ];
}
