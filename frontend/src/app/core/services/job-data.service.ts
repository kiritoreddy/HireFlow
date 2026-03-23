import { Injectable, signal, computed } from '@angular/core';
import { Job } from '../models/job.model';
import { JobCandidate } from '../models/candidate.model';

/** Centralized static data for jobs and candidates. Replace with HTTP calls when backend is ready. */
@Injectable({ providedIn: 'root' })
export class JobDataService {
  private jobs = signal<Job[]>([
    {
      id: 1,
      title: 'Senior Software Engineer',
      description: 'Build and maintain web applications using modern frameworks.',
      department: 'Engineering',
      location: 'Remote',
      status: 'Open',
    },
    {
      id: 2,
      title: 'Product Designer',
      description: 'Design user experiences for our product suite.',
      department: 'Design',
      location: 'San Francisco',
      status: 'Open',
    },
    {
      id: 3,
      title: 'Data Analyst',
      description: 'Analyze data and create reports for stakeholders.',
      department: 'Analytics',
      location: 'New York',
      status: 'Closed',
    },
  ]);

  private candidates = signal<JobCandidate[]>([
    {
      id: 'c1',
      jobId: 1,
      name: 'Harper Moore',
      email: 'harper@email.com',
      resume: 'Harper_Moore_Resume.pdf',
      stage: 'Applied',
    },
  ]);

  readonly jobsList = computed(() => this.jobs());
  readonly candidatesList = computed(() => this.candidates());

  getJobs(): Job[] {
    return this.jobs();
  }

  getJobById(id: number): Job | undefined {
    return this.jobs().find((j) => j.id === id);
  }

  getCandidatesForJob(jobId: number): JobCandidate[] {
    return this.candidates().filter((c) => c.jobId === jobId);
  }

  getCandidateCountsByJob(): Map<number, { applied: number; interview: number; selected: number; rejected: number }> {
    const map = new Map<number, { applied: number; interview: number; selected: number; rejected: number }>();
    for (const c of this.candidates()) {
      let counts = map.get(c.jobId);
      if (!counts) {
        counts = { applied: 0, interview: 0, selected: 0, rejected: 0 };
        map.set(c.jobId, counts);
      }
      if (c.stage === 'Applied') counts.applied++;
      else if (c.stage === 'Interview') counts.interview++;
      else if (c.stage === 'Selected') counts.selected++;
      else counts.rejected++;
    }
    return map;
  }

  addJob(job: Omit<Job, 'id'>): Job {
    const currentJobs = this.jobs();
    const nextId = currentJobs.length ? Math.max(...currentJobs.map((j) => j.id)) + 1 : 1;
    const newJob: Job = {
      ...job,
      id: nextId,
    };
    this.jobs.update((list) => [...list, newJob]);
    return newJob;
  }

  updateJob(id: number, updates: Partial<Omit<Job, 'id'>>): void {
    this.jobs.update((list) =>
      list.map((job) => (job.id === id ? { ...job, ...updates } : job))
    );
  }

  setJobStatus(id: number, status: Job['status']): void {
    this.jobs.update((list) =>
      list.map((job) => (job.id === id ? { ...job, status } : job))
    );
  }

  addCandidate(candidate: Omit<JobCandidate, 'id'>): JobCandidate {
    const id = 'c' + crypto.randomUUID().slice(0, 8);
    const newCandidate: JobCandidate = { ...candidate, id };
    this.candidates.update((list) => [...list, newCandidate]);
    return newCandidate;
  }

  updateCandidateStage(id: string, stage: JobCandidate['stage']): void {
    this.candidates.update((list) =>
      list.map((c) => (c.id === id ? { ...c, stage } : c))
    );
  }

  /** Call this when switching to backend – replace internal signals with API responses. */
  loadFromBackend(): void {
    // TODO: this.http.get<Job[]>(API_BASE + '/jobs').subscribe(jobs => this.jobs.set(jobs));
  }
}