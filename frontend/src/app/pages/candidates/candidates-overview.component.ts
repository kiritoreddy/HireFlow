import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-candidates-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './candidates-overview.component.html',
  styleUrls: ['./candidates-overview.component.scss'],
})
export class CandidatesOverviewComponent {
  jobs = [
    {
      id: 1,
      title: 'Senior Software Engineer',
      department: 'Engineering',
      applied: 2,
      interview: 0,
      selected: 5,
      rejected: 1,
    },
    {
      id: 2,
      title: 'Product Designer',
      department: 'Design',
      applied: 0,
      interview: 0,
      selected: 2,
      rejected: 4,
    },
  ];
}
