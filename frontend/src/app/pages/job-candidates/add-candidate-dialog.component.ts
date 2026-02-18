import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-candidate-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './add-candidate-dialog.component.html',
})
export class AddCandidateDialogComponent implements OnInit {
  name = '';
  email = '';
  resume = '';

  constructor(private dialogRef: MatDialogRef<AddCandidateDialogComponent>) {}

  ngOnInit() {
    this.name = '';
    this.email = '';
    this.resume = '';
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.resume = input.files[0].name;
    }
  }

  addCandidate() {
    if (!this.name.trim() || !this.email.trim()) {
      return;
    }

    const payload = {
      name: this.name,
      email: this.email,
      resume: this.resume || '—',
      stage: 'Applied',
    };

    // FORCE correct timing (this fixes your exact bug)
    setTimeout(() => {
      this.dialogRef.close(payload);
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}
