import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, AgGridModule, MatDialogModule],
  templateUrl: './candidates.component.html',
})
export class CandidatesComponent {

  constructor(private dialog: MatDialog) {}

  columnDefs = [
    { field: 'name' },
    { field: 'email' },
    {
      field: 'stage',
      editable: true,
      singleClickEdit: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: {
        values: ['Applied', 'Interview', 'Selected', 'Rejected'],
      },
    },
  ];

  rowData = [
    { name: 'John Doe', email: 'john@test.com', stage: 'Applied' },
    { name: 'Jane Smith', email: 'jane@test.com', stage: 'Interview' },
  ];

  openAddCandidateDialog() {
    // dialog will be wired in the next step
    console.log('Add Candidate clicked');
  }
}
