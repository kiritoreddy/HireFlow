import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User } from '../../core/models/user.model';
import { InterviewsApiService } from '../../core/services/interviews-api.service';
import { Interview } from '../../core/models/interview.model';

interface DialogData {
  interviewers: User[];
  candidateName: string;
}

export interface AssignInterviewerDialogResult {
  interviewerId: string;
  scheduledDate: string;
  interviewType: string;
}

/** Local working day: first slot 9:00, last slot starts 16:00 (one hour to 17:00). */
const WORK_START_HOUR = 9;
const WORK_END_HOUR_EXCLUSIVE = 17;

export interface SlotOption {
  startHour: number;
  label: string;
  occupied: boolean;
  slotStart: Date;
  slotEnd: Date;
}

@Component({
  selector: 'app-assign-interviewer-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './assign-interviewer-dialog.component.html',
  styleUrl: './assign-interviewer-dialog.component.scss',
})
export class AssignInterviewerDialogComponent implements OnInit {
  private readonly interviewsApi = inject(InterviewsApiService);

  interviewerId = '';
  interviewType = 'TECHNICAL';

  /** Calendar day (local); time ignored except for min-date logic. */
  selectedDate: Date | null = null;
  /** Local hour 9–16 for selected day; null until user picks a slot. */
  selectedSlotHour: number | null = null;
  /** RFC3339 sent to API; derived from date + slot. */
  scheduledDate = '';

  minDate = this.startOfLocalDay(new Date());

  allInterviews: Interview[] = [];
  loadingSlots = true;
  slotsLoadFailed = false;

  private readonly timeFmt = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
    private readonly dialogRef: MatDialogRef<AssignInterviewerDialogComponent>
  ) {
    this.selectedDate = this.startOfLocalDay(this.addLocalDays(new Date(), 1));
  }

  ngOnInit(): void {
    this.interviewsApi.listAllInterviews().subscribe({
      next: (rows) => {
        this.allInterviews = rows;
        this.loadingSlots = false;
        this.syncScheduledIsoFromSelection();
      },
      error: () => {
        this.allInterviews = [];
        this.loadingSlots = false;
        this.slotsLoadFailed = true;
        this.syncScheduledIsoFromSelection();
      },
    });
  }

  get canPickSlots(): boolean {
    return !!this.interviewerId && !!this.selectedDate && !this.loadingSlots;
  }

  get slotOptions(): SlotOption[] {
    if (!this.selectedDate || !this.interviewerId) return [];
    const ivId = Number(this.interviewerId);
    if (!Number.isFinite(ivId)) return [];

    const day = this.startOfLocalDay(this.selectedDate);
    const out: SlotOption[] = [];
    for (let h = WORK_START_HOUR; h < WORK_END_HOUR_EXCLUSIVE; h++) {
      const slotStart = new Date(day);
      slotStart.setHours(h, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(h + 1, 0, 0, 0);
      const occupied = this.isSlotOccupied(ivId, slotStart, slotEnd);
      out.push({
        startHour: h,
        label: `${this.timeFmt.format(slotStart)} – ${this.timeFmt.format(slotEnd)}`,
        occupied,
        slotStart,
        slotEnd,
      });
    }
    return out;
  }

  onInterviewerChange(): void {
    this.selectedSlotHour = null;
    this.syncScheduledIsoFromSelection();
  }

  onDateChange(): void {
    this.selectedSlotHour = null;
    this.syncScheduledIsoFromSelection();
  }

  selectSlot(slot: SlotOption): void {
    if (slot.occupied) return;
    this.selectedSlotHour = slot.startHour;
    this.syncScheduledIsoFromSelection();
  }

  isSlotSelected(slot: SlotOption): boolean {
    return this.selectedSlotHour === slot.startHour;
  }

  submit(): void {
    if (!this.interviewerId || !this.scheduledDate || !this.interviewType) return;
    this.dialogRef.close({
      interviewerId: this.interviewerId,
      scheduledDate: this.scheduledDate,
      interviewType: this.interviewType,
    } satisfies AssignInterviewerDialogResult);
  }

  private syncScheduledIsoFromSelection(): void {
    if (this.selectedDate == null || this.selectedSlotHour == null) {
      this.scheduledDate = '';
      return;
    }
    const day = this.startOfLocalDay(this.selectedDate);
    const start = new Date(day);
    start.setHours(this.selectedSlotHour, 0, 0, 0);
    this.scheduledDate = start.toISOString();
  }

  private isSlotOccupied(interviewerId: number, slotStart: Date, slotEnd: Date): boolean {
    return this.allInterviews.some((iv) => {
      if (iv.interviewer_id !== interviewerId) return false;
      if (iv.status !== 'SCHEDULED') return false;
      const t = new Date(iv.scheduled_date);
      if (Number.isNaN(t.getTime())) return false;
      return t < slotEnd && t >= slotStart;
    });
  }

  private startOfLocalDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  private addLocalDays(d: Date, days: number): Date {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  }
}
