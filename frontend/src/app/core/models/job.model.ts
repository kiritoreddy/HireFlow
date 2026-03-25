/** Job model – aligned with backend. Swap static data for API later. */
export interface Job {
  id: number;
  title: string;
  description: string;
  department: string;
  location: string;
  status: 'Open' | 'Closed';
  createdAt?: string;
  updatedAt?: string;
}
