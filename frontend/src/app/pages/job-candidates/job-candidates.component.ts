import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AddCandidateDialogComponent } from './add-candidate-dialog.component';

@Component({
  selector: 'app-job-candidates',
  standalone: true,
  imports: [
    CommonModule,
    AgGridModule,
    MatDialogModule,
    MatButtonModule,
  ],
  templateUrl: './job-candidates.component.html',
})
export class JobCandidatesComponent {
  constructor(private dialog: MatDialog) {}

  columnDefs = [
    { field: 'name' },
    { field: 'email' },
    { field: 'resume' },
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

  rowData: any[] = [
    {
      name: 'Harper Moore',
      email: 'harper@email.com',
      resume: 'Harper_Moore_Resume.pdf',
      stage: 'Applied',
    },
  ];

  openAddCandidateDialog() {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '450px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.rowData = [...this.rowData, result];
      }
    });
  }
}
