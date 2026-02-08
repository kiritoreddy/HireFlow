import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, AgGridModule],
  templateUrl: './candidates.component.html',
})
export class CandidatesComponent {
  columnDefs = [
    { field: 'name' },
    { field: 'email' },
    { field: 'stage' },
  ];

  rowData = [
    { name: 'John Doe', email: 'john@test.com', stage: 'Applied' },
    { name: 'Jane Smith', email: 'jane@test.com', stage: 'Interview' },
  ];
}
