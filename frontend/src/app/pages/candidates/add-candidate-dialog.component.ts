import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './add-candidate-dialog.component.html',
})
export class AddCandidateDialogComponent {

  name = '';
  email = '';

  constructor(
    private dialogRef: MatDialogRef<AddCandidateDialogComponent>
  ) {}

  closeDialog() {
    this.dialogRef.close();
  }

  addCandidate() {
    if (!this.name || !this.email) {
      return;
    }

    this.dialogRef.close({
      name: this.name,
      email: this.email,
      stage: 'Applied',
    });
  }
}
