import { AfterViewInit, Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
  styleUrl: './add-candidate-dialog.component.scss',
})
export class AddCandidateDialogComponent implements OnInit, AfterViewInit {
  name = '';
  email = '';
  resume = '';

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  constructor(private dialogRef: MatDialogRef<AddCandidateDialogComponent>) {}

  ngOnInit(): void {
    this.resetForm();
  }

  private resetForm(): void {
    this.name = '';
    this.email = '';
    this.resume = '';
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  ngAfterViewInit(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.resume = input.files[0].name;
    }
  }

  addCandidate(): void {
    if (!this.name.trim() || !this.email.trim()) {
      return;
    }

    const payload = {
      name: this.name.trim(),
      email: this.email.trim(),
      resume: this.resume || '—',
      stage: 'Applied',
    };
    this.dialogRef.close(payload);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
