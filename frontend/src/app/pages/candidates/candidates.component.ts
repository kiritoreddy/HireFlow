import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddCandidateDialogComponent } from './add-candidate-dialog.component';

@Component({
  selector: 'app-candidates',
  standalone: true,
  imports: [CommonModule, AgGridModule, MatDialogModule],
  templateUrl: './candidates.component.html',
})
export class CandidatesComponent {

  constructor(private dialog: MatDialog) {}

  gridApi: any;

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

  onGridReady(params: any) {
    this.gridApi = params.api;
  }

  openAddCandidateDialog() {
    const dialogRef = this.dialog.open(AddCandidateDialogComponent, {
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.gridApi) {
        this.rowData = [...this.rowData, result];
        this.gridApi.setRowData(this.rowData);
      }
    });
  }
}
